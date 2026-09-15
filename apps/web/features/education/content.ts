export type Lesson = {
  id: string; title: string; subtitle: string; category: string; minutes: number; color: 'forest' | 'coral' | 'lime';
  takeaway: string; sections: { title: string; paragraphs: string[]; example?: { label: string; text: string } }[];
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string };
  next: { label: string; path: string };
};

export const lessons: Lesson[] = [
  {
    id: 'compounding', title: 'Small amounts. A surprising future.', subtitle: 'How time and repeated contributions work together.', category: 'Money foundations', minutes: 5, color: 'forest',
    takeaway: 'Time can help growth build on growth. Contributions are in your control; returns are not.',
    sections: [
      { title: 'Growth can become part of the starting point.', paragraphs: ['Compounding means that a return can earn a return of its own. When money stays invested, a later gain is calculated on a balance that may include earlier gains. It is a mathematical effect, not a promise that an investment will rise every year.', 'The same mechanism can work against you when interest is added to an unpaid debt. Understanding the rate, timing and balance matters on both sides of your financial picture.'], example: { label: 'Two years, one simple example', text: 'Start with ₹10,000 and assume a steady 8% return once a year. After year one: ₹10,800. The second year earns 8% of ₹10,800, or ₹864, leaving ₹11,664. This example excludes fees, taxes and inflation.' } },
      { title: 'A regular contribution adds a different kind of progress.', paragraphs: ['A SIP is a way of contributing regularly. It does not remove market risk, but it can make the act of setting money aside easier to maintain. Separate the money you contribute from the growth you assume when reading a projection.', 'The WealthWise SIP calculator adds contributions at the end of each month and uses the selected annual rate divided by 12. A real investment will not follow that smooth curve.'] },
      { title: 'Give the assumptions some attention.', paragraphs: ['Try more than one return assumption and a shorter or longer horizon. Then ask whether the contribution fits your everyday budget. An impressive future number is less useful than a plan you can sustain.', 'Inflation changes what a future rupee can buy. A nominal projection shows rupees at the future date; it does not automatically show today’s purchasing power.'] },
    ],
    quiz: { question: 'With ₹10,800 at the start of year two and an assumed 8% annual return, how much is the second year’s gain?', options: ['₹800 — the original first-year gain', '₹864 — 8% of the new balance', '₹1,080 — 10% of the new balance'], correctIndex: 1, explanation: '₹10,800 × 8% = ₹864. The earlier ₹800 gain is now part of the balance that can grow.' }, next: { label: 'Try a SIP scenario', path: 'tools?kind=sip' },
  },
  {
    id: 'emergency-fund', title: 'A little peace of mind, on standby.', subtitle: 'Think about a buffer in months of essential spending.', category: 'Everyday money', minutes: 4, color: 'lime',
    takeaway: 'A useful buffer is based on your expenses, income reliability and access needs—not a universal round number.',
    sections: [
      { title: 'Start with the expenses that would continue.', paragraphs: ['Housing, food, utilities, necessary transport and minimum debt payments often continue during an interruption to income. List your essentials separately from spending you could pause.', 'The amount you choose also depends on dependants, insurance, job stability and other accessible resources. A single target cannot fit every household.'], example: { label: 'Put the target in context', text: 'If essentials are ₹35,000 a month, three months is ₹1,05,000 and six months is ₹2,10,000. These are scenarios to compare, not a recommendation that everyone needs the same number of months.' } },
      { title: 'Availability is part of the job.', paragraphs: ['Money intended for an unexpected expense should be evaluated for access, price stability and withdrawal conditions. A volatile investment could be down when you need to use it.', 'An emergency goal can earmark part of your existing savings. Earmarking does not create a new asset: the same money should not be counted again in your net worth.'] },
      { title: 'Build it in manageable steps.', paragraphs: ['A smaller first milestone can be useful. After you use part of the buffer, review how to replenish it. Revisit the target when your essential spending or responsibilities change.'] },
    ],
    quiz: { question: 'With essential spending of ₹35,000 per month, what amount represents a three-month buffer?', options: ['₹70,000', '₹1,05,000', '₹2,10,000'], correctIndex: 1, explanation: '₹35,000 × 3 = ₹1,05,000. The appropriate number of months depends on your circumstances.' }, next: { label: 'Give your buffer a goal', path: 'goals' },
  },
  {
    id: 'diversification', title: 'Give your money more than one story.', subtitle: 'Understand concentration, allocation and their limits.', category: 'Investing foundations', minutes: 6, color: 'coral',
    takeaway: 'Diversification changes the sources of risk. It does not make an investment risk-free.',
    sections: [
      { title: 'Look through the number of holdings.', paragraphs: ['Owning several funds does not necessarily mean owning different risks. Funds may hold many of the same companies or be exposed to the same sector, country or market conditions.', 'Asset allocation is the share of a portfolio held in each asset group. It is a starting point for understanding the mix, not a complete measure of risk.'], example: { label: 'Read the mix', text: 'A portfolio with ₹60,000 in equity, ₹30,000 in fixed income and ₹10,000 in gold has a 60% / 30% / 10% allocation. Those labels alone do not tell you the quality, liquidity or overlap of the underlying investments.' } },
      { title: 'Match the question to the time horizon.', paragraphs: ['Money for a near-term expense has a different job from money intended for a distant goal. Your need for access and ability to tolerate a decline should be considered alongside an expected return.', 'Prices can move together during difficult markets. Diversification can reduce dependence on one investment, but it cannot guarantee that the overall portfolio will avoid a loss.'] },
      { title: 'Review drift, not just today’s percentages.', paragraphs: ['When assets grow at different rates, the allocation changes. Rebalancing means returning towards a chosen mix, either through new contributions or changes to holdings. Costs, taxes and constraints matter before making any real change.', 'In WealthWise, manual prices carry an as-of date. An allocation based on old prices is an old view, even if the chart is freshly opened.'] },
    ],
    quiz: { question: 'Three funds all hold a similar group of technology companies. What is the best conclusion?', options: ['Three fund names guarantee diversification', 'The portfolio may still be concentrated in similar risks', 'The portfolio cannot fall because it contains funds'], correctIndex: 1, explanation: 'Different product names can conceal similar underlying holdings. Look at overlap and exposure, not only the number of investments.' }, next: { label: 'Review your allocation', path: 'portfolio' },
  },
  {
    id: 'fund-costs', title: 'The small numbers worth noticing.', subtitle: 'Fees, risk and horizon belong beside past returns.', category: 'Investing foundations', minutes: 5, color: 'lime',
    takeaway: 'Compare the role, risk and cost of an investment. A past return is only one piece of context.',
    sections: [
      { title: 'An expense ratio is a recurring cost.', paragraphs: ['A fund’s expense ratio describes annual operating expenses as a percentage of fund assets. These costs are generally reflected in the fund’s value, rather than appearing as a separate bill in your account.', 'Compare like with like. A lower fee is useful context, but the fund’s objective, holdings, risk, tracking and suitability still matter.'], example: { label: 'A cost comparison, not a return forecast', text: 'On a ₹1,00,000 balance, 0.2% is ₹200 and 1.2% is ₹1,200 over a year if the balance were unchanged. Actual charges depend on the balance through the year. The difference is a cost; neither figure tells you what the investment will earn.' } },
      { title: 'Past returns need a complete label.', paragraphs: ['A one-year return, an annualized five-year return and a gain over purchase cost answer different questions. Check the measurement period, whether income is included and how contributions are treated.', 'WealthWise’s manual holdings show simple purchase-cost gain. That figure is not XIRR and should not be compared directly with an annualized fund return.'] },
      { title: 'Read beyond the headline.', paragraphs: ['Understand exit loads, lock-ins, liquidity, taxes and the relevant scheme documents before a real decision. Sample funds in the practice catalogue are educational examples, not actual recommendations or a live comparison service.'] },
    ],
    quiz: { question: 'All else equal, what does a higher recurring fee do?', options: ['It guarantees better investment performance', 'It reduces the amount remaining after costs', 'It removes market risk'], correctIndex: 1, explanation: 'Fees are a drag on the amount left for the investor when all other assumptions are equal. They do not guarantee either better or worse gross performance.' }, next: { label: 'Explore the sample catalogue', path: 'markets' },
  },
  {
    id: 'borrowing', title: 'See the whole cost of borrowing.', subtitle: 'An EMI is a monthly payment, not the total price.', category: 'Planning ahead', minutes: 6, color: 'coral',
    takeaway: 'Compare monthly affordability and total repayment, including the costs a simple calculator leaves out.',
    sections: [
      { title: 'Principal and interest do different jobs.', paragraphs: ['Principal is the amount borrowed and still owed. Interest is the cost of using that money. An EMI combines both into a regular instalment under the assumptions of the loan.', 'On a reducing-balance loan, the interest portion is calculated on the remaining principal. As principal falls, the composition of the payment changes.'], example: { label: 'The zero-interest baseline', text: '₹1,20,000 repaid over 12 months at 0% interest is ₹10,000 per month. With a positive interest rate and the same term, the payment and total repayment are higher, before any additional fees.' } },
      { title: 'A longer term has a trade-off.', paragraphs: ['Spreading the same principal over more months usually reduces the EMI while increasing total interest at the same positive rate. A smaller monthly figure is not necessarily a cheaper loan.', 'The EMI calculator assumes a fixed rate and regular monthly payments. Processing charges, insurance, taxes, changing rates, payment dates and lender rounding can change an actual schedule.'] },
      { title: 'Prepayment needs a real schedule.', paragraphs: ['Paying principal earlier can reduce future interest, but the effect depends on timing and whether the lender reduces the payment or the term. Check prepayment charges and keep enough accessible money for other needs.', 'In your net-worth view, outstanding principal is a liability. Future interest is not added to the principal balance as if it were already borrowed.'] },
    ],
    quiz: { question: 'At the same positive rate, what usually happens when you extend the term for the same principal?', options: ['The EMI falls, but total interest rises', 'Both the EMI and total interest always fall', 'The interest rate automatically becomes zero'], correctIndex: 0, explanation: 'More months usually reduce each payment but keep principal outstanding for longer, increasing total interest under the same fixed-rate assumptions.' }, next: { label: 'Compare an EMI scenario', path: 'tools?kind=emi' },
  },
  {
    id: 'cash-flow', title: 'Give the month a clear ending.', subtitle: 'Separate income, spending and money moving between accounts.', category: 'Everyday money', minutes: 4, color: 'forest',
    takeaway: 'A transfer changes where money sits. It is not new income or fresh spending.',
    sections: [
      { title: 'Use a consistent period.', paragraphs: ['A monthly review begins with a date range. Add the income received and expenses paid during that period. Then look at the difference alongside upcoming commitments and your goals.', 'An opening account balance tells the application where to start. It should not be counted as income for the month you created the account.'], example: { label: 'One month, three kinds of activity', text: 'You receive ₹60,000, spend ₹42,000 and transfer ₹10,000 from your everyday account to your savings account. Recorded income minus spending is ₹18,000. The transfer changes the location of part of that money, not the cash-flow result.' } },
      { title: 'A budget is a plan, not the record.', paragraphs: ['Changing a budget limit changes your plan. It does not change what you have already spent. Correct an inaccurate transaction separately so the original record and the plan remain understandable.', 'A useful category system is one you can maintain. Grouping several similar expenses can make review easier than tracking dozens of categories you rarely use.'] },
      { title: 'Make one useful adjustment.', paragraphs: ['Review the largest changes, check uncategorized entries and identify a next step that fits your circumstances. There is no need to turn every small purchase into a judgement.', 'The review only knows about the records you enter. Missing expenses and outdated balances can make a tidy dashboard incomplete.'] },
    ],
    quiz: { question: 'Income is ₹60,000, expenses are ₹42,000 and a transfer to your own savings account is ₹10,000. What is the income-minus-expense result?', options: ['₹8,000', '₹18,000', '₹28,000'], correctIndex: 1, explanation: '₹60,000 − ₹42,000 = ₹18,000. Transfers between your own accounts are excluded from income and spending.' }, next: { label: 'Review your activity', path: 'transactions' },
  },
];

export const learningPaths = [
  { name: 'Build your foundation', description: 'Everyday money, a useful buffer and the effect of time.', lessonIds: ['cash-flow', 'emergency-fund', 'compounding'] },
  { name: 'Invest with perspective', description: 'Understand the mix, the costs and the limits of projections.', lessonIds: ['diversification', 'fund-costs', 'compounding'] },
  { name: 'Plan your next chapter', description: 'Bring goals, borrowing and everyday affordability together.', lessonIds: ['emergency-fund', 'borrowing', 'cash-flow'] },
];

export const glossary = [
  { term: 'Net worth', definition: 'The value of your assets minus your outstanding liabilities at a point in time.' },
  { term: 'SIP', definition: 'A systematic investment plan: a way to contribute regularly. It is not a guaranteed-return product.' },
  { term: 'Expense ratio', definition: 'A fund’s annual operating expenses expressed as a percentage of assets.' },
  { term: 'EMI', definition: 'Equated monthly instalment: a regular payment containing principal and interest under a loan schedule.' },
  { term: 'Allocation', definition: 'The proportion of a portfolio held in different assets or groups.' },
  { term: 'Purchase-cost gain', definition: 'Current value minus purchase cost. It is not automatically annualized or adjusted for contributions.' },
];
