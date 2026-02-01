

import { GoogleGenAI } from "@google/genai";
import { Transaction, AccountSummary, JobOfferDetails, BudgetInput, InterviewPrepInput, SalaryAnalysis } from "../types";

const hasApiKey = () => !!process.env.API_KEY;

// Strict timeout to ensure UI never hangs (6 seconds)
const AI_TIMEOUT_MS = 6000;
const SIMULATED_DELAY_MS = 1200; // For realistic "thinking" feel when no API key is present

const CLEAN_TEXT_INSTRUCTION = "Provide a professional, clean, and concise plain-text response. Do not use Markdown symbols like asterisks, hashtags, or bullet point dashes. Use standard spacing and line breaks for clarity. Keep the response brief and actionable.";

// ==========================================
// FALLBACK ENGINE (Local Deterministic Logic)
// ==========================================

const FallbackEngine = {
  // 1. Intent Recognition for Advisor
  determineIntent: (query: string): 'risk' | 'savings' | 'audit' | 'spending' | 'general' => {
    const q = query.toLowerCase();
    if (q.includes('risk') || q.includes('safe') || q.includes('burn') || q.includes('health') || q.includes('status')) return 'risk';
    if (q.includes('saving') || q.includes('goal') || q.includes('track') || q.includes('progress')) return 'savings';
    if (q.includes('largest') || q.includes('big') || q.includes('audit') || q.includes('transaction') || q.includes('purchase')) return 'audit';
    if (q.includes('spend') || q.includes('category') || q.includes('where') || q.includes('habit') || q.includes('money')) return 'spending';
    return 'general';
  },

  // 2. Advisor Response Generator
  getAdvisorResponse: (query: string, summary: AccountSummary, transactions: Transaction[]): string => {
    const intent = FallbackEngine.determineIntent(query);

    if (intent === 'risk') {
      const spendRatio = summary.monthlyIncome > 0 ? (summary.monthlySpending / summary.monthlyIncome) : 1;
      const runway = summary.monthlySpending > 0 ? (summary.totalBalance / summary.monthlySpending).toFixed(1) : '>12';
      
      if (spendRatio > 0.95) {
        return `Based on your recent activity, your monthly outflow ($${summary.monthlySpending.toLocaleString()}) is closely matching your inflow. To improve financial resilience, standard guidance suggests aiming for a wider gap between income and expenses to build a stronger safety net.`;
      } else if (spendRatio < 0.8) {
        return `Your current burn rate of $${summary.monthlySpending.toLocaleString()}/mo indicates a sustainable cash flow relative to your income. You have approximately ${runway} months of coverage at this spending level, which indicates a stable position.`;
      }
      return `Your spending is currently balanced with your income. While not in a critical zone, monitoring recurring expenses can help maintain this stability long-term.`;
    }

    if (intent === 'audit') {
      const expenses = transactions.filter(t => t.amount < 0);
      const largest = [...expenses].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
      
      if (!largest) return "I reviewed your ledger, but there are no recent expenses to audit in the current view.";
      
      return `Your largest recent transaction was ${largest.description} for $${Math.abs(largest.amount).toFixed(2)} on ${largest.date}. Large one-time expenses can temporarily skew monthly averages, so it is helpful to view this in the context of your overall trend rather than as an outlier.`;
    }

    if (intent === 'spending') {
      const expenses = transactions.filter(t => t.amount < 0);
      const catTotals: Record<string, number> = {};
      expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount); });
      const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
      
      if (topCat) {
        return `A review of your ledger shows that '${topCat[0]}' is your primary spending category, totaling $${topCat[1].toLocaleString()} recently. Awareness of your primary expense drivers is the first step in active financial management.`;
      }
      return "Your spending appears widely distributed across multiple essential categories, with no single area dominating your recent activity.";
    }

    if (intent === 'savings') {
      const progress = summary.savingsGoal > 0 ? (summary.currentSavings / summary.savingsGoal) * 100 : 0;
      if (progress > 50) {
        return `You have reached ${progress.toFixed(0)}% of your $${summary.savingsGoal.toLocaleString()} goal ($${summary.currentSavings.toLocaleString()} saved). Consistent contributions are the most effective way to maintain this momentum.`;
      }
      return `You are currently at $${summary.currentSavings.toLocaleString()}, working towards $${summary.savingsGoal.toLocaleString()}. Increasing your automated transfer frequency or amount can often accelerate progress toward such targets.`;
    }

    // General Fallback
    return `I am analyzing your current ledger. You have a total balance of $${summary.totalBalance.toLocaleString()} and your last income event was recorded as ${summary.incomeFrequency}. I can provide more specific insights on spending patterns, risk assessment, or savings goals.`;
  },

  // 3. Dashboard Insights Generator (Rotates insights)
  getDashboardInsight: (transactions: Transaction[]): string => {
    const expenses = transactions.filter(t => t.amount < 0);
    if (expenses.length === 0) return "Track your spending to see automated insights here.";

    // Logic A: Top Category
    const catTotals: Record<string, number> = {};
    expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount); });
    const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

    // Logic B: Transaction Count
    const count = expenses.length;

    // Deterministic selection based on minute to rotate without state
    const selector = new Date().getMinutes() % 2;

    if (selector === 0 && topCat) {
       return `Observation: ${topCat[0]} is your top spending category ($${topCat[1].toLocaleString()}) recently. Reviewing these recurring expenses may reveal savings opportunities.`;
    } else {
       return `Activity Update: You have recorded ${count} active transactions recently. Regular monitoring of high-frequency activity helps maintain budget alignment.`;
    }
  },

  // 4. Salary Analysis Logic
  analyzeSalary: (details: JobOfferDetails): SalaryAnalysis => {
    // Extract numbers or use defaults
    const offer = parseInt(details.offerAmount.replace(/[^0-9]/g, '')) || 0;
    const expStr = details.experience.replace(/[^0-9]/g, '');
    const exp = expStr ? parseInt(expStr) : 3; 
    
    // Generalized Logic: Base + Experience Premium + Location Premium (Simple Heuristic)
    let base = 80000;
    const isMajorHub = details.location?.toLowerCase().match(/nyc|san francisco|sf|new york|seattle|boston/);
    if (isMajorHub) base += 15000;
    
    const expPremium = exp * 8000;
    const target = base + expPremium;
    
    let status: 'Underpaid' | 'Competitive' | 'Leading' = 'Competitive';
    if (offer < target * 0.9) status = 'Underpaid';
    else if (offer > target * 1.1) status = 'Leading';
    
    const fmt = (n: number) => '$' + (Math.round(n/1000)).toLocaleString() + 'k';
    const lowerBound = target * 0.95;
    const upperBound = target * 1.1;

    return {
        status,
        marketRate: `${fmt(lowerBound)} - ${fmt(upperBound)}`,
        wealthGap: status === 'Underpaid' ? `$${Math.round((target - offer) * 5).toLocaleString()}` : '$0',
        reasoning: `Based on generalized market benchmarks for ${details.role || 'this role'} with ${details.experience || 'similar'} experience${isMajorHub ? ' in high cost-of-living areas' : ''}, the typical compensation band is ${fmt(lowerBound)} - ${fmt(upperBound)}. This assessment relies on standard industry baselines to provide directional context.`
    };
  },

  // 5. Negotiation Script Template
  getNegotiationScript: (details: JobOfferDetails): string => {
    return `Subject: Discussion regarding offer for ${details.role}

Dear Hiring Team,

Thank you again for the offer to join ${details.company}. I am very excited about the opportunity to contribute to the team.

After reviewing the details and comparing them with market benchmarks for a ${details.role} with my level of experience in ${details.location || 'this region'}, I would like to discuss the compensation component.

Given my background and the scope of this role, I am targeting a base salary closer to market standard. Is there flexibility to adjust the base salary?

I am confident that my skills in this area will drive significant value for ${details.company}, and I am eager to find a number that works for us both.

Best regards,`;
  }
};

