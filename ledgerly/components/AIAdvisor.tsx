
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, TrendingUp, ShieldAlert, Target, CreditCard, ArrowRight, Zap } from 'lucide-react';
import { ChatMessage, Transaction, AccountSummary, UserProfile } from '../types';
import { generateFinancialAdvice } from '../services/geminiService';

interface AIAdvisorProps {
  transactions: Transaction[];
  summary: AccountSummary;
  user: UserProfile;
}

interface IntentCard {
  id: string;
  icon: React.ElementType;
  label: string;
  subLabel: string;
  query: string; // The raw query sent to the AI
  color: string;
  dataContext?: (t: Transaction[], s: AccountSummary) => string;
}

const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions, summary, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // --- INTENT CARDS CONFIGURATION ---
  const INTENTS: IntentCard[] = [
    {
      id: 'spending_analysis',
      icon: TrendingUp,
      label: 'Spending Analysis',
      subLabel: 'Review my top expense categories',
      query: 'Analyze my spending patterns. What is my highest spending category recently and is it trending up?',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'risk_check',
      icon: ShieldAlert,
      label: 'Risk Assessment',
      subLabel: 'Is my current burn rate safe?',
      query: 'Based on my current balance and monthly spending average, is my financial situation risky right now? Be honest.',
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'transaction_audit',
      icon: CreditCard,
      label: 'Audit Largest Purchase',
      subLabel: 'Explain my biggest recent transaction',
      query: 'Identify my largest recent transaction. Explain if this fits my typical spending habits or if it is an outlier.',
      color: 'from-purple-500 to-pink-600',
      dataContext: (txs) => {
        const largest = [...txs].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];
        return largest ? `Focus strictly on this transaction: ${largest.description} for $${Math.abs(largest.amount)} on ${largest.date}.` : '';
      }
    },
    {
      id: 'savings_pulse',
      icon: Target,
      label: 'Savings Pulse',
      subLabel: 'Am I on track for my goal?',
      query: 'Check my savings progress. Am I saving enough per month to hit my goal within a reasonable time?',
      color: 'from-emerald-500 to-green-600'
    }
  ];

  const handleSend = async (text: string, specificContext: string = '') => {
    if (!text.trim() || isLoading) return;

    setHasInteracted(true);
    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass specific context if the intent generated one (e.g. focusing on a specific transaction)
      const finalQuery = specificContext ? `${specificContext} \n\n User Question: ${text}` : text;
      const responseText = await generateFinancialAdvice(transactions, summary, finalQuery);
      
      const botMessage: ChatMessage = {
        role: 'model',
        content: responseText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        role: 'model',
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const onIntentClick = (intent: IntentCard) => {
    const context = intent.dataContext ? intent.dataContext(transactions, summary) : '';
    handleSend(intent.query, context);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] lg:h-screen bg-slate-50 overflow-hidden relative font-sans">
      
      {/* Animated Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-[#f0f4f8] to-slate-100 z-0 animate-gradient-shift"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-white/50 bg-white/60 backdrop-blur-md flex justify-between items-center shadow-sm z-20 relative">
        <div>
           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 tracking-tight">
            <Sparkles className="text-indigo-600" size={24} /> Ledgerly Assistant
           </h2>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">AI-Powered Financial Guide</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 z-10 relative scroll-smooth pb-32">
        
        {/* WELCOME STATE: GUIDED PROMPTS */}
        {!hasInteracted && messages.length === 0 && (
            <div className="max-w-4xl mx-auto mt-8 lg:mt-16 animate-fade-in">
                <div className="text-center mb-12">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-xl border border-white/50 flex items-center justify-center mx-auto mb-6 relative group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-800 to-indigo-600 rounded-[2rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                        <Bot size={40} className="text-indigo-600 relative z-10" />
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        How can I guide you today, {user.name.split(' ')[0]}?
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto leading-relaxed">
                        I've analyzed your latest ledger entries and stability score. Select a focus area or ask me anything.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
                    {INTENTS.map((intent) => {
                        const Icon = intent.icon;
                        return (
                            <button
                                key={intent.id}
                                onClick={() => onIntentClick(intent)}
                                className="relative group overflow-hidden rounded-3xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/5 border border-white/60 bg-white/60 backdrop-blur-md"
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r ${intent.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-slate-200 to-transparent group-hover:via-indigo-400 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                                
                                <div className="flex items-start justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${intent.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon size={22} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{intent.label}</h3>
                                            <p className="text-sm text-slate-500 font-medium group-hover:text-slate-600">{intent.subLabel}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* CHAT HISTORY */}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 animate-slide-in ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white/20 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600'
              }`}
            >
              {msg.role === 'user' ? <User size={20} className="text-slate-600" /> : <Bot size={20} className="text-white" />}
            </div>
            
            <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-6 shadow-sm backdrop-blur-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white/80 text-slate-800 border border-white/50 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
              <span className={`text-[10px] font-bold uppercase tracking-widest block mt-3 ${msg.role === 'user' ? 'text-indigo-300' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-4 animate-fade-in">
             <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-sm">
               <Bot size={20} className="text-white" />
             </div>
             <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-white/50 rounded-tl-none flex items-center gap-3">
               <Loader2 size={18} className="animate-spin text-indigo-600" />
               <span className="text-slate-500 text-sm font-medium">Analyzing financial data...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Input Area - ALWAYS VISIBLE */}
      <div className="p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 absolute bottom-0 w-full z-20">
        <div className="max-w-4xl mx-auto relative flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            className="flex-1 bg-slate-100 border-2 border-transparent rounded-2xl px-6 py-4 focus:bg-white focus:border-indigo-600 focus:outline-none transition-all placeholder:text-slate-400 text-slate-900 font-medium"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-2xl flex items-center justify-center text-white transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            <Send size={24} className={isLoading ? 'opacity-0' : 'ml-1'} />
            {isLoading && <Loader2 size={24} className="absolute animate-spin" />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AIAdvisor;
