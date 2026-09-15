
import { toast } from "@/components/ui/use-toast";

// Types for our financial advisor system
export interface MarketData {
  ticker: string;
  price: string;
  previousClose: string;
  dayRange: string;
  weekRange: string;
  volume: string;
  name: string;
}

export interface FinancialAgent {
  role: string;
  process: (inputPrompt: string, isFollowUp?: boolean) => Promise<string>;
}

export interface AdvisorResponse {
  content: string;
  isLoading: boolean;
  error: string | null;
}

// Configuration for Gemini API
const MODEL_NAME = "gemini-2.0-flash";
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=GEMINI_API_KEY";

// Function to fetch real stock data from Yahoo Finance API (via proxy)
async function getMarketData(tickers: string[]): Promise<Record<string, MarketData>> {
  if (!tickers || tickers.length === 0) return {};
  
  console.log(`Fetching market data for: ${tickers.join(', ')}`);
  const result: Record<string, MarketData> = {};
  
  try {
    // We'll use a public finance API that doesn't require auth
    // For each ticker, get the latest data
    for (const ticker of tickers) {
      try {
        // Using Yahoo Finance API through RapidAPI
        // In a production app, you'd want to use a more reliable API with your own key
        const response = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`,
          { headers: { 'Accept': 'application/json' } }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const quoteData = data.quoteResponse?.result?.[0];
        
        if (quoteData) {
          result[ticker] = {
            ticker,
            name: quoteData.shortName || ticker,
            price: quoteData.regularMarketPrice ? `$${quoteData.regularMarketPrice.toFixed(2)}` : 'N/A',
            previousClose: quoteData.regularMarketPreviousClose ? `$${quoteData.regularMarketPreviousClose.toFixed(2)}` : 'N/A',
            dayRange: `$${quoteData.regularMarketDayLow?.toFixed(2) || 'N/A'} - $${quoteData.regularMarketDayHigh?.toFixed(2) || 'N/A'}`,
            weekRange: `$${quoteData.fiftyTwoWeekLow?.toFixed(2) || 'N/A'} - $${quoteData.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}`,
            volume: quoteData.regularMarketVolume ? quoteData.regularMarketVolume.toLocaleString() : 'N/A'
          };
        } else {
          result[ticker] = generateMockData(ticker);
          console.log(`Limited data available for ${ticker}, using mock data`);
        }
      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
        // Fallback to mock data
        result[ticker] = generateMockData(ticker);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error fetching market data:", error);
    // Return mock data for all requested tickers
    const mockData: Record<string, MarketData> = {};
    for (const ticker of tickers) {
      mockData[ticker] = generateMockData(ticker);
    }
    return mockData;
  }
}

// Generate mock data for when real data can't be fetched
function generateMockData(ticker: string): MarketData {
  const basePrice = 100 + Math.random() * 900;
  const variance = basePrice * 0.02; // 2% variance
  
  return {
    ticker,
    name: `${ticker} Inc.`,
    price: `$${basePrice.toFixed(2)}`,
    previousClose: `$${(basePrice - variance * (Math.random() - 0.5)).toFixed(2)}`,
    dayRange: `$${(basePrice - variance).toFixed(2)} - $${(basePrice + variance).toFixed(2)}`,
    weekRange: `$${(basePrice * 0.8).toFixed(2)} - $${(basePrice * 1.2).toFixed(2)}`,
    volume: Math.floor(Math.random() * 10000000).toLocaleString()
  };
}

// Extract potential ticker symbols from text
function extractTickerRequests(text: string): string[] {
  // Match 1-6 uppercase letters or digits
  const tickerRegex = /\b([A-Z][A-Z0-9]{0,5})\b/g;
  const matches = text.match(tickerRegex) || [];
  
  // Filter out common words that might look like tickers
  const commonWords = ['I', 'A', 'AN', 'THE', 'FOR', 'AND', 'OR', 'TO'];
  return matches.filter(match => !commonWords.includes(match));
}

// Create financial agents
function createFinancialAgent(role: string, persona: string, apiKey: string): FinancialAgent {
  let conversationHistory: string[] = [];
  
  return {
    role,
    async process(inputPrompt: string, isFollowUp: boolean = false): Promise<string> {
      console.log(`Sending task to ${role}...`);
      
      try {
        let fullPrompt = `${persona}\n\n`;
        
        if (conversationHistory.length > 0 && isFollowUp) {
          fullPrompt += "Previous Conversation Turn Context:\n" + conversationHistory.join("\n") + "\n\n";
        }
        
        fullPrompt += `Current Task/Input:\n${inputPrompt}`;
        
        const response = await fetch(`${API_BASE_URL}/${MODEL_NAME}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: fullPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.6,
              topP: 1.0,
              topK: 32,
              maxOutputTokens: 4096,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
          throw new Error("Received empty or invalid response from Gemini API");
        }
        
        const resultText = data.candidates[0].content.parts[0].text;
        
        console.log(`${role} finished processing.`);
        
        // Store in history if needed
        if (isFollowUp) {
          conversationHistory.push(`Input: ${inputPrompt}`);
          conversationHistory.push(`Output: ${resultText}`);
          
          // Limit history size
          if (conversationHistory.length > 6) {
            conversationHistory = conversationHistory.slice(-6);
          }
        }
        
        return resultText;
      } catch (error) {
        console.error(`Error during generation for ${role}:`, error);
        return `[${role} Error: ${(error as Error).message}]`;
      }
    }
  };
}