// ==========================================
// UTILITY: Race against Time
// ==========================================

async function withTimeout<T>(promise: Promise<T>, fallback: T, timeoutMs: number = AI_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback);
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (error) {
    clearTimeout(timer!);
    return fallback;
  }
}

// ==========================================
// EXPORTED SERVICES
// ==========================================

export const generateFinancialAdvice = async (
  transactions: Transaction[],
  summary: AccountSummary,
  userQuery: string
): Promise<string> => {
  const fallback = FallbackEngine.getAdvisorResponse(userQuery, summary, transactions);

  if (!hasApiKey()) {
    return new Promise(resolve => setTimeout(() => resolve(fallback), SIMULATED_DELAY_MS));
  }

  const aiCall = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const recentTxText = transactions.slice(0, 15).map(t => `${t.date}: ${t.description} (${t.amount}) [${t.category}]`).join('\n');
    const context = `
      Act as Cap, a financial assistant.
      Context: Balance $${summary.totalBalance}, Monthly Spend $${summary.monthlySpending}.
      Recent Tx: ${recentTxText}
      Query: ${userQuery}
      ${CLEAN_TEXT_INSTRUCTION}
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: context }] }],
    });
    return response.text || fallback;
  };

  return withTimeout(aiCall(), fallback);
};

export const generateSpendingInsights = async (transactions: Transaction[]): Promise<string> => {
  const fallback = FallbackEngine.getDashboardInsight(transactions);

  if (!hasApiKey()) {
    return new Promise((resolve) => setTimeout(() => resolve(fallback), SIMULATED_DELAY_MS));
  }

  const aiCall = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze these transactions: ${transactions.slice(0, 10).map(t => `${t.description} (${t.amount})`).join(', ')}. ${CLEAN_TEXT_INSTRUCTION} Provide one short, neutral observation about spending patterns.`;
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return response.text || fallback;
  };

  return withTimeout(aiCall(), fallback);
};

