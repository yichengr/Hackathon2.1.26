
import React, { useEffect, useState, useMemo } from 'react';
import { AccountSummary, Transaction, IncomeFrequency, LifePurpose } from '../types';
import { ArrowUpRight, ArrowDownLeft, DollarSign, Wallet, TrendingUp, Sparkles, Edit2, Check, X, Calculator, CalendarClock, ChevronDown, Activity, AlertCircle, Zap, Loader2, Compass } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';
import { generateSpendingInsights } from '../services/geminiService';

interface DashboardProps {
  summary: AccountSummary;
  transactions: Transaction[];
  onUpdateSummary: (summary: AccountSummary) => void;
}

const COLORS = ['#004879', '#D03027', '#F59E0B', '#10B981', '#6366F1', '#8B5CF6'];

// Helper to fetch logos
const getLogoUrl = (merchantName: string) => {
  // Explicit mapping for known mock data and common brands
  const map: Record<string, string> = {
    'netflix': 'netflix.com',
    'spotify': 'spotify.com',
    'hulu': 'hulu.com',
    'prime': 'amazon.com',
    'amazon': 'amazon.com',
    'apple': 'apple.com',
    'verizon': 'verizon.com',
    't-mobile': 't-mobile.com',
    'at&t': 'att.com',
    'shell': 'shell.com',
    'starbucks': 'starbucks.com',
    'whole foods': 'wholefoodsmarket.com',
    'target': 'target.com',
    'uber': 'uber.com',
    'lyft': 'lyft.com',
    'cvs': 'cvs.com',
    'trader joes': 'traderjoes.com',
    'amc': 'amctheatres.com',
    'disney': 'disneyplus.com',
    'costco': 'costco.com',
    'walmart': 'walmart.com',
    'ikea': 'ikea.com',
    'gym': 'equinox.com',
    'equinox': 'equinox.com',
    'planet fitness': 'planetfitness.com',
    'fitness': 'planetfitness.com',
    'utility': 'pge.com', // Generic utility
    'city power': 'coned.com', // Example utility
    'electric': 'sce.com'
  };
  
  const lower = merchantName.toLowerCase();
  
  // 1. Direct map check
  for (const key of Object.keys(map)) {
    if (lower.includes(key)) {
      return `https://logo.clearbit.com/${map[key]}`;
    }
  }

  // 2. Fallback: try to use the merchant name as domain if no space (e.g. "Dropbox")
  if (!lower.includes(' ')) {
      return `https://logo.clearbit.com/${lower}.com`;
  }

  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ summary, transactions, onUpdateSummary }) => {
  const [insight, setInsight] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editGoalValue, setEditGoalValue] = useState<string>('');
  const [editFrequency, setEditFrequency] = useState<IncomeFrequency>(summary.incomeFrequency);
  const [editDay, setEditDay] = useState<string>(summary.incomeDay);
  
  // Spending Dropdown State
  const currentMonthKey = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonthKey);

  // Calculate monthly totals and unique months
  const { monthlyTotals, availableMonths, averageSpend, subscriptions } = useMemo(() => {
    const totals: Record<string, number> = {};
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    const potentialSubs: Transaction[] = [];
    
    // Simple logic to find likely subscriptions based on common names or duplicate amounts
    const subKeywords = ['netflix', 'spotify', 'hulu', 'gym', 'apple', 'prime', 'utility', 'internet', 'verizon', 't-mobile', 'insurance', 'subscription', 'membership', 'box'];

    expenseTransactions.forEach(t => {
      const key = t.date.substring(0, 7); // YYYY-MM
      totals[key] = (totals[key] || 0) + Math.abs(t.amount);
      
      const lowerDesc = t.description.toLowerCase();
      if (subKeywords.some(k => lowerDesc.includes(k))) {
        // Avoid duplicates in the list display for the same merchant in the same month logic (simplified for UI)
         if (!potentialSubs.find(s => s.merchant === t.merchant)) {
             potentialSubs.push(t);
         }
      }
    });

    const months = Object.keys(totals).sort((a, b) => b.localeCompare(a));
    const values = Object.values(totals);
    const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return { monthlyTotals: totals, availableMonths: months, averageSpend: average, subscriptions: potentialSubs };
  }, [transactions]);

  // Wellness Score Logic
  const wellnessScore = useMemo(() => {
    let score = 50; // Base score
    
    // Factor 1: Savings Rate (Up to 30 points)
    const savingsRate = summary.monthlyIncome > 0 ? (summary.currentSavings / summary.savingsGoal) * 100 : 0;
    score += Math.min(30, (summary.savingsPercentage * 1.5)); 

    // Factor 2: Budget Adherence (Up to 20 points)
    const currentSpending = monthlyTotals[currentMonthKey] || 0;
    if (summary.monthlyIncome > 0 && currentSpending < summary.monthlyIncome) {
        score += 20;
    } else if (summary.monthlyIncome > 0) {
        score -= 10; // Penalty for overspending
    }

    // Factor 3: Balance Health (Up to 10 points)
    if (summary.totalBalance > 5000) score += 10;
    else if (summary.totalBalance > 1000) score += 5;

    return Math.min(100, Math.max(0, Math.round(score)));
  }, [summary, monthlyTotals, currentMonthKey]);

  useEffect(() => {
    let mounted = true;
    setIsAnalyzing(true);
    // Use timeout to prevent hydration mismatches and allow UI to settle
    const timeout = setTimeout(() => {
        if (transactions.length > 0) {
        generateSpendingInsights(transactions).then(text => {
            if (mounted) {
            setInsight(text);
            setIsAnalyzing(false);
            }
        });
        } else {
            if (mounted) {
                setInsight("Enter some transactions to generate AI spending insights!");
                setIsAnalyzing(false);
            }
        }
    }, 500);

    return () => { 
        mounted = false; 
        clearTimeout(timeout);
    };
  }, [transactions]);

  const handleEdit = (field: keyof AccountSummary) => {
    setEditingField(field);
    if (field === 'monthlyIncome') {
      setEditValue(summary.paycheckAmount.toString());
      setEditFrequency(summary.incomeFrequency);
      setEditDay(summary.incomeDay);
    } else if (field === 'savingsGoal') {
      setEditValue(summary.savingsPercentage.toString());
      setEditGoalValue(summary.savingsGoal.toString());
    } else {
      setEditValue(summary[field].toString());
    }
  };

  const handleSave = () => {
    if (editingField) {
      const updates: any = {};
      
      if (editingField === 'monthlyIncome') {
        const pAmount = parseFloat(editValue) || 0;
        updates.paycheckAmount = pAmount;
        updates.incomeFrequency = editFrequency;
        updates.incomeDay = editDay;
        
        let monthlyTotal = pAmount;
        if (editFrequency === 'weekly') monthlyTotal = pAmount * 4;
        else if (editFrequency === 'biweekly') monthlyTotal = pAmount * 2;
        
        updates.monthlyIncome = monthlyTotal;
      } else if (editingField === 'savingsGoal') {
        updates.savingsPercentage = parseFloat(editValue) || 0;
        updates.savingsGoal = parseFloat(editGoalValue) || 0;
      } else {
        updates[editingField] = parseFloat(editValue) || 0;
      }

      onUpdateSummary({
        ...summary,
        ...updates
      });
      setEditingField(null);
    }
  };

  // --- DATA PREPARATION FOR LENS ---
  const expenses = transactions.filter(t => t.amount < 0);

  const categoryData = expenses.reduce((acc, curr) => {
    const cat = curr.category;
    const existing = acc.find(i => i.name === cat);
    if (existing) { existing.value += Math.abs(curr.amount); } 
    else { acc.push({ name: cat, value: Math.abs(curr.amount) }); }
    return acc;
  }, [] as { name: string; value: number }[]).sort((a, b) => b.value - a.value);

  // Insights for Lens
  const getLensInsight = () => {
    if (categoryData.length === 0) return "No spending data available yet.";
    const top = categoryData[0];
    return `Observation: Your highest spending category is ${top.name}, making up a significant portion of your expenses.`;
  };

  const getDisplaySpending = () => {
    if (selectedPeriod === 'average') return averageSpend;
    return monthlyTotals[selectedPeriod] || 0;
  };

  const formatMonthLabel = (key: string) => {
    if (key === 'average') return 'Overall Average';
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    return key === currentMonthKey ? `${label} (Current)` : label;
  };

  const scoreData = [{ name: 'Score', value: wellnessScore, fill: wellnessScore > 70 ? '#10B981' : wellnessScore > 40 ? '#F59E0B' : '#D03027' }];

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 mt-1">Real-time insights into your financial wellness.</p>
        </div>
        <div className="bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm flex items-center gap-3 animate-fade-in transition-all">
            {isAnalyzing ? (
              <Loader2 size={20} className="text-[#004879] shrink-0 animate-spin" />
            ) : (
              <Sparkles size={20} className="text-[#004879] shrink-0" />
            )}
            <span className="text-sm font-medium text-slate-700 leading-tight">
              {isAnalyzing ? "Analyzing financial patterns..." : insight}
            </span>
        </div>
      </div>

      {/* Wellness Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-gradient-to-br from-[#003A6F] to-[#004879] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden flex flex-col justify-between">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
           <div>
             <h3 className="text-lg font-bold flex items-center gap-2"><Activity size={20}/> Financial Health Score</h3>
             <p className="text-blue-200 text-xs mt-1">Calculated based on savings & spending habits.</p>
           </div>
           
           <div className="flex items-center justify-center py-4">
              <div className="w-32 h-32 relative flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart innerRadius="80%" outerRadius="100%" barSize={10} data={scoreData} startAngle={180} endAngle={0}>
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar background dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                 </ResponsiveContainer>
                 <div className="absolute text-center mt-[-20px]">
                   <span className="text-4xl font-black">{wellnessScore}</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-white/10 rounded-xl p-3 flex justify-between items-center backdrop-blur-sm">
              <span className="text-xs font-bold uppercase tracking-wider">Status:</span>
              <span className="text-sm font-bold bg-white text-[#003A6F] px-2 py-0.5 rounded-md">
                {wellnessScore > 80 ? 'Excellent' : wellnessScore > 50 ? 'Good' : 'Needs Focus'}
              </span>
           </div>
        </div>

        {/* Subscription Scanner */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Zap size={20} className="text-[#F59E0B]" /> Subscription Scanner</h3>
                  <p className="text-slate-500 text-xs">Recurring payments detected in your ledger.</p>
               </div>
               <div className="text-right">
                  <span className="block text-2xl font-black text-slate-900">
                    ${subscriptions.reduce((acc, curr) => acc + Math.abs(curr.amount), 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Monthly Cost</span>
               </div>
            </div>
            
            <div className="flex-1 overflow-x-auto pb-2">
               <div className="flex gap-3">
                 {subscriptions.length > 0 ? subscriptions.map((sub, idx) => {
                    const logoUrl = getLogoUrl(sub.merchant);
                    return (
                      <div key={idx} className="min-w-[140px] bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-between">
                         <div className="flex items-start justify-between">
                            <div className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center font-bold text-[#003A6F] text-xs shadow-sm overflow-hidden relative">
                               {logoUrl ? (
                                  <img 
                                    src={logoUrl} 
                                    alt={sub.merchant}
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover" 
                                    onError={(e) => { 
                                        (e.target as HTMLImageElement).style.display = 'none'; 
                                        (e.target as HTMLImageElement).parentElement!.classList.add('fallback-text');
                                    }} 
                                  />
                               ) : null}
                               <span className="absolute inset-0 flex items-center justify-center z-0 fallback-content">
                                    {sub.description.charAt(0)}
                               </span>
                               <style>{`
                                 .fallback-content { display: none; }
                                 .fallback-text .fallback-content { display: flex; }
                                 img:not([style*="display: none"]) + .fallback-content { display: none; }
                                 div:not(:has(img)) .fallback-content { display: flex; }
                               `}</style>
                            </div>
                            <span className="text-xs font-bold text-slate-900">${Math.abs(sub.amount)}</span>
                         </div>
                         <div className="mt-3">
                            <p className="text-xs font-bold text-slate-700 truncate">{sub.merchant}</p>
                            <p className="text-[10px] text-slate-400">Recurring</p>
                         </div>
                      </div>
                    );
                 }) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm italic bg-slate-50 rounded-xl border-dashed border-2 border-slate-200 p-4">
                     No subscriptions detected yet.
                   </div>
                 )}
               </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric Cards (Balance, Income, etc.) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 text-[#003A6F] rounded-lg"><Wallet size={20} /></div>
            <button onClick={() => handleEdit('totalBalance')} className="text-slate-400 hover:text-[#004879] opacity-0 group-hover:opacity-100 transition-opacity p-1"><Edit2 size={14} /></button>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</p>
          {editingField === 'totalBalance' ? (
            <div className="flex items-center gap-2 mt-1">
              <input type="number" autoFocus className="w-full text-xl font-bold border-b-2 border-[#004879] outline-none bg-transparent" value={editValue} onChange={e => setEditValue(e.target.value)} />
              <button onClick={handleSave} className="text-green-600 p-1 hover:bg-green-50 rounded-lg"><Check size={18}/></button>
            </div>
          ) : (
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">${summary.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 text-[#D03027] rounded-lg"><Calculator size={20} /></div>
            <div className="relative">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="text-[10px] font-black text-[#D03027] uppercase tracking-tighter bg-red-50/50 border border-red-100 rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-red-100 transition-colors appearance-none pr-6"
              >
                <option value={currentMonthKey}>Current Month</option>
                {availableMonths.filter(m => m !== currentMonthKey).map(m => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
                <option value="average">Overall Average</option>
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#D03027] pointer-events-none" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Monthly Spending</p>
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              ${getDisplaySpending().toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
              {formatMonthLabel(selectedPeriod)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg"><DollarSign size={20} /></div>
            <button onClick={() => handleEdit('monthlyIncome')} className="text-slate-400 hover:text-green-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"><CalendarClock size={14} /></button>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Projected Income</p>
          {editingField === 'monthlyIncome' ? (
            <div className="mt-2 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              {/* Editing Form (Omitted for brevity as not changed) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block px-1 uppercase">Paycheck Amount ($):</label>
                <input type="number" className="w-full text-sm font-bold bg-white border rounded px-2 py-1 outline-none focus:border-green-600" value={editValue} onChange={e => setEditValue(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block px-1 uppercase">How often:</label>
                <select className="w-full text-[10px] font-bold bg-white border rounded px-1 py-1 outline-none" value={editFrequency} onChange={e => setEditFrequency(e.target.value as IncomeFrequency)}>
                  <option value="none">Once per Month (Total)</option>
                  <option value="weekly">Every Week</option>
                  <option value="biweekly">Every 2 Weeks</option>
                  <option value="monthly">Every Month</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                 <button onClick={() => setEditingField(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded-lg"><X size={16}/></button>
                 <button onClick={handleSave} className="bg-green-600 text-white p-1 hover:bg-green-700 rounded-lg"><Check size={16}/></button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">${summary.monthlyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1">
                {summary.incomeFrequency === 'none' ? 'Manual Tracking' : `${summary.paycheckAmount.toLocaleString()} ${summary.incomeFrequency}`}
              </p>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={20} /></div>
            <button onClick={() => handleEdit('savingsGoal')} className="text-slate-400 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"><Edit2 size={14} /></button>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Savings Goal ({summary.savingsPercentage}%)</p>
          
          {editingField === 'savingsGoal' ? (
             <div className="mt-2 space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 block px-1 uppercase">Rate (%):</label>
                    <input type="number" className="w-full text-sm font-bold bg-white border rounded px-2 py-1 outline-none focus:border-purple-600" value={editValue} onChange={e => setEditValue(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 block px-1 uppercase">Goal ($):</label>
                    <input type="number" className="w-full text-sm font-bold bg-white border rounded px-2 py-1 outline-none focus:border-purple-600" value={editGoalValue} onChange={e => setEditGoalValue(e.target.value)} />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setEditingField(null)} className="text-slate-400 p-1 hover:bg-slate-200 rounded-lg"><X size={16}/></button>
                    <button onClick={handleSave} className="bg-purple-600 text-white p-1 hover:bg-purple-700 rounded-lg"><Check size={16}/></button>
                </div>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">${Math.floor(summary.currentSavings).toLocaleString()}</h3>
                <span className="text-xs text-slate-400 font-bold mb-1">/ ${summary.savingsGoal.toLocaleString()}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
                <div className="bg-purple-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${summary.savingsGoal > 0 ? Math.min(100, (summary.currentSavings/summary.savingsGoal)*100) : 0}%` }}></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- CATEGORY SPENDING LENS (Simplified) --- */}
      <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Compass size={20} className="text-[#004879]" /> Category Spending Lens
              </h3>
              <p className="text-slate-500 text-sm mt-1">Breakdown of your transaction categories.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-[300px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                      data={categoryData} 
                      cx="50%" cy="50%" 
                      innerRadius={80} outerRadius={110} 
                      paddingAngle={5} 
                      dataKey="value"
                  >
                    {categoryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                      {categoryData.slice(0, 10).map((c, idx) => (
                          <div key={c.name} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                              <span className="truncate flex-1">{c.name}</span>
                              <span>${Math.round(c.value)}</span>
                          </div>
                      ))}
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 italic">
                    "{getLensInsight()}"
                  </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-center text-slate-500 font-medium italic text-sm">
                Reflective Question: Does your spending distribution align with your current life priorities?
            </p>
          </div>
      </div>

    </div>
  );
};

export default Dashboard;
