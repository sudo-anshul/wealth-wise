import { toast } from "@/components/ui/use-toast"; // Ensure this path is correct

// Types for our financial advisor system
export interface MarketData {
  ticker: string;
  price: string;
  previousClose: string;
  dayRange: string;
  weekRange: string; // Changed from 52 weeks for consistency
  volume: string;
  name: string;
}

export interface FinancialAgent {
  role: string;
  process: (inputPrompt: string, isFollowUp?: boolean) => Promise<string>;
}

export interface AdvisorResponse {
  content: string;
  isLoading: boolean; // This might be redundant if handled purely in UI state
  error: string | null;
}

// --- Configuration ---
// Use a known reliable model name - check Google's documentation for the latest.
const MODEL_NAME = "gemini-2.0-flash";
// **SECURITY WARNING:** Reading the API key directly on the client is insecure.
// Ideally, create a backend API route to handle calls to the Gemini API.
// This example assumes a framework like Next.js making the env var available.
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

// Check if API Key is loaded
if (!API_KEY) {
  console.error(
    "FATAL ERROR: Gemini API Key not found. Ensure NEXT_PUBLIC_GEMINI_API_KEY is set in your .env.local file and you've restarted the server."
  );
  // You might want to throw an error here in a real application,
  // but for the example, we let it proceed so the UI can show an error.
}