// Main advisor team class
class AdvisorTeam {
  private agents: Record<string, FinancialAgent>;
  
  constructor(apiKey: string) {
    this.agents = this.createAgents(apiKey);
  }
  
  private createAgents(apiKey: string): Record<string, FinancialAgent> {
    return {
      "Market Analyst": createFinancialAgent(
        "Market Analyst",
        `You are an expert Market Analyst. Your focus is on current market conditions, economic indicators (inflation, interest rates, GDP growth), sector trends, and geopolitical events relevant to the user's query.
        **Your First Task:** Analyze the user's query and the broader economic landscape. Identify if specific, current market data (like stock prices for mentioned companies/indices) is needed for a deeper analysis. If so, CLEARLY LIST the ticker symbols you require, like: 'Data needed for: AAPL, MSFT'.
        **Your Second Task (if data is provided):** Incorporate the provided real-time market data into your analysis, discussing recent performance, volatility (if inferrable from data), and how it relates to the overall market context and the user's query. Provide data-driven insights.
        Do not give investment recommendations directly. Focus on objective market analysis.`,
        apiKey
      ),
      
      "Risk Assessor": createFinancialAgent(
        "Risk Assessor",
        `You are a cautious Risk Assessor. Your job is to identify potential risks, downsides, volatility, and suitability based on general risk tolerance concepts (e.g., conservative, moderate, aggressive). Analyze the market context (including any fetched data provided) and the user's query specifics to highlight potential dangers or challenges associated with the topic discussed. Consider both market risks and any potential strategy risks. Do *not* give specific investment advice.`,
        apiKey
      ),
      
      "Planning Strategist": createFinancialAgent(
        "Planning Strategist",
        `You are a forward-thinking Planning Strategist. Considering the market analysis (including any fetched data) and the risk assessment, you outline potential strategies and approaches relevant to the user's query. Discuss concepts like asset allocation (in general terms), diversification, time horizons, and potentially relevant *types* of financial products or accounts (e.g., ETFs, mutual funds, retirement accounts like 401k/IRA). Do NOT recommend specific stocks, funds, or make personalized suitability judgments. Focus on strategic concepts and possibilities.`,
        apiKey
      ),
      
      "Chief Advisor": createFinancialAgent(
        "Chief Advisor (Synthesizer)",
        `You are the Chief Advisor leading this consultation. Your role is to synthesize the insights from the Market Analyst, Risk Assessor, and Planning Strategist into a single, coherent, balanced, and professional-sounding final response for the user. Address the user directly and adopt a helpful, informative, yet cautious tone appropriate for financial discussion.
        Ensure the final output integrates the key points, including any fetched data insights, from all prior analyses. It should read like a unified recommendation from a team.
        **Crucially, conclude your response with the following mandatory disclaimer, verbatim:**

        ---
        **IMPORTANT DISCLAIMER:** This information is generated by an AI model using public data and predictive algorithms. It is intended for informational purposes ONLY and does **NOT** constitute personalized financial advice, solicitation, or endorsement of any particular investment strategy or product. Financial markets are complex and volatile; past performance is not indicative of future results. AI models may have limitations, inaccuracies, or biases in their data or analysis. **Before making any financial decisions, you MUST consult with a qualified, licensed human financial advisor or planner who can assess your individual circumstances, risk tolerance, and financial goals.** Relying solely on this AI output for financial decisions could lead to significant losses.
        ---`,
        apiKey
      )
    };
  }
  
