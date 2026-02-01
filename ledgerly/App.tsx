
import React, { useState, useEffect, useCallback } from 'react';
import { Menu, UserCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIAdvisor from './components/AIAdvisor';
import TransactionList from './components/TransactionList';
import Empower from './components/Empower';
import Profile from './components/Profile';
import Auth from './components/Auth';
import FAQ from './components/FAQ';
import LaunchScreen from './components/LaunchScreen';
import { MOCK_SUMMARY, MOCK_TRANSACTIONS } from './services/mockData';
import { Page, AccountSummary, Transaction, UserProfile, IncomeFrequency } from './types';

const App: React.FC = () => {
  // CHANGED: Default page is now EMPOWER (Salary Coach)
  const [currentPage, setCurrentPage] = useState<Page>(Page.EMPOWER);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  
  // Launch Screen Logic
  useEffect(() => {
    const hasSeenLaunch = sessionStorage.getItem('ledgerly_has_launched');
    if (!hasSeenLaunch) {
      setShowLaunch(true);
    }
  }, []);

  const handleLaunchComplete = () => {
    sessionStorage.setItem('ledgerly_has_launched', 'true');
    setShowLaunch(false);
  };
  
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    const saved = localStorage.getItem('capone_registered_users');
    if (saved) return JSON.parse(saved);
    return [{
      name: 'Test User',
      email: 'testuser@gmail.com',
      password: 'test123',
      memberSince: 'August 2023'
    }];
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('capone_isLoggedIn') === 'true';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('capone_user');
    const now = new Date();
    const currentMonthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    return saved ? JSON.parse(saved) : {
      name: 'Test User',
      email: 'testuser@gmail.com',
      memberSince: currentMonthYear,
      avatarColor: 'bg-indigo-600'
    };
  });
  
  const [summary, setSummary] = useState<AccountSummary>(() => {
    const saved = localStorage.getItem('capone_summary_v2');
    return saved ? JSON.parse(saved) : MOCK_SUMMARY;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('capone_transactions_v2');
    return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });

  // Calculate dynamic monthly spending average
  useEffect(() => {
    const expenseTransactions = transactions.filter(t => t.amount < 0);
    if (expenseTransactions.length === 0) {
      if (summary.monthlySpending !== 0) setSummary(prev => ({ ...prev, monthlySpending: 0 }));
      return;
    }
    const monthlyTotals: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      const monthKey = t.date.substring(0, 7);
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Math.abs(t.amount);
    });
    const monthValues = Object.values(monthlyTotals);
    const averageSpending = monthValues.reduce((a, b) => a + b, 0) / monthValues.length;
    if (Math.abs(summary.monthlySpending - averageSpending) > 0.001) {
      setSummary(prev => ({ ...prev, monthlySpending: averageSpending }));
    }
  }, [transactions]);

  // Global handlers for transactions that affect balance AND savings
  const handleAddTransaction = (t: Transaction) => {
    setTransactions(prev => [t, ...prev]);
    
    let savingsPortion = 0;
    if (t.amount > 0 && t.category === 'Income') {
      savingsPortion = t.amount * (summary.savingsPercentage / 100);
    }

    setSummary(prev => ({
      ...prev,
      totalBalance: prev.totalBalance + t.amount,
      currentSavings: prev.currentSavings + savingsPortion
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find(t => t.id === id);
    if (txToDelete) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      let savingsPortion = 0;
      if (txToDelete.amount > 0 && txToDelete.category === 'Income') {
        savingsPortion = txToDelete.amount * (summary.savingsPercentage / 100);
      }

      setSummary(prev => ({
        ...prev,
        totalBalance: prev.totalBalance - txToDelete.amount,
        currentSavings: prev.currentSavings - savingsPortion
      }));
    }
  };

  // --- INCOME PROCESSING ENGINE ---
  useEffect(() => {
    if (!isLoggedIn || summary.incomeFrequency === 'none' || summary.paycheckAmount <= 0) return;

    const checkIncome = () => {
      const now = new Date();
      const lastCheck = new Date(summary.lastProcessedDate);
      
      const payPerCycle = summary.paycheckAmount;

      const newTransactions: Transaction[] = [];
      let balanceAdjustment = 0;
      let savingsAdjustment = 0;
      let tempDate = new Date(lastCheck);
      tempDate.setHours(0, 0, 0, 0);
      
      tempDate.setDate(tempDate.getDate() + 1);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      while (tempDate <= today) {
        let isPayday = false;
        const dayName = tempDate.toLocaleString('en-us', { weekday: 'long' });
        const dayOfMonth = tempDate.getDate().toString();

        if (summary.incomeFrequency === 'weekly') {
          if (dayName === summary.incomeDay) isPayday = true;
        } else if (summary.incomeFrequency === 'biweekly') {
          if (dayName === summary.incomeDay) {
            const msInDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.floor((tempDate.getTime() - new Date(user.memberSince).getTime()) / msInDay);
            if (diffDays % 14 === 0) isPayday = true;
          }
        } else if (summary.incomeFrequency === 'monthly') {
          if (dayOfMonth === summary.incomeDay) isPayday = true;
        }

        if (isPayday) {
          const id = `auto-income-${tempDate.getTime()}`;
          if (!transactions.find(t => t.id === id)) {
            newTransactions.push({
              id,
              date: tempDate.toISOString().split('T')[0],
              description: 'Scheduled Income Deposit',
              amount: payPerCycle,
              category: 'Income',
              merchant: 'Automated Payroll'
            });
            balanceAdjustment += payPerCycle;
            savingsAdjustment += payPerCycle * (summary.savingsPercentage / 100);
          }
        }
        tempDate.setDate(tempDate.getDate() + 1);
      }

      if (newTransactions.length > 0) {
        setTransactions(prev => [...newTransactions, ...prev]);
        setSummary(prev => ({
          ...prev,
          totalBalance: prev.totalBalance + balanceAdjustment,
          currentSavings: prev.currentSavings + savingsAdjustment,
          lastProcessedDate: now.toISOString()
        }));
      } else {
        setSummary(prev => ({ ...prev, lastProcessedDate: now.toISOString() }));
      }
    };

    const interval = setInterval(checkIncome, 60000);
    checkIncome();

    return () => clearInterval(interval);
  }, [isLoggedIn, summary.incomeFrequency, summary.incomeDay, summary.paycheckAmount, summary.savingsPercentage, transactions.length, user.memberSince]);

  useEffect(() => {
    localStorage.setItem('capone_summary_v2', JSON.stringify(summary));
  }, [summary]);

  useEffect(() => {
    localStorage.setItem('capone_transactions_v2', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('capone_isLoggedIn', isLoggedIn.toString());
  }, [isLoggedIn]);

  useEffect(() => {
    localStorage.setItem('capone_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('capone_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  const handleLogin = (userData: UserProfile) => {
    setUser(userData);
    setIsLoggedIn(true);
    // On Login, go straight to Salary Coach (Empower)
    setCurrentPage(Page.EMPOWER);
  };

  const handleRegister = (newUser: any) => {
    setRegisteredUsers(prev => [...prev, newUser]);
    const emptySummary: AccountSummary = {
      totalBalance: 0,
      monthlySpending: 0,
      monthlyIncome: 0,
      paycheckAmount: 0,
      incomeFrequency: 'none',
      incomeDay: 'Monday',
      lastProcessedDate: new Date().toISOString(),
      savingsGoal: 0,
      currentSavings: 0,
      savingsPercentage: 10
    };
    setSummary(emptySummary);
    setTransactions([]);
    localStorage.setItem('capone_summary_v2', JSON.stringify(emptySummary));
    localStorage.setItem('capone_transactions_v2', JSON.stringify([]));
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('capone_isLoggedIn');
    setCurrentPage(Page.EMPOWER);
  };

  const renderContent = () => {
    switch (currentPage) {
      case Page.DASHBOARD:
        return <Dashboard summary={summary} transactions={transactions} onUpdateSummary={setSummary} />;
      case Page.TRANSACTIONS:
        return <TransactionList 
          transactions={transactions} 
          onAddTransaction={handleAddTransaction}
          onDeleteTransaction={handleDeleteTransaction}
        />;
      case Page.ADVISOR:
        return <AIAdvisor transactions={transactions} summary={summary} user={user} />;
      case Page.EMPOWER:
        return <Empower summary={summary} transactions={transactions} />;
      case Page.PROFILE:
        return <Profile user={user} onUpdate={setUser} />;
      case Page.FAQ:
        return <FAQ />;
      default:
        return <Dashboard summary={summary} transactions={transactions} onUpdateSummary={setSummary} />;
    }
  };

  // If showing launch screen and logged in (or just main entry), block until complete
  // But strictly, we might want to show launch before Auth if not logged in? 
  // Requirement: "On app load, render a full-screen neutral background..."
  if (showLaunch) {
    return <LaunchScreen onComplete={handleLaunchComplete} />;
  }

  if (!isLoggedIn) {
    return <Auth onLogin={handleLogin} onRegister={handleRegister} registeredUsers={registeredUsers} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        onSignOut={handleSignOut}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-20">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                <Menu size={24} />
             </button>
             <span className="hidden lg:block text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Financial Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-black text-slate-900 leading-none">{user.name}</span>
            </div>
            <button onClick={() => setCurrentPage(Page.PROFILE)} className={`w-10 h-10 ${user.avatarColor} rounded-full flex items-center justify-center text-white shadow-md border-2 border-white hover:scale-105 transition-transform active:scale-95`}>
              <UserCircle size={26} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto relative bg-[#f8fafc]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