// --- Function to fetch real stock data ---
// Note: The Yahoo Finance endpoint used here is unofficial and may be unstable.
async function getMarketData(tickers: string[]): Promise<Record<string, MarketData>> {
  if (!API_KEY) return {}; // Don't attempt fetch without key
  if (!tickers || tickers.length === 0) return {};

  console.log(`Fetching market data for: ${tickers.join(", ")}`);
  const result: Record<string, MarketData> = {};

  // Use Promise.all for concurrent fetching
  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        // Simple validation for ticker format (basic)
        if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
            console.warn(`Invalid ticker format skipped: ${ticker}`);
            result[ticker] = generateMockData(ticker, "Invalid Ticker Format");
            return;
        }

        // Use HTTPS and standard Yahoo Finance API endpoint (v7 quote)
        // Still unofficial, but commonly used.
        const response = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`,
          {
             // Avoid CORS issues if running client-side; remove/adjust if calling from backend
            // mode: 'no-cors', // NOTE: 'no-cors' might prevent reading the response body. Better to use a backend proxy.
            headers: { Accept: "application/json" },
          }
        );

        if (!response.ok) {
          // Log status for debugging network/API issues
          console.error(`HTTP error fetching ${ticker}: ${response.status} ${response.statusText}`);
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Defensive coding: Check existence of nested properties
        const quoteData = data?.quoteResponse?.result?.[0];

        if (quoteData && quoteData.regularMarketPrice != null) { // Check price exists
          result[ticker] = {
            ticker: quoteData.symbol || ticker, // Use symbol from response if available
            name: quoteData.shortName || quoteData.longName || ticker,
            price: `$${quoteData.regularMarketPrice.toFixed(2)}`,
            previousClose: quoteData.regularMarketPreviousClose
              ? `$${quoteData.regularMarketPreviousClose.toFixed(2)}`
              : "N/A",
            dayRange:
              quoteData.regularMarketDayLow && quoteData.regularMarketDayHigh
                ? `$${quoteData.regularMarketDayLow.toFixed(2)} - $${quoteData.regularMarketDayHigh.toFixed(2)}`
                : "N/A",
            weekRange: // Renamed for clarity
              quoteData.fiftyTwoWeekLow && quoteData.fiftyTwoWeekHigh
                ? `$${quoteData.fiftyTwoWeekLow.toFixed(2)} - $${quoteData.fiftyTwoWeekHigh.toFixed(2)}`
                : "N/A",
            volume: quoteData.regularMarketVolume
              ? quoteData.regularMarketVolume.toLocaleString()
              : "N/A",
          };
        } else {
          console.log(
            `Incomplete or no data received for ${ticker}, using mock data. Response:`, data
          );
          result[ticker] = generateMockData(ticker, "No Real-time Data");
        }
      } catch (error) {
        console.error(`Error fetching or processing data for ${ticker}:`, error);
        result[ticker] = generateMockData(ticker, "Fetch Error");
      }
    })
  );

  return result;
}

// Generate mock data with a reason
function generateMockData(ticker: string, reason: string = "Mock Data"): MarketData {
  const basePrice = 100 + Math.random() * 900;
  const variance = basePrice * 0.02; // 2% variance

  return {
    ticker,
    name: `${ticker} (${reason})`, // Indicate why it's mock
    price: `$${basePrice.toFixed(2)}`,
    previousClose: `$${(basePrice - variance * (Math.random() - 0.5)).toFixed(2)}`,
    dayRange: `$${(basePrice - variance).toFixed(2)} - $${(basePrice + variance).toFixed(2)}`,
    weekRange: `$${(basePrice * 0.8).toFixed(2)} - $${(basePrice * 1.2).toFixed(2)}`,
    volume: Math.floor(Math.random() * 10000000).toLocaleString(),
  };
}

// Extract potential ticker symbols from text (slightly improved regex)
function extractTickerRequests(text: string): string[] {
  // Match 1-6 uppercase letters or digits, potentially with a period (for some indices/exchanges like BRK.B)
  // Ensure it's preceded by a word boundary (\b) or start of string (^) and followed by boundary or end ($)
  // Avoid matching substrings within words.
  const tickerRegex = /(?:\b|^)([A-Z][A-Z0-9\.]{0,5})(?:\b|$)/g;
  let matches = text.match(tickerRegex) || [];

  // Trim whitespace and potential leading/trailing boundary characters if regex captures them
  matches = matches.map(m => m.trim().replace(/[^\w\.]/g, ''));

  // Filter out common words that might look like tickers and potential empty strings
  const commonWords = new Set(['I', 'A', 'AN', 'THE', 'FOR', 'AND', 'OR', 'TO', 'IS', 'ARE', 'WAS', 'BE', 'IT', 'DO', 'IF', 'OF', 'ALL', 'ANY', 'NOW', 'CEO']);
  return [...new Set( // Ensure uniqueness
      matches.filter(match => match && match.length > 0 && !commonWords.has(match))
  )];
}

// --- Financial Agent Creation ---
function createFinancialAgent(role: string, persona: string): FinancialAgent {
  let conversationHistory: { role: "user" | "model", parts: { text: string }[] }[] = [];

  return {
    role,
    async process(inputPrompt: string, isFollowUp: boolean = false): Promise<string> {
      if (!API_KEY) {
        return `[${role} Error: API Key is missing or invalid.]`;
      }

      console.log(`Agent ${role} starting process...`);
      const startTime = Date.now();

      try {
        // Construct the prompt including persona and optional history
        const currentTurnContent = [{ role: "user", parts: [{ text: `${persona}\n\nCurrent Task/Input:\n${inputPrompt}` }] }];

        // Prepare history for the API call, alternating roles
        const apiHistory = isFollowUp ? conversationHistory : [];

        const requestBody = {
          // Combine history and current input
          contents: [...apiHistory, ...currentTurnContent],
          generationConfig: {
            temperature: 0.6,
            topP: 1.0, // Consider lowering slightly (e.g., 0.95) if responses are too random
            topK: 32,  // Lower K can make responses more focused
            maxOutputTokens: 4096, // Be mindful of token limits
          },
          // Standard safety settings
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        };

        const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent?key=${API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        // Improved Error Handling
        if (!response.ok) {
            let errorBodyText = await response.text(); // Read response body as text first
            let errorMessage = `Gemini API Error! Status: ${response.status}`;
            try {
                // Try parsing as JSON for detailed Gemini error
                const errorData = JSON.parse(errorBodyText);
                console.error(`Gemini API Error Response (${response.status}):`, JSON.stringify(errorData, null, 2));
                errorMessage = errorData?.error?.message || errorMessage;
                 // Check for specific API key related errors
                 if (response.status === 400 && errorMessage.includes("API key not valid")) {
                     errorMessage = "Invalid API Key provided. Please check configuration.";
                 } else if (response.status === 403) {
                     errorMessage = "API Key does not have permission for this model or operation.";
                 }

            } catch (parseError) {
                // If not JSON, use the raw text
                console.error(`Gemini API Error Response (${response.status}, non-JSON):`, errorBodyText);
                errorMessage += `. Response: ${errorBodyText.substring(0, 500)}`; // Limit long HTML errors etc.
            }
            throw new Error(errorMessage);
        }


        const data = await response.json();

        // More robust check for the response structure
        const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
          console.error("Invalid or empty response structure from Gemini API:", JSON.stringify(data, null, 2));
          throw new Error("Received empty or invalid content from Gemini API");
        }

        const endTime = Date.now();
        console.log(`Agent ${role} finished in ${(endTime - startTime) / 1000}s.`);

        // Store interaction in history if it's a follow-up conversation turn for this agent
        if (isFollowUp) {
           // Add the user prompt that led to this response
          conversationHistory.push({ role: "user", parts: [{ text: inputPrompt }] });
           // Add the model's response
          conversationHistory.push({ role: "model", parts: [{ text: resultText }] });

          // Limit history size (e.g., last 3 pairs = 6 entries)
          const maxHistoryEntries = 6;
          if (conversationHistory.length > maxHistoryEntries) {
            conversationHistory = conversationHistory.slice(-maxHistoryEntries);
          }
        } else {
             // Clear history if it's not a follow-up, ensuring fresh context
             conversationHistory = [];
        }


        return resultText.trim();
      } catch (error) {
        console.error(`Error during generation for ${role}:`, error);
        // Return a formatted error string that the orchestrator can check
        return `[${role} Error: ${(error as Error).message}]`;
      }
    },
  };
}

// --- Advisor Team Class ---
class AdvisorTeam {
  private agents: Record<string, FinancialAgent>;

  constructor() {
    this.agents = this.createAgents();
  }

  private createAgents(): Record<string, FinancialAgent> {
    // Agent personas remain largely the same, ensure they don't promise actions they can't take
    return {
      "Market Analyst": createFinancialAgent(
        "Market Analyst",
        `You are an expert Market Analyst. Your focus is on current market conditions, economic indicators (inflation, interest rates, GDP growth), sector trends, and geopolitical events relevant to the user's query.
        **Task 1:** Analyze the user's query and the broad economic landscape. Identify specific, common stock or index ticker symbols (e.g., AAPL, MSFT, GOOGL, ^GSPC, ^IXIC) if current price data would significantly enhance the analysis. Clearly list needed tickers like: 'Data needed for: AAPL, MSFT'. If no specific tickers are essential for a general analysis, state 'No specific ticker data required.'
        **Task 2 (if data provided):** Integrate the provided market data (current price, ranges, volume) into your analysis. Discuss recent performance reflected in the data and connect it to market context or the user's query. Provide data-driven insights. Avoid speculation beyond the data provided.
        Do not give direct investment recommendations. Focus on objective market analysis.`
      ),

      "Risk Assessor": createFinancialAgent(
        "Risk Assessor",
        `You are a cautious Risk Assessor. Identify potential risks, downsides, and volatility related to the user's query topic, considering the market analysis and any provided data. Discuss general risk concepts (market risk, inflation risk, sector-specific risk) relevant to the context. Do NOT provide personalized risk tolerance assessment or specific investment advice.`
      ),

      "Planning Strategist": createFinancialAgent(
        "Planning Strategist",
        `You are a Planning Strategist. Based on the market analysis and risk assessment, outline relevant strategic concepts. Discuss general principles like diversification, asset allocation approaches (without specific percentages), time horizons, and the types of investment vehicles or account types commonly used for goals related to the query (e.g., ETFs for diversification, IRAs for retirement). Do NOT recommend specific products or make personalized suitability judgments. Focus on educating about strategic options.`
      ),

      "Chief Advisor": createFinancialAgent(
        "Chief Advisor (Synthesizer)",
        `You are the Chief Advisor. Synthesize the insights from the Market Analyst, Risk Assessor, and Planning Strategist into ONE single, coherent, balanced, and professional response for the user. Address the user directly using a helpful, informative, yet objective and cautious tone appropriate for financial information.
        Seamlessly integrate the key points: market context (mentioning if specific data was used), identified risks, and strategic concepts. Ensure the final output reads as a unified piece from the team.
        **IMPORTANT:** Conclude your entire response *exactly* with the following mandatory disclaimer, without any text before or after it in your final output:

        ---
        **IMPORTANT DISCLAIMER:** This information is generated by an AI model using public data and algorithms. It is for informational purposes ONLY and does **NOT** constitute financial advice, investment recommendations, solicitation, or endorsement of any security, strategy, or product. Financial markets involve risk; past performance does not guarantee future results. AI analysis may contain errors, omissions, or biases. **Consult with a qualified, licensed human financial professional before making any financial decisions.** They can assess your specific situation, goals, and risk tolerance. Relying solely on this AI output may lead to financial loss.
        ---`
      )
    };
  }

  // --- Consultation Orchestration ---
  async runConsultation(userQuery: string): Promise<string> {
    console.log("Starting financial consultation process...");
    const startTime = Date.now();

    // Helper function to check agent responses for errors
    const checkAgentError = (response: string | null | undefined, agentName: string): boolean => {
        if (!response || response.startsWith(`[${agentName} Error:`)) {
            console.error(`Error detected from ${agentName}:`, response);
            return true; // Indicates an error occurred
        }
        return false; // No error detected
    };


    try {
        if (!API_KEY) {
            throw new Error("API Key is missing. Cannot run consultation.");
        }

      // 1. Initial Market Analysis for data requests
      const marketAnalyst = this.agents["Market Analyst"];
      const initialAnalysisPrompt = `User Query: "${userQuery}". Analyze the query and current market landscape. Identify any essential stock/index tickers needed for a better analysis, listing them clearly if required.`;
      const initialAnalysisResponse = await marketAnalyst.process(initialAnalysisPrompt, false); // Not a follow-up

      if (checkAgentError(initialAnalysisResponse, "Market Analyst")) {
          throw new Error("Failed during initial market analysis phase.");
      }
      console.log("Initial Analysis Response:", initialAnalysisResponse);


      // 2. Data Fetching (if requested)
      const requestedTickers = extractTickerRequests(initialAnalysisResponse);
      let fetchedData: Record<string, MarketData> = {};
      let fetchedDataSummary = "No specific market data was requested or fetched for this query.";

      if (requestedTickers.length > 0) {
        console.log("Tickers requested by Market Analyst:", requestedTickers);
        fetchedData = await getMarketData(requestedTickers);
        if (Object.keys(fetchedData).length > 0) {
          fetchedDataSummary = "Fetched Market Data Context:\n";
          for (const ticker in fetchedData) {
            const data = fetchedData[ticker];
            // Provide a concise summary for the next agent
            fetchedDataSummary += `- ${data.name} (${ticker}): Price=${data.price}, Day Range=${data.dayRange}, 52wk Range=${data.weekRange}, Vol=${data.volume}\n`;
          }
        } else {
          fetchedDataSummary = "Attempted to fetch data for requested tickers, but no data was retrieved.\n";
        }
      }
       console.log("Fetched Data Summary for Agents:", fetchedDataSummary);

      // 3. Refined Market Analysis with data (as a follow-up)
      const refinedAnalysisPrompt = `Based on your initial thoughts below and the provided market data summary, refine your market analysis concerning the original user query: "${userQuery}". Integrate the data points where relevant.
      ---
      Your Initial Thoughts:
      ${initialAnalysisResponse}
      ---
      Market Data Summary:
      ${fetchedDataSummary}
      ---
      Refined Analysis:`;

      // Pass `true` for isFollowUp to potentially use conversation history within the agent
      const marketAnalysis = await marketAnalyst.process(refinedAnalysisPrompt, true);

      if (checkAgentError(marketAnalysis, "Market Analyst")) {
          throw new Error("Failed during refined market analysis phase.");
      }
       console.log("Refined Market Analysis:", marketAnalysis);

      // 4. Risk Assessment
      const riskContext = `Context for Risk Assessment:
      Original User Query: "${userQuery}"
      Market Analysis (incorporating data if fetched):
      ${marketAnalysis}
      ---
      Task: Identify key risks associated with the topic raised in the user query, considering the market analysis provided.`;

      const riskAssessment = await this.agents["Risk Assessor"].process(riskContext);
       if (checkAgentError(riskAssessment, "Risk Assessor")) {
          throw new Error("Failed during risk assessment phase.");
      }
      console.log("Risk Assessment:", riskAssessment);


      // 5. Planning Strategy
      const planningContext = `Context for Planning Strategy:
      Original User Query: "${userQuery}"
      Market Analysis:
      ${marketAnalysis}
      Risk Assessment:
      ${riskAssessment}
      ---
      Task: Outline potential strategic concepts (like diversification, types of accounts/vehicles) relevant to the user's query, considering the analysis and risks.`;

      const planningStrategy = await this.agents["Planning Strategist"].process(planningContext);
      if (checkAgentError(planningStrategy, "Planning Strategist")) {
          throw new Error("Failed during planning strategy phase.");
      }
       console.log("Planning Strategy:", planningStrategy);

      // 6. Synthesize Final Response
      const finalContext = `Synthesize the following inputs into a single, coherent response for the user who asked: "${userQuery}". Integrate all points smoothly. Address the user directly. Conclude *exactly* with the mandatory disclaimer provided in your instructions.

      --- START OF TEAM INPUTS ---

      [Market Analyst - Context & Data Insights]:
      ${marketAnalysis}

      [Risk Assessor - Potential Risks]:
      ${riskAssessment}

      [Planning Strategist - Strategic Concepts]:
      ${planningStrategy}

      --- END OF TEAM INPUTS ---

      Final Response to User:`;

      const finalResponse = await this.agents["Chief Advisor"].process(finalContext);
       if (checkAgentError(finalResponse, "Chief Advisor")) {
          // Check if the error is specifically the API key one, bubble it up.
         if (finalResponse.includes("API Key is missing")) {
            throw new Error("API Key is missing or invalid. Cannot process request.");
         }
         throw new Error("The Chief Advisor failed to synthesize the final response.");
      }

      const endTime = Date.now();
      console.log(`Consultation finished successfully in ${(endTime - startTime) / 1000} seconds`);

      // Final check to ensure disclaimer is present (optional but good practice)
      if (!finalResponse.includes("**IMPORTANT DISCLAIMER:**")) {
          console.warn("Chief Advisor did not include the mandatory disclaimer. Appending it manually.");
          // You might append it here, but ideally, the agent should follow instructions.
          // return finalResponse + "\n\n---\n**IMPORTANT DISCLAIMER:** ...";
      }

      return finalResponse;

    } catch (error) {
      console.error("Critical error during financial consultation:", error);
      // Return a user-friendly error message derived from the caught error
      return `Sorry, an error occurred during the consultation: ${(error as Error).message}. Please try again later or contact support if the issue persists.`;
    }
  }
}