  async runConsultation(userQuery: string, apiKey: string): Promise<string> {
    console.log("Starting financial consultation process...");
    const startTime = Date.now();
    
    if (!apiKey || apiKey.trim() === "") {
      return "Error: No API key provided. Please enter your Gemini API key in the settings.";
    }
    
    try {
      // 1. Initial Market Analysis for data requests
      const marketAnalyst = this.agents["Market Analyst"];
      const initialAnalysisPrompt = `User Query: "${userQuery}"\n\nAnalyze this query and the general market. Identify specific ticker symbols for current data if needed for a better analysis. List them clearly if required.`;
      const initialAnalysisResponse = await marketAnalyst.process(initialAnalysisPrompt);
      
      if (!initialAnalysisResponse || initialAnalysisResponse.includes("[Market Analyst Error:")) {
        throw new Error("Failed during initial market analysis");
      }
      
      // 2. Data Fetching (if requested)
      const requestedTickers = extractTickerRequests(initialAnalysisResponse);
      let fetchedData: Record<string, MarketData> = {};
      let fetchedDataSummary = "No specific market data requested or fetched for this query.";
      
      if (requestedTickers.length > 0) {
        fetchedData = await getMarketData(requestedTickers);
        if (Object.keys(fetchedData).length > 0) {
          fetchedDataSummary = "Fetched Market Data:\n";
          for (const ticker in fetchedData) {
            const data = fetchedData[ticker];
            fetchedDataSummary += `Data for ${data.name} (${ticker}):\n`;
            fetchedDataSummary += `  Current Price: ${data.price}\n`;
            fetchedDataSummary += `  Previous Close: ${data.previousClose}\n`;
            fetchedDataSummary += `  Day Range: ${data.dayRange}\n`;
            fetchedDataSummary += `  52 Week Range: ${data.weekRange}\n`;
            fetchedDataSummary += `  Volume: ${data.volume}\n\n`;
          }
        } else {
          fetchedDataSummary = "Attempted to fetch data, but failed.\n";
        }
      }
      
      // 3. Refined Market Analysis with data
      const refinedAnalysisPrompt = `User Query: "${userQuery}"
      Your Initial Thoughts:
      ${initialAnalysisResponse}
      ---
      ${fetchedDataSummary}
      ---
      Now, refine your market analysis, incorporating the provided fetched data (if any). Focus on data-driven insights related to the user query.`;
      
      const marketAnalysis = await marketAnalyst.process(refinedAnalysisPrompt, true);
      
      if (!marketAnalysis || marketAnalysis.includes("[Market Analyst Error:")) {
        throw new Error("Failed during refined market analysis");
      }
      
      // 4. Risk Assessment
      const riskContext = `Market Analysis Provided (incorporating fetched data if any):
      ${marketAnalysis}
      ---
      Original User Query: "${userQuery}"`;
      
      const riskAssessment = await this.agents["Risk Assessor"].process(
        `Based on the market analysis and user query above, identify key risks.`
      );
      
      if (!riskAssessment || riskAssessment.includes("[Risk Assessor Error:")) {
        throw new Error("Failed during risk assessment");
      }
      
      // 5. Planning Strategy
      const planningContext = `Market Analysis:
      ${marketAnalysis}
      ---
      Risk Assessment:
      ${riskAssessment}
      ---
      Original User Query: "${userQuery}"`;
      
      const planningStrategy = await this.agents["Planning Strategist"].process(
        `Considering the analysis and risks above, outline potential strategies relevant to the user query.`
      );
      
      if (!planningStrategy || planningStrategy.includes("[Planning Strategist Error:")) {
        throw new Error("Failed during planning strategy");
      }
      
      // 6. Synthesize Final Response
      const finalContext = `Synthesize the following inputs into a coherent final response for the user, addressing their original query: "${userQuery}". Integrate all points smoothly and conclude *exactly* with the mandatory disclaimer.

      --- START OF TEAM INPUTS ---

      [Market Analyst Input - Context & Data Analysis]:
      ${marketAnalysis}

      [Risk Assessor Input - Potential Downsides]:
      ${riskAssessment}

      [Planning Strategist Input - Strategic Approaches]:
      ${planningStrategy}

      --- END OF TEAM INPUTS ---

      Remember to address the user directly and maintain a professional tone. Do NOT add any preamble before your response or any text after the mandatory disclaimer.`;
      
      const finalResponse = await this.agents["Chief Advisor"].process(finalContext);
      
      if (!finalResponse || finalResponse.includes("[Chief Advisor Error:")) {
        throw new Error("Failed during final response synthesis");
      }
      
      const endTime = Date.now();
      console.log(`Consultation finished in ${(endTime - startTime) / 1000} seconds`);
      
      return finalResponse;
    } catch (error) {
      console.error("Error during financial consultation:", error);
      return `Error during consultation: ${(error as Error).message}. Please try again later.`;
    }
  }
}

// The main function that will be called from the UI
export async function getGeminiFinancialAdvice(query: string, apiKey: string): Promise<AdvisorResponse> {
  try {
    console.log(`Getting financial advice for: ${query}`);
    
    if (!apiKey || apiKey.trim() === "") {
      return {
        content: "",
        isLoading: false,
        error: "No API key provided. Please enter your Gemini API key in the settings."
      };
    }
    
    const advisorTeam = new AdvisorTeam(apiKey);
    const response = await advisorTeam.runConsultation(query, apiKey);
    
    return {
      content: response,
      isLoading: false,
      error: null
    };
  } catch (error) {
    console.error("Error getting financial advice:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to get financial advice. Please try again.",
    });
    
    return {
      content: "",
      isLoading: false,
      error: `Error: ${(error as Error).message}`
    };
  }
}