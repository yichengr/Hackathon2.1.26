
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  merchant: string;
  isPending?: boolean;
  lifePurpose?: LifePurpose;
  location?: LocationData;
  purposeRationale?: string;
  economicBehavior?: EconomicBehavior; // New classification
}

export type LifePurpose = 'Survival' | 'Growth' | 'Convenience' | 'Joy' | 'Risk' | 'Unknown';

// Updated Economic Behavior Types per request
export type EconomicBehavior = 'Normal' | 'Luxury' | 'Inferior';

export interface LocationData {
  city: string;
  lat: number;
  lng: number;
  region: string;
  neighborhood?: string; // More granular location context
}

export type IncomeFrequency = 'weekly' | 'biweekly' | 'monthly' | 'none';

export interface AccountSummary {
  totalBalance: number;
  monthlySpending: number;
  monthlyIncome: number; // Projected total for the month
  paycheckAmount: number; // Actual amount per deposit
  incomeFrequency: IncomeFrequency;
  incomeDay: string; // Day name for weekly/biweekly, or day number for monthly
  lastProcessedDate: string; // ISO string of the last time income was checked
  savingsGoal: number;
  currentSavings: number;
  savingsPercentage: number; // Percentage of income to save
}

export interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
  avatarColor: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export enum Page {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  ADVISOR = 'ADVISOR',
  EMPOWER = 'EMPOWER',
  PROFILE = 'PROFILE',
  FAQ = 'FAQ'
}

export interface JobOfferDetails {
  role: string;
  company: string;
  offerAmount: string;
  experience: string;
  location?: string;
  isRemote?: boolean;
  level?: string;   // e.g. 'Junior', 'Senior', 'Lead'
  compType?: string; // e.g. 'Base', 'Total Comp'
  stage?: string;    // e.g. 'Initial Offer', 'Final'
}

export interface SalaryAnalysis {
  status: 'Underpaid' | 'Competitive' | 'Leading';
  marketRate: string;
  wealthGap: string; // Projected loss over 5 years
  reasoning: string;
}

export interface BudgetInput {
  income: string;
  housing: string;
  childcare: string;
  food: string;
  utilities: string;
  other: string;
}

export interface InterviewPrepInput {
  role: string;
  company: string;
  details: string;
}
