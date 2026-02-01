import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Sparkles, CheckCircle2, Copy, Award, ShieldCheck, 
  AlertTriangle, ArrowRight, RefreshCw, Loader2, DollarSign, 
  Briefcase, Calculator, BookOpen, Building2, Users,
  CreditCard, LineChart, Scale, Activity, Umbrella, Clock,
  GraduationCap, HeartHandshake, X, Calendar, Truck, Baby, 
  Home, Plane, ChevronRight, ChevronLeft, BarChart3, AlertCircle,
  MapPin, Percent, Info, Layers, GitCommit, CheckSquare, Square, ChevronDown, ChevronUp,
  RotateCcw, Sliders, Shield
} from 'lucide-react';
import { analyzeSalaryOffer, generateNegotiationScript } from '../services/geminiService';
import { JobOfferDetails, SalaryAnalysis, AccountSummary, Transaction } from '../types';

// --- UTILS & STYLES ---

const useScrollReveal = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = '' }) => {
  const { ref, isVisible } = useScrollReveal();
  const transitionDelay = `${delay}ms`;
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-1000 ease-[cubic-bezier(0.2,0.8,0.2,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.98]'
      } ${className}`}
      style={{ transitionDelay }}
    >
      {children}
    </div>
  );
};

// --- PROPS ---
interface EmpowerProps {
    summary: AccountSummary;
    transactions: Transaction[];
}

// --- LIFE PHASE CONFIG ---
type LifePhase = 'student' | 'growth' | 'caregiver' | 'single' | null;

const PHASES: { id: LifePhase, label: string, icon: any, desc: string, copy: string }[] = [
  { 
    id: 'student', 
    label: 'Student / Early Career', 
    icon: GraduationCap, 
    desc: 'Building foundations',
    copy: 'Building a strong financial foundation with tools designed for flexibility and credit growth.'
  },
  { 
    id: 'growth', 
    label: 'Career Growth', 
    icon: Briefcase, 
    desc: 'Maximizing value',
    copy: 'Maximizing your market value and optimizing long-term investment decisions.'
  },
  { 
    id: 'caregiver', 
    label: 'Caregiver / Family', 
    icon: HeartHandshake, 
    desc: 'Balancing responsibilities',
    copy: 'Supporting your balancing act with tools that understand the real cost of care.'
  },
  { 
    id: 'single', 
    label: 'Single Income', 
    icon: Umbrella, 
    desc: 'Securing independence',
    copy: 'Strengthening your safety net and planning for a secure, independent future.'
  }
];

// --- EVENT PLANNER TEMPLATES & TYPES ---
type PlannerEventType = 'moving' | 'home' | 'break';

const EVENT_TEMPLATES = {
  moving: { label: 'Relocation', icon: Truck },
  home: { label: 'Home Buying', icon: Home },
  break: { label: 'Career Break', icon: Plane },
};

// Demo Credit Limit (In real app, this would be in AccountSummary)
const CREDIT_LIMIT = 15000;

const Empower: React.FC<EmpowerProps> = ({ summary, transactions }) => {
  // --- LIFE PHASE STATE ---
  const [lifePhase, setLifePhase] = useState<LifePhase>(null);

  // --- UNIVERSAL TOOLS STATE ---
  const [activeUniversalTool, setActiveUniversalTool] = useState<string | null>(null);
  
  // Volatility Planner State
  const [volatilityInput, setVolatilityInput] = useState({ high: '', low: '', expenses: '' });
  const [volatilityResult, setVolatilityResult] = useState<string | null>(null);

  // Credit Visualizer State
  const [creditUtilization, setCreditUtilization] = useState(30);

  // --- LIFE EVENT PLANNER STATE (Specifics) ---
  const [plannerEvent, setPlannerEvent] = useState<PlannerEventType | null>(null);
  
  // Home Buying Specifics
  const [homeInputs, setHomeInputs] = useState({ price: '350000', downPaymentPercent: '20', interestRate: '6.5' });
  
  // Relocation Specifics
  const [movingInputs, setMovingInputs] = useState({ 
    newRent: '1800', 
    movers: '1200', 
    setup: '800' // Furniture, utility setup, etc.
  });

  // Career Break Specifics
  const [breakInputs, setBreakInputs] = useState({ monthlyBurn: summary.monthlySpending.toString(), monthsOff: '3' });

  // --- DECISION SIMULATOR STATE ---
  const [decisionType, setDecisionType] = useState('purchase'); // purchase, loan, income_drop
  const [decisionAmount, setDecisionAmount] = useState('');
  const [showStabilityInfo, setShowStabilityInfo] = useState(false);

  // --- EMPOWER HERWEALTH STATE ---
  const [activePillar, setActivePillar] = useState<'career' | 'life'>('career');
  
  // Salary Coach State
  const [salaryStep, setSalaryStep] = useState<'input' | 'analyzing' | 'results'>('input');
  const [jobDetails, setJobDetails] = useState<JobOfferDetails>({ 
    role: '', 
    company: '', 
    offerAmount: '', 
    experience: '',
    location: '',
    isRemote: false,
    level: 'Mid-Level',
    compType: 'Base Only',
    stage: 'Initial Offer'
  });
  const [showAdvancedSalary, setShowAdvancedSalary] = useState(false);
  const [analysis, setAnalysis] = useState<SalaryAnalysis | null>(null);
  const [script, setScript] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [salaryCopied, setSalaryCopied] = useState(false);

  // Stability Mode State (ENHANCED)
  const [stabilityInput, setStabilityInput] = useState({ 
    savings: '', 
    burnRate: '',
    isAutoDerived: false 
  });
  const [stabilityScenarios, setStabilityScenarios] = useState({
    leanMode: false, // 15% reduction in burn
    severance: false // Add 1 month income buffer
  });

  // --- EFFECTS & LOGIC ---

  // Apply Phase Defaults
  useEffect(() => {
    // Reset specific tool states when phase changes
    setPlannerEvent(null);

    if (lifePhase === 'student') {
        setVolatilityInput({ high: '2500', low: '800', expenses: '1200' });
        setCreditUtilization(15);
        setDecisionType('loan');
        setDecisionAmount('200'); // Monthly loan payment
    } else if (lifePhase === 'single') {
        setVolatilityInput({ high: '4000', low: '3800', expenses: '3000' });
        // Stability inputs are now auto-calculated below
        setDecisionType('income_drop');
        setDecisionAmount('1000');
    } else if (lifePhase === 'caregiver') {
        // No budget input defaults needed as budget feature is removed
    } else if (lifePhase === 'growth') {
        setJobDetails(prev => ({ ...prev, experience: '7 Years' }));
        setDecisionType('purchase');
        setDecisionAmount('5000');
        setPlannerEvent('home');
    }
  }, [lifePhase]);

  // Auto-Derive Stability Data (Run once when entering Life Pillar or data changes)
  useEffect(() => {
    if (activePillar === 'life') {
      const derivedSavings = summary.currentSavings + summary.totalBalance; // Liquid Assets
      
      // Calculate Essential Burn Rate from Transactions
      // Look for Survival tag OR core categories
      const essentialCats = ['Housing', 'Utilities', 'Groceries', 'Health', 'Insurance'];
      const essentialTx = transactions.filter(t => 
        (t.amount < 0) && (t.lifePurpose === 'Survival' || essentialCats.includes(t.category))
      );
      
      // Simple monthly average approx (sum of essentials / unique months in dataset, fallback to summary if empty)
      let monthlyBurn = 0;
      if (essentialTx.length > 0) {
         const totalEssential = essentialTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
         // Find date range
         const dates = essentialTx.map(t => new Date(t.date).getTime());
         const minDate = new Date(Math.min(...dates));
         const maxDate = new Date(Math.max(...dates));
         // Approx months difference (avoid div by zero)
         const monthsDiff = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 3600 * 24 * 30));
         monthlyBurn = totalEssential / monthsDiff;
      }

      // If calculated burn is too low (e.g. not enough data), fallback to a percentage of total spend
      if (monthlyBurn < 500) monthlyBurn = summary.monthlySpending * 0.6; // Assume 60% is essential

      setStabilityInput({
        savings: Math.round(derivedSavings).toString(),
        burnRate: Math.round(monthlyBurn).toString(),
        isAutoDerived: true
      });
    }
  }, [activePillar, summary.currentSavings, summary.totalBalance, transactions, summary.monthlySpending]);


  // Update break input default when summary changes
  useEffect(() => {
      // Only set if not already set by user
      if (breakInputs.monthlyBurn === '0' || breakInputs.monthlyBurn === '') {
          setBreakInputs(prev => ({ ...prev, monthlyBurn: Math.round(summary.monthlySpending).toString() }));
      }
  }, [summary.monthlySpending]);

  const isRecommended = (toolId: string) => {
    if (!lifePhase) return false;
    const map: Record<string, string[]> = {
        'student': ['volatility', 'credit', 'planner'],
        'growth': ['decision', 'salary', 'planner'],
        'caregiver': ['volatility', 'planner'],
        'single': ['volatility', 'stability', 'decision']
    };
    return map[lifePhase]?.includes(toolId);
  };

  // --- HANDLERS ---

  // Universal: Volatility Planner
  const calculateBuffer = () => {
    const high = parseFloat(volatilityInput.high) || 0;
    const low = parseFloat(volatilityInput.low) || 0;
    const exp = parseFloat(volatilityInput.expenses) || 0;
    
    if (high && low && exp) {
      const gap = exp - low;
      if (gap > 0) {
        setVolatilityResult(`During low income months, you have a gap of $${gap.toLocaleString()}. We recommend a "Feast Mode" savings buffer of at least $${(gap * 3).toLocaleString()} (3 months coverage) to stabilize your cash flow.`);
      } else {
        setVolatilityResult(`Great news! Your low income months ($${low.toLocaleString()}) still cover your expenses ($${exp.toLocaleString()}). Use the surplus from high months ($${(high - exp).toLocaleString()}) to build wealth.`);
      }
    }
  };

  // Universal: Credit Visualizer
  const getCreditScoreImpact = (utilization: number) => {
    if (utilization < 10) return { score: '+ Excellent', color: 'text-emerald-600', desc: 'Optimal range for score growth.' };
    if (utilization < 30) return { score: '✓ Good', color: 'text-blue-600', desc: 'Healthy usage, minimal impact.' };
    if (utilization < 50) return { score: '⚠ Fair', color: 'text-amber-500', desc: 'May start lowering your score.' };
    return { score: '⚠ High Risk', color: 'text-red-500', desc: 'Significant negative impact expected.' };
  };

  // --- DECISION SIMULATOR LOGIC ---
  const getSimulationResults = () => {
    const amount = parseFloat(decisionAmount) || 0;
    
    // We treat 'monthlySpending' as the current utilized balance for the purpose of this simulation
    // This connects it to the Ledger / Overview
    const currentBalance = summary.monthlySpending; 
    const currentSavings = summary.currentSavings;
    const creditLimit = CREDIT_LIMIT;
    
    // 1. Calculate Utilizations
    const currentUtil = Math.min(100, (currentBalance / creditLimit) * 100);
    
    let projectedBalance = currentBalance;
    let projectedSavings = currentSavings;

    // Apply Decision Logic
    if (decisionType === 'purchase') {
      projectedBalance += amount;
    }
    
    // 2. Projected Utilization
    const projectedUtil = Math.min(100, (projectedBalance / creditLimit) * 100);
    
    // 3. Stability Index Calculation (0-100)
    // Formula: Weighted average of Utilization Health (40%) and Buffer Health (60%)
    const calculateScore = (util: number, balance: number, savings: number) => {
        // Util Score: 100 if <10%, 0 if >90%
        let uScore = 100;
        if (util > 10) uScore -= (util - 10) * 1.1;
        uScore = Math.max(0, uScore);

        // Buffer Score: 100 if Savings > 3x Balance, 0 if Savings = 0
        const bufferRatio = balance > 0 ? savings / balance : 10;
        let bScore = Math.min(100, (bufferRatio / 3) * 100);

        return Math.round((uScore * 0.4) + (bScore * 0.6));
    };

    const currentScore = calculateScore(currentUtil, currentBalance, currentSavings);
    
    // Adjust logic for 'loan' or 'income_drop' (which affect monthly cash flow primarily)
    let finalProjSavings = projectedSavings;
    if (decisionType === 'loan' || decisionType === 'income_drop') {
        // Simulating the strain on buffer over 6 months
        finalProjSavings -= (amount * 6); 
    }

    const projectedScore = calculateScore(projectedUtil, projectedBalance, finalProjSavings);

    return {
      currentBalance,
      currentUtil,
      projectedUtil,
      currentScore,
      projectedScore,
      scoreDelta: projectedScore - currentScore
    };
  };

  const sim = getSimulationResults();

  // --- LIFE EVENT PLANNER LOGIC ---

  // Home Buying Calculation
  const calculateHome = () => {
    const p = parseFloat(homeInputs.price) || 0;
    const dpPct = parseFloat(homeInputs.downPaymentPercent) || 0;
    const rate = parseFloat(homeInputs.interestRate) || 0;
    
    const downPaymentAmt = p * (dpPct / 100);
    const loanAmt = p - downPaymentAmt;
    
    // Monthly Principal & Interest
    const monthlyRate = rate / 100 / 12;
    const n = 360; // 30 years
    const monthlyPI = (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    
    const closingCosts = p * 0.03; // Est 3%
    const totalCashNeeded = downPaymentAmt + closingCosts;
    const saved = summary.currentSavings;
    const readiness = Math.min(100, (saved / totalCashNeeded) * 100);

    return {
      downPayment: downPaymentAmt,
      loanAmount: loanAmt,
      monthlyPayment: Math.round(monthlyPI),
      closingCosts,
      totalCashNeeded,
      readiness
    };
  };

  // Relocation Calculation - NOW RESPONSIVE
  const calculateMove = () => {
    const movers = parseFloat(movingInputs.movers) || 0;
    const rent = parseFloat(movingInputs.newRent) || 0;
    const setup = parseFloat(movingInputs.setup) || 0;
    
    // Immediate Outlay: First Month Rent + Deposit (equal to rent) + Movers + Setup
    const deposit = rent;
    const immediateOutlay = rent + deposit + movers + setup;
    
    // Buffer Recovery
    const monthlySurplus = Math.max(100, summary.monthlyIncome - summary.monthlySpending); // Prevent div/0
    const recoveryMonths = Math.ceil(immediateOutlay / monthlySurplus);
    
    return {
      deposit,
      immediateOutlay,
      monthlySurplus,
      recoveryMonths
    };
  };

  // Career Break Calculation - CONNECTED TO REAL SUMMARY
  const calculateBreak = () => {
    const burn = parseFloat(breakInputs.monthlyBurn) || 0;
    const months = parseFloat(breakInputs.monthsOff) || 0;
    const totalCost = burn * months;
    
    // CONNECTED TO LIVE SUMMARY
    const currentSavings = summary.currentSavings;
    const remainingSavings = currentSavings - totalCost;
    const runway = burn > 0 ? (currentSavings / burn).toFixed(1) : '∞';
    
    // Critical if remaining savings < 1 month burn
    const isRisky = remainingSavings < burn;

    return {
      totalCost,
      currentSavings,
      remainingSavings,
      runway,
      isRisky
    };
  };

  // --- EMPOWER HANDLERS ---
  const handleCopy = (text: string, setCopiedState: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  const handleSalaryAnalyze = async () => {
    if (!jobDetails.role || !jobDetails.offerAmount) return;
    setSalaryStep('analyzing');
    const result = await analyzeSalaryOffer(jobDetails);
    setTimeout(() => {
      setAnalysis(result);
      setSalaryStep('results');
    }, 1800);
  };

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    const text = await generateNegotiationScript(jobDetails);
    setScript(text);
    setIsGeneratingScript(false);
  };

  // --- STABILITY & RUNWAY CALCULATION ---
  const getRunwayData = () => {
    const rawSavings = parseFloat(stabilityInput.savings) || 0;
    const rawBurn = parseFloat(stabilityInput.burnRate) || 0;
    
    // Adjust for scenarios
    let finalSavings = rawSavings;
    if (stabilityScenarios.severance) finalSavings += (summary.monthlyIncome || rawBurn); // Add 1 month income/burn

    let finalBurn = rawBurn;
    if (stabilityScenarios.leanMode) finalBurn = rawBurn * 0.85; // 15% reduction

    const runway = finalBurn > 0 ? finalSavings / finalBurn : 0;
    
    // Range Calculation
    // Low: Current burn, no severance
    const lowBurn = rawBurn;
    const lowRunway = lowBurn > 0 ? rawSavings / lowBurn : 0;
    
    // High: Lean burn, with severance
    const highBurn = rawBurn * 0.80; // 20% leaner
    const highSavings = rawSavings + (summary.monthlyIncome || rawBurn);
    const highRunway = highBurn > 0 ? highSavings / highBurn : 0;

    return {
      runway: parseFloat(runway.toFixed(1)),
      lowRunway: parseFloat(lowRunway.toFixed(1)),
      highRunway: parseFloat(highRunway.toFixed(1)),
      finalBurn,
      finalSavings
    };
  };

  const renderFairnessBadge = (status: string) => {
    if (status === 'Underpaid') {
      return (
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-sm border border-red-100/50 backdrop-blur-sm">
          <AlertTriangle size={14} /> Likely Underpaid
        </div>
      );
    }
    if (status === 'Leading') {
      return (
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-sm border border-emerald-100/50 backdrop-blur-sm">
          <Award size={14} /> Market Leading
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-5 py-2.5 rounded-full font-bold uppercase tracking-wider text-[11px] shadow-sm border border-blue-100/50 backdrop-blur-sm">
        <ShieldCheck size={14} /> Competitive Offer
      </div>
    );
  };

  const activePhaseData = PHASES.find(p => p.id === lifePhase);

  return (
    <div className="flex flex-col min-h-screen w-full bg-white font-sans text-slate-900 overflow-x-hidden">
      
      {/* =========================================
          SECTION 1: UNIVERSAL GROWTH TOOLS (Analytical Layer)
          ========================================= */}
      <section className="w-full bg-white pt-16 pb-20 px-6 lg:px-12 relative z-20">
        <Reveal>
          <div className="max-w-5xl mx-auto mb-16">
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                 <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                        <LineChart size={12} /> Financial Intelligence
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                    Growth Tools
                    </h1>
                    <p className="text-slate-500 text-lg lg:text-xl font-medium max-w-2xl leading-relaxed transition-all duration-500">
                    {activePhaseData ? activePhaseData.copy : "Universal planning resources to accelerate your financial journey, designed for every income type."}
                    </p>
                 </div>
                 
                 {/* Life Phase Selector */}
                 <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalize Your View (Optional)</span>
                    <div className="flex flex-wrap gap-2">
                        {PHASES.map(phase => {
                            const Icon = phase.icon;
                            const isActive = lifePhase === phase.id;
                            return (
                                <button
                                    key={phase.id}
                                    onClick={() => setLifePhase(isActive ? null : phase.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all ${
                                        isActive 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {phase.label}
                                    {isActive && <X size={12} className="ml-1 opacity-50"/>}
                                </button>
                            );
                        })}
                    </div>
                 </div>
             </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mb-8">
             
             {/* Tool 1: Life Event Planner (Distinct Models) */}
             <div 
                className={`rounded-[2rem] p-8 border transition-all cursor-pointer relative overflow-hidden group ${
                    activeUniversalTool === 'planner' 
                    ? 'bg-white border-[#003A6F] shadow-xl ring-1 ring-[#003A6F]/10' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                } ${isRecommended('planner') ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                onClick={() => setActiveUniversalTool('planner')}
             >
                {isRecommended('planner') && (
                    <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-10">Recommended</div>
                )}
                <div className="flex items-start justify-between relative z-10">
                   <div>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm mb-6 border border-slate-100">
                           <Calendar size={24} />
                       </div>
                       <h3 className="font-bold text-xl text-slate-900 mb-2">Life Event Planner</h3>
                       <p className="text-slate-500 text-sm mb-4 max-w-sm">Model different financial transitions with event-specific timelines.</p>
                   </div>
                   {activeUniversalTool !== 'planner' && <ArrowRight className="text-slate-300 group-hover:text-[#003A6F] transition-colors" />}
                </div>

                {activeUniversalTool === 'planner' && (
                    <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                        {!plannerEvent ? (
                            <div className="grid grid-cols-3 gap-3">
                                {Object.entries(EVENT_TEMPLATES).map(([key, t]) => {
                                    const Icon = t.icon;
                                    return (
                                        <button 
                                            key={key}
                                            onClick={() => setPlannerEvent(key as PlannerEventType)}
                                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center group/btn"
                                        >
                                            <Icon size={24} className="text-slate-400 group-hover/btn:text-[#003A6F] mb-1" />
                                            <span className="text-xs font-bold text-slate-700">{t.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                <button onClick={() => setPlannerEvent(null)} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-widest">
                                    <ChevronLeft size={14} /> Back to Events
                                </button>
                                
                                {/* --- HOME BUYING SCENARIO --- */}
                                {plannerEvent === 'home' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Home Price</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={homeInputs.price} onChange={e => setHomeInputs({...homeInputs, price: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate (%)</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={homeInputs.interestRate} onChange={e => setHomeInputs({...homeInputs, interestRate: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                                            <h4 className="font-bold text-[#003A6F] text-sm">Investment Summary</h4>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Upfront (Down + Closing)</span>
                                                <span className="font-bold text-slate-900">${calculateHome().totalCashNeeded.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Est. Monthly Mortgage</span>
                                                <span className="font-bold text-slate-900">${calculateHome().monthlyPayment.toLocaleString()}/mo</span>
                                            </div>
                                            <div className="pt-2 border-t border-blue-100 mt-1">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-500">Savings Readiness</span>
                                                    <span className="font-bold text-[#003A6F]">{calculateHome().readiness.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${calculateHome().readiness}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- RELOCATION SCENARIO --- */}
                                {plannerEvent === 'moving' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Rent ($)</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={movingInputs.newRent} onChange={e => setMovingInputs({...movingInputs, newRent: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Movers ($)</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={movingInputs.movers} onChange={e => setMovingInputs({...movingInputs, movers: e.target.value})} />
                                            </div>
                                             <div className="space-y-1 col-span-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Setup Costs (Furniture/Utils)</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={movingInputs.setup} onChange={e => setMovingInputs({...movingInputs, setup: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">1</div>
                                                <div className="text-xs">
                                                    <p className="font-bold text-slate-900">Total Immediate Outlay</p>
                                                    <p className="text-slate-500 font-medium">${calculateMove().immediateOutlay.toLocaleString()}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">Includes Rent + Deposit + Movers + Setup</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">2</div>
                                                <div className="text-xs">
                                                    <p className="font-bold text-slate-900">Recovery Timeline</p>
                                                    <p className="text-slate-500 font-medium">Based on your monthly surplus of <strong>${calculateMove().monthlySurplus.toLocaleString()}</strong>, it will take <strong>~{calculateMove().recoveryMonths} months</strong> to rebuild this amount in your savings.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- CAREER BREAK SCENARIO --- */}
                                {plannerEvent === 'break' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Burn</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={breakInputs.monthlyBurn} onChange={e => setBreakInputs({...breakInputs, monthlyBurn: e.target.value})} />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Months Off</label>
                                                <input type="number" className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold" value={breakInputs.monthsOff} onChange={e => setBreakInputs({...breakInputs, monthsOff: e.target.value})} />
                                            </div>
                                        </div>
                                        <div className={`p-4 rounded-xl border space-y-3 ${calculateBreak().isRisky ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                            <div className="flex justify-between items-center">
                                                <h4 className={`font-bold text-sm ${calculateBreak().isRisky ? 'text-red-700' : 'text-green-700'}`}>
                                                    {calculateBreak().isRisky ? 'Warning: Critical Depletion' : 'Sustainable Plan'}
                                                </h4>
                                                {calculateBreak().isRisky ? <AlertCircle size={16} className="text-red-500"/> : <ShieldCheck size={16} className="text-green-500"/>}
                                            </div>
                                            <div className="text-xs text-slate-700 space-y-2">
                                                <p>Current Savings: <strong>${calculateBreak().currentSavings.toLocaleString()}</strong></p>
                                                <p>Current Savings can support you for <strong>{calculateBreak().runway} months</strong> at this burn rate.</p>
                                                <div className="h-px bg-black/5"></div>
                                                <p>
                                                    After your <strong>{breakInputs.monthsOff}-month</strong> break, you will have <strong>${calculateBreak().remainingSavings.toLocaleString()}</strong> remaining.
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
             </div>

             {/* Tool 2: Decision Simulator (Full) */}
             <div 
                className={`rounded-[2rem] p-8 border transition-all cursor-pointer relative overflow-hidden group ${
                    activeUniversalTool === 'decision' 
                    ? 'bg-white border-[#003A6F] shadow-xl ring-1 ring-[#003A6F]/10' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                } ${isRecommended('decision') ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`}
                onClick={() => setActiveUniversalTool('decision')}
             >
                {isRecommended('decision') && (
                    <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-10">Recommended</div>
                )}
                <div className="flex items-start justify-between relative z-10">
                   <div>
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm mb-6 border border-slate-100">
                           <TrendingUp size={24} />
                       </div>
                       <h3 className="font-bold text-xl text-slate-900 mb-2">Decision Simulator</h3>
                       <p className="text-slate-500 text-sm mb-4 max-w-sm">Simulate financial decisions with your real-time data.</p>
                   </div>
                   {activeUniversalTool !== 'decision' && <ArrowRight className="text-slate-300 group-hover:text-[#003A6F] transition-colors" />}
                </div>

                {activeUniversalTool === 'decision' && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                     
                     {/* Persistent Credit Snapshot (Synced to Ledger) */}
                     <div className="bg-slate-100 rounded-xl p-4 mb-6 flex justify-between items-center border border-slate-200">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Credit Limit</p>
                            <p className="text-sm font-bold text-slate-700">${CREDIT_LIMIT.toLocaleString()}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Cash Available</p>
                            <p className="text-sm font-bold text-slate-700">${summary.totalBalance.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Spending (Used)</p>
                            <p className="text-sm font-bold text-slate-900">${sim.currentBalance.toLocaleString()}</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-6">
                        <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                            value={decisionType}
                            onChange={(e) => setDecisionType(e.target.value)}
                        >
                            <option value="purchase">Large Purchase (Credit)</option>
                            <option value="loan">New Monthly Loan</option>
                            <option value="income_drop">Income Reduction</option>
                        </select>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input 
                                type="number" 
                                placeholder="Amount / Monthly Value"
                                className="w-full p-3 pl-8 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400"
                                value={decisionAmount}
                                onChange={e => setDecisionAmount(e.target.value)}
                            />
                        </div>
                     </div>

                     {/* Stability Index Gauge */}
                     <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden mb-6 shadow-lg">
                        <div className="flex justify-between items-end mb-4 relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Stability Index</p>
                                    <button onClick={() => setShowStabilityInfo(!showStabilityInfo)} className="text-slate-400 hover:text-white transition-colors">
                                        <Info size={14} />
                                    </button>
                                </div>
                                <div className="text-4xl font-black tracking-tighter">{sim.projectedScore} <span className="text-sm font-medium text-slate-500">/ 100</span></div>
                            </div>
                            <div className={`text-right ${sim.scoreDelta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                <span className="text-xs font-bold">{sim.scoreDelta < 0 ? '▼ Impact' : '— Stable'}</span>
                                <div className="text-lg font-bold">{sim.scoreDelta !== 0 ? Math.abs(sim.scoreDelta) : 0} pts</div>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative z-10">
                             <div 
                                className={`h-full transition-all duration-500 ease-out ${sim.projectedScore > 70 ? 'bg-emerald-500' : sim.projectedScore > 40 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                style={{ width: `${sim.projectedScore}%` }}
                             ></div>
                        </div>

                        {showStabilityInfo && (
                            <div className="absolute inset-0 bg-slate-900/95 z-20 flex items-center justify-center p-6 text-center animate-fade-in" onClick={() => setShowStabilityInfo(false)}>
                                <p className="text-xs leading-relaxed text-slate-300">
                                    This index is a composite measure of your <strong>credit utilization</strong>, <strong>fixed expense pressure</strong>, and <strong>financial buffer</strong> (savings). It is NOT a credit score. It measures your ability to weather financial shocks.
                                </p>
                            </div>
                        )}
                     </div>

                     {/* Single Outcome Slide */}
                     <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-center animate-fade-in">
                        <h4 className="font-bold text-slate-900 text-sm mb-1">Resilience Outlook</h4>
                        <p className="text-xs text-slate-500 mb-4">How this decision affects your financial foundation.</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] uppercase font-black text-slate-400">Utilization</span>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-slate-500">{sim.currentUtil.toFixed(1)}%</span>
                                    <ArrowRight size={12} className="text-slate-300"/>
                                    <span className={`text-sm font-black ${sim.projectedUtil > 30 ? 'text-amber-500' : 'text-slate-900'}`}>{sim.projectedUtil.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200">
                                <span className="text-[10px] uppercase font-black text-slate-400">Buffer Health</span>
                                <div className="mt-1">
                                    {sim.scoreDelta < -10 ? (
                                        <span className="text-xs font-bold text-red-500 flex items-center justify-center gap-1"><AlertCircle size={12}/> Weakened</span>
                                    ) : (
                                        <span className="text-xs font-bold text-green-600 flex items-center justify-center gap-1"><CheckCircle2 size={12}/> Stable</span>
                                    )}
                                </div>
                            </div>
                        </div>
                     </div>
                  </div>
                )}
             </div>

          </div>

          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
             {/* Tool 3: Volatility Planner */}
             <div 
                className={`rounded-[2rem] p-8 border transition-all cursor-pointer relative ${
                    activeUniversalTool === 'volatility' 
                    ? 'bg-white border-[#003A6F] shadow-xl ring-1 ring-[#003A6F]/10' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                } ${isRecommended('volatility') ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`} 
                onClick={() => setActiveUniversalTool('volatility')}
             >
                {isRecommended('volatility') && (
                    <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Recommended</div>
                )}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100 shrink-0">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">Income Volatility Planner</h3>
                        <p className="text-slate-500 text-sm">Calculate safety buffers for freelance or hourly work.</p>
                    </div>
                </div>
                {activeUniversalTool === 'volatility' && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in space-y-3" onClick={e => e.stopPropagation()}>
                    <input type="number" placeholder="High Month Income ($)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={volatilityInput.high} onChange={e => setVolatilityInput({...volatilityInput, high: e.target.value})} />
                    <input type="number" placeholder="Low Month Income ($)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={volatilityInput.low} onChange={e => setVolatilityInput({...volatilityInput, low: e.target.value})} />
                    <input type="number" placeholder="Monthly Expenses ($)" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm" value={volatilityInput.expenses} onChange={e => setVolatilityInput({...volatilityInput, expenses: e.target.value})} />
                    <button onClick={calculateBuffer} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider">Analyze Gap</button>
                    {volatilityResult && <p className="text-xs text-slate-700 bg-blue-50 p-4 rounded-xl leading-relaxed border border-blue-100">{volatilityResult}</p>}
                  </div>
                )}
             </div>

             {/* Tool 4: Credit Visualizer */}
             <div 
                className={`rounded-[2rem] p-8 border transition-all cursor-pointer relative ${
                    activeUniversalTool === 'credit' 
                    ? 'bg-white border-[#003A6F] shadow-xl ring-1 ring-[#003A6F]/10' 
                    : 'bg-slate-50 border-slate-100 hover:border-slate-300'
                } ${isRecommended('credit') ? 'ring-2 ring-purple-400 ring-offset-2' : ''}`} 
                onClick={() => setActiveUniversalTool('credit')}
             >
                {isRecommended('credit') && (
                    <div className="absolute top-4 right-4 bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Recommended</div>
                )}
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm border border-slate-100 shrink-0">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-900 mb-1">Credit Tradeoff Visualizer</h3>
                        <p className="text-slate-500 text-sm">See how utilization impacts your score potential.</p>
                    </div>
                </div>
                {activeUniversalTool === 'credit' && (
                  <div className="mt-6 pt-6 border-t border-slate-100 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                      <span>0%</span>
                      <span>Utilization: {creditUtilization}%</span>
                      <span>100%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={creditUtilization} 
                      onChange={e => setCreditUtilization(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#003A6F]"
                    />
                    <div className="mt-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                        <span className={`block text-xl font-black ${getCreditScoreImpact(creditUtilization).color} mb-1`}>
                          {getCreditScoreImpact(creditUtilization).score}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{getCreditScoreImpact(creditUtilization).desc}</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </Reveal>
      </section>

      {/* =========================================
          SECTION 2: EMPOWER HERWEALTH (Featured Module)
          ========================================= */}
      <section className="relative w-full py-24 px-6 lg:px-12 overflow-hidden z-10 border-t border-slate-100">
        
        {/* Strictly Contained Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF0F5] via-[#F8F0FC] to-[#FFFFFF] z-0"></div>
        <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-200/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-200/20 rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '2s' }}></div>

        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto">
           {/* Section Header */}
           <Reveal>
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
               <div>
                 <h2 className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-900 to-pink-700 tracking-tight flex items-center gap-3">
                   Empower HerWealth <Sparkles className="text-pink-500" size={28}/>
                 </h2>
                 <p className="text-purple-900/60 mt-2 text-lg font-medium max-w-xl">
                   A dedicated space to bridge the wealth gap. Tools built to recognize your value and protect your future.
                 </p>
               </div>
               {/* Toggle Switch */}
               <div className="bg-white/50 p-1.5 rounded-2xl inline-flex backdrop-blur-md border border-white/40 shadow-sm">
                   <button 
                     onClick={() => setActivePillar('career')}
                     className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activePillar === 'career' ? 'bg-white text-purple-900 shadow-md scale-[1.02]' : 'text-purple-900/50 hover:bg-white/40'}`}
                   >
                     Career Ascent
                   </button>
                   <button 
                     onClick={() => setActivePillar('life')}
                     className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activePillar === 'life' ? 'bg-white text-pink-900 shadow-md scale-[1.02]' : 'text-purple-900/50 hover:bg-white/40'}`}
                   >
                     Life & Family
                   </button>
               </div>
             </div>
           </Reveal>

           {/* --- PILLAR 1: CAREER ASCENT --- */}
           {activePillar === 'career' && (
             <div className="transition-opacity duration-700 ease-in-out animate-fade-in">
                  <div>
                    {salaryStep === 'input' && (
                      <Reveal delay={200} className="bg-white/60 backdrop-blur-xl p-8 lg:p-10 rounded-[2.5rem] shadow-xl shadow-purple-900/5 border border-white/60 relative overflow-hidden transition-all duration-500">
                        {isRecommended('salary') && (
                            <div className="absolute top-6 right-6 bg-purple-100/80 text-purple-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">Recommended for You</div>
                        )}
                        <h3 className="font-black text-slate-900 text-2xl mb-8">Salary Advocate</h3>
                        <div className="relative space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2 group">
                                <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Job Role</label>
                                <div className="relative">
                                   <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-purple-600 transition-colors" size={18} />
                                   <input type="text" placeholder="e.g. Senior Product Manager" className="w-full pl-14 p-5 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-900" value={jobDetails.role} onChange={e => setJobDetails({...jobDetails, role: e.target.value})} />
                                </div>
                              </div>
                              <div className="space-y-2 group">
                                <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Company</label>
                                <div className="relative">
                                   <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-purple-600 transition-colors" size={18} />
                                   <input type="text" placeholder="e.g. Acme Corp" className="w-full pl-14 p-5 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-900" value={jobDetails.company} onChange={e => setJobDetails({...jobDetails, company: e.target.value})} />
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2 group">
                                  <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Experience</label>
                                  <input type="text" placeholder="e.g. 5 Years" className="w-full p-5 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-bold text-slate-900" value={jobDetails.experience} onChange={e => setJobDetails({...jobDetails, experience: e.target.value})} />
                              </div>
                              <div className="space-y-2 group">
                                <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Current Offer ($)</label>
                                <div className="relative">
                                  <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-300 group-focus-within:text-purple-600 transition-colors" size={20} />
                                  <input type="text" placeholder="120,000" className="w-full pl-14 p-5 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 focus:ring-4 focus:ring-purple-500/10 transition-all font-black text-xl text-slate-900" value={jobDetails.offerAmount} onChange={e => setJobDetails({...jobDetails, offerAmount: e.target.value})} />
                                </div>
                              </div>
                            </div>

                            {/* PROGRESSIVE DISCLOSURE: Context Fields */}
                            <div className="border-t border-purple-100/50 pt-4">
                                <button 
                                  onClick={() => setShowAdvancedSalary(!showAdvancedSalary)}
                                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-600 hover:text-purple-800 transition-colors mb-4"
                                >
                                  {showAdvancedSalary ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} 
                                  Refine Analysis Details (Location, Level, Type)
                                </button>
                                
                                {showAdvancedSalary && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in bg-purple-50/30 p-6 rounded-2xl border border-purple-50">
                                      <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Location</label>
                                        <div className="flex gap-2">
                                           <div className="relative flex-1">
                                              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={16} />
                                              <input type="text" placeholder="e.g. NYC" className="w-full pl-10 p-4 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 transition-all font-bold text-sm text-slate-900" value={jobDetails.location} onChange={e => setJobDetails({...jobDetails, location: e.target.value})} />
                                           </div>
                                           <button 
                                             onClick={() => setJobDetails({...jobDetails, isRemote: !jobDetails.isRemote})}
                                             className={`px-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center transition-all ${jobDetails.isRemote ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-purple-50 text-slate-400 hover:border-purple-200'}`}
                                           >
                                              <span className="leading-none mb-0.5">Remote</span>
                                              {jobDetails.isRemote ? <CheckSquare size={12}/> : <Square size={12}/>}
                                           </button>
                                        </div>
                                      </div>

                                      <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Role Level</label>
                                        <div className="relative">
                                          <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={16} />
                                          <select 
                                            className="w-full pl-10 p-4 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 transition-all font-bold text-sm text-slate-900 appearance-none"
                                            value={jobDetails.level}
                                            onChange={e => setJobDetails({...jobDetails, level: e.target.value})}
                                          >
                                            <option value="Entry/Junior">Entry / Junior</option>
                                            <option value="Mid-Level">Mid-Level</option>
                                            <option value="Senior">Senior</option>
                                            <option value="Lead/Staff">Lead / Staff</option>
                                            <option value="Manager">Manager</option>
                                            <option value="Director+">Director +</option>
                                          </select>
                                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>
                                      </div>

                                      <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Compensation Type</label>
                                        <div className="relative">
                                          <GitCommit className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={16} />
                                          <select 
                                            className="w-full pl-10 p-4 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 transition-all font-bold text-sm text-slate-900 appearance-none"
                                            value={jobDetails.compType}
                                            onChange={e => setJobDetails({...jobDetails, compType: e.target.value})}
                                          >
                                            <option value="Base Only">Base Salary Only</option>
                                            <option value="Base + Bonus">Base + Bonus</option>
                                            <option value="Total Comp">Total Comp (inc. Equity)</option>
                                          </select>
                                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-purple-900/40 uppercase tracking-widest px-1">Negotiation Stage</label>
                                        <div className="relative">
                                          <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" size={16} />
                                          <select 
                                            className="w-full pl-10 p-4 bg-white border-2 border-purple-50 rounded-2xl outline-none focus:border-purple-300 transition-all font-bold text-sm text-slate-900 appearance-none"
                                            value={jobDetails.stage}
                                            onChange={e => setJobDetails({...jobDetails, stage: e.target.value})}
                                          >
                                            <option value="Initial Offer">Initial Offer</option>
                                            <option value="Countering">Countering</option>
                                            <option value="Final Offer">Final Offer</option>
                                          </select>
                                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                        </div>
                                      </div>
                                  </div>
                                )}
                            </div>

                            <button onClick={handleSalaryAnalyze} disabled={!jobDetails.offerAmount || !jobDetails.role} className="w-full bg-[#003A6F] text-white font-black text-lg py-6 rounded-2xl hover:bg-[#00284d] hover:shadow-xl transition-all duration-300 shadow-lg shadow-purple-900/10 mt-6 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-50">
                              Analyze Offer <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                      </Reveal>
                    )}

                    {/* ... (Existing Salary Logic remains) ... */}
                    {salaryStep === 'analyzing' && (
                        <div className="py-24 text-center animate-fade-in flex flex-col items-center justify-center">
                          <Loader2 size={40} className="text-purple-600 animate-spin mb-4" />
                          <h3 className="text-2xl font-bold text-purple-900">Consulting Market Data...</h3>
                        </div>
                    )}

                    {salaryStep === 'results' && analysis && (
                      <Reveal className="space-y-8">
                          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-purple-900/5 border border-white/60 p-10 text-center">
                              {renderFairnessBadge(analysis.status)}
                              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mt-6 mb-2 tracking-tighter">{analysis.marketRate}</h2>
                              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Target Market Range</p>
                              <p className="mt-8 text-slate-600 leading-relaxed text-lg max-w-xl mx-auto font-medium">{analysis.reasoning}</p>
                              
                              {analysis.status !== 'Leading' && (
                                <div className="mt-8 bg-red-50/50 p-6 rounded-2xl border border-red-100/50 inline-block text-left">
                                    <p className="text-xl font-bold text-slate-900">
                                      Potential 5-Year Loss: <span className="text-red-600">{analysis.wealthGap}</span>
                                    </p>
                                </div>
                              )}
                          </div>

                          {!script ? (
                            <button onClick={handleGenerateScript} disabled={isGeneratingScript} className="w-full bg-[#003A6F] text-white font-black text-lg py-6 rounded-2xl hover:bg-[#00284d] shadow-xl flex items-center justify-center gap-3 transition-all">
                              {isGeneratingScript ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />} Generate Negotiation Script
                            </button>
                          ) : (
                            <div className="bg-white rounded-[2.5rem] border border-purple-100 shadow-xl overflow-hidden animate-fade-in">
                                <div className="bg-purple-50/50 p-6 border-b border-purple-100 flex justify-between items-center">
                                  <span className="font-bold text-purple-900 flex items-center gap-2"><Sparkles size={20}/> Your Script</span>
                                  <button onClick={() => handleCopy(script, setSalaryCopied)} className="text-xs font-bold uppercase text-purple-700 flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-purple-100">
                                    {salaryCopied ? <CheckCircle2 size={14}/> : <Copy size={14}/>} {salaryCopied ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <div className="p-10 bg-white/50"><p className="text-slate-700 whitespace-pre-wrap leading-loose text-lg font-serif">{script}</p></div>
                                <button onClick={() => { setSalaryStep('input'); setScript(''); setAnalysis(null); }} className="w-full p-5 bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 flex items-center justify-center gap-2"><RefreshCw size={16}/> Start Over</button>
                            </div>
                          )}
                      </Reveal>
                    )}
                  </div>
             </div>
           )}

           {/* --- PILLAR 2: LIFE & FAMILY --- */}
           {activePillar === 'life' && (
             <div className="transition-opacity duration-700 ease-in-out animate-fade-in">
                  <Reveal>
                      <div className="bg-white/80 p-10 rounded-[2.5rem] shadow-lg border border-white/60 text-center max-w-2xl mx-auto relative">
                           {isRecommended('stability') && (
                            <div className="absolute top-6 right-6 bg-pink-100/80 text-pink-700 text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest backdrop-blur-md">Recommended</div>
                           )}
                           <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6 text-pink-500">
                               <Umbrella size={32} />
                           </div>
                           <h3 className="font-black text-2xl text-slate-900 mb-2">Single Income Mode</h3>
                           <p className="text-slate-500 mb-8 max-w-lg mx-auto">Prepare for career interruptions or reduced hours. We've auto-filled your safety buffer based on your ledger data.</p>
                           
                           <div className="bg-pink-50/50 p-6 rounded-2xl border border-pink-100 mb-8 text-left">
                               <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-pink-900 text-sm flex items-center gap-2">
                                     <Sliders size={16}/> Scenario Toggles
                                  </h4>
                                  {stabilityInput.isAutoDerived && (
                                     <span className="text-[10px] bg-white px-2 py-1 rounded-full text-pink-400 font-bold border border-pink-100 flex items-center gap-1">
                                       <RotateCcw size={10} /> Auto-filled from Ledger
                                     </span>
                                  )}
                               </div>
                               
                               <div className="grid grid-cols-2 gap-4 mb-6">
                                    <button 
                                      onClick={() => setStabilityScenarios(p => ({...p, leanMode: !p.leanMode}))}
                                      className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${stabilityScenarios.leanMode ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-200 text-slate-600 hover:border-pink-300'}`}
                                    >
                                       <span>Lean Mode (-15% Exp)</span>
                                       {stabilityScenarios.leanMode ? <CheckCircle2 size={14}/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                                    </button>
                                    <button 
                                      onClick={() => setStabilityScenarios(p => ({...p, severance: !p.severance}))}
                                      className={`p-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${stabilityScenarios.severance ? 'bg-pink-500 border-pink-500 text-white' : 'bg-white border-pink-200 text-slate-600 hover:border-pink-300'}`}
                                    >
                                       <span>Add 1 Month Buffer</span>
                                       {stabilityScenarios.severance ? <CheckCircle2 size={14}/> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300"></div>}
                                    </button>
                               </div>

                               <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquid Assets (Savings)</label>
                                        <div className="relative">
                                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                           <input 
                                             type="number" 
                                             className="w-full pl-8 p-3 bg-white border border-pink-100 rounded-xl font-bold text-lg outline-none focus:border-pink-400 transition-all text-slate-900" 
                                             value={stabilityInput.savings} 
                                             onChange={e => setStabilityInput({...stabilityInput, savings: e.target.value, isAutoDerived: false})} 
                                           />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Essential Expenses</label>
                                        <div className="relative">
                                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                           <input 
                                              type="number" 
                                              className="w-full pl-8 p-3 bg-white border border-pink-100 rounded-xl font-bold text-lg outline-none focus:border-pink-400 transition-all text-slate-900" 
                                              value={stabilityInput.burnRate} 
                                              onChange={e => setStabilityInput({...stabilityInput, burnRate: e.target.value, isAutoDerived: false})} 
                                           />
                                        </div>
                                    </div>
                               </div>
                           </div>

                           {getRunwayData().runway > 0 && (
                               <div className="mt-8 animate-fade-in relative">
                                   <div className="mb-6">
                                       <div className="flex justify-between items-end mb-2">
                                          <div className="text-left">
                                             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Financial Runway</div>
                                             <div className="text-5xl font-black text-slate-900 tracking-tighter">{getRunwayData().runway} <span className="text-lg text-slate-500 font-medium tracking-normal">Months</span></div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Confidence Range</div>
                                              <div className="text-sm font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-lg inline-block border border-pink-100">
                                                 {getRunwayData().lowRunway} - {getRunwayData().highRunway} Months
                                              </div>
                                          </div>
                                       </div>
                                       
                                       {/* Runway Visualization Bar */}
                                       <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden relative flex">
                                           {/* Zones */}
                                           <div className="w-[25%] h-full bg-red-200" title="Critical Zone (0-3 mo)"></div>
                                           <div className="w-[25%] h-full bg-amber-200" title="Warning Zone (3-6 mo)"></div>
                                           <div className="w-[50%] h-full bg-emerald-200" title="Stability Zone (6+ mo)"></div>
                                           
                                           {/* Marker */}
                                           <div 
                                              className="absolute top-0 bottom-0 w-1 bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.3)] transition-all duration-700 z-10"
                                              style={{ left: `${Math.min(100, (getRunwayData().runway / 12) * 100)}%` }}
                                           ></div>
                                       </div>
                                       <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                          <span>0 Mo</span>
                                          <span>3 Mo</span>
                                          <span>6 Mo</span>
                                          <span>12+ Mo</span>
                                       </div>
                                   </div>

                                   <div className="p-4 bg-white border border-slate-200 rounded-xl text-left flex gap-3 items-start shadow-sm">
                                      <Shield size={18} className="text-pink-500 shrink-0 mt-0.5" />
                                      <p className="text-xs text-slate-600 leading-relaxed font-medium">
                                          Based on your <strong>${getRunwayData().finalSavings.toLocaleString()}</strong> liquid assets and <strong>${getRunwayData().finalBurn.toLocaleString()}/mo</strong> burn rate{stabilityScenarios.leanMode ? ' (Lean Mode)' : ''}. 
                                          {getRunwayData().runway < 3 ? ' Consider immediate expense reduction strategies.' : ' You have a solid buffer for career transitions.'}
                                      </p>
                                   </div>
                               </div>
                           )}
                      </div>
                  </Reveal>
             </div>
           )}
        </div>
      </section>
      
      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Empower;