export const analyzeSalaryOffer = async (details: JobOfferDetails): Promise<SalaryAnalysis> => {
  const fallback = FallbackEngine.analyzeSalary(details);

  if (!hasApiKey()) {
    return new Promise(resolve => setTimeout(() => resolve(fallback), SIMULATED_DELAY_MS));
  }

  const aiCall = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze job offer: Role ${details.role}, Offer ${details.offerAmount}, Exp ${details.experience}, Loc ${details.location}.
      Return JSON: { "status": "Underpaid"|"Competitive"|"Leading", "marketRate": "range", "wealthGap": "5yr loss string", "reasoning": "brief explanation" }
    `;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    const jsonStr = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || "{}";
    return JSON.parse(jsonStr) as SalaryAnalysis;
  };

  return withTimeout(aiCall(), fallback);
};

export const generateNegotiationScript = async (details: JobOfferDetails): Promise<string> => {
  const fallback = FallbackEngine.getNegotiationScript(details);

  if (!hasApiKey()) {
    return new Promise(resolve => setTimeout(() => resolve(fallback), SIMULATED_DELAY_MS));
  }

  const aiCall = async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Write a professional salary negotiation email for a ${details.role} offer. ${CLEAN_TEXT_INSTRUCTION}`;
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
    return response.text || fallback;
  };

  return withTimeout(aiCall(), fallback);
};

// Legacy/Placeholder functions updated to be safe and consistent
export const getInterviewPrep = async (input: InterviewPrepInput): Promise<string> => {
  const fallback = "Interview preparation modules are currently being updated. Please focus on the STAR method (Situation, Task, Action, Result) for your responses in the meantime.";
  return new Promise(resolve => setTimeout(() => resolve(fallback), 500));
};

export const analyzeSingleMotherBudget = async (budget: BudgetInput): Promise<string> => {
  const fallback = "Budget analysis features are currently using standard generalized templates. We recommend the 50/30/20 rule as a baseline: 50% Needs, 30% Wants, 20% Savings.";
  return new Promise(resolve => setTimeout(() => resolve(fallback), 500));
};

export const explainFinancialConcept = async (concept: string): Promise<string> => {
  const fallback = `${concept} is a financial term that we can explore further in the dedicated learning modules.`;
  return new Promise(resolve => setTimeout(() => resolve(fallback), 500));
};