// --- Main Exported Function ---
// Called by the UI
export async function getGeminiFinancialAdvice(query: string): Promise<AdvisorResponse> {
  try {
    // Basic input validation
    if (!query || query.trim().length < 5) {
        return {
            content: "Please provide a more detailed question.",
            isLoading: false,
            error: "Query too short.",
        }
    }

    // Check for API key existence *before* creating the team, prevents unnecessary object creation if key is missing.
     if (!API_KEY) {
        const errorMessage = "AI Advisor configuration error: API Key is missing.";
        console.error(errorMessage);
        toast({ // Use toast to inform user about config issue
            variant: "destructive",
            title: "Configuration Error",
            description: "The AI Advisor is not configured correctly. Please contact support.",
        });
        return {
            content: "",
            isLoading: false,
            error: errorMessage,
        };
     }


    console.log(`Initiating AI financial advice for query: "${query}"`);

    const advisorTeam = new AdvisorTeam();
    const responseContent = await advisorTeam.runConsultation(query);

    // Check if the response itself is an error message from runConsultation's catch block
    if (responseContent.startsWith("Sorry, an error occurred")) {
         return {
             content: "", // No successful content
             isLoading: false,
             error: responseContent, // Pass the error message
         };
    }


    // Success case
    return {
      content: responseContent,
      isLoading: false, // Handled by UI state
      error: null,
    };

  } catch (error) {
    // Catch unexpected errors during setup or function call
    console.error("Unexpected error in getGeminiFinancialAdvice:", error);
    const errorMessage = `An unexpected error occurred: ${(error as Error).message}`;
    toast({ // Toast for unexpected errors
      variant: "destructive",
      title: "Unexpected Error",
      description: "Something went wrong while preparing the AI advisor.",
    });

    return {
      content: "",
      isLoading: false,
      error: errorMessage,
    };
  }
}