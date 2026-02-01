
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';

// --- ANIMATION UTILS ---
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

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How is my financial data protected?",
      answer: "We utilize bank-grade 256-bit encryption for all data storage and transmission. Ledgerly adheres to strict privacy standards and does not share your personal financial details with third-party advertisers."
    },
    {
      question: "How does the AI Assistant work?",
      answer: "Our Ledgerly Assistant analyzes your transaction history and spending patterns to provide personalized insights. It uses advanced language models to understand your questions and generate helpful, context-aware financial advice."
    },
    {
      question: "Is this a real bank account?",
      answer: "This application is a demonstration platform designed to showcase financial management tools and AI capabilities. The money and transactions shown are for simulation purposes only."
    },
    {
      question: "What is the 'Empower' section for?",
      answer: "The Empower section provides specialized tools to bridge wealth gaps, offering resources for salary negotiation, interview preparation, and financial literacy specifically tailored for underrepresented groups in finance."
    },
    {
      question: "Can I export my transaction data?",
      answer: "Currently, data export is not available in the demo version. Future updates will include support for CSV and PDF export options for your records."
    }
  ];

  return (
    <div className="relative min-h-full flex flex-col bg-[#F5F7FA] overflow-hidden">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      {/* Noise Texture - Increased visibility (opacity 0.07) for texture feel */}
      <div className="absolute inset-0 z-0 opacity-[0.07] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
      
      {/* Soft Tinted Brand Gradient - Uses indigo tint */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-indigo-900/10 via-indigo-900/5 to-transparent z-0 pointer-events-none"></div>
      
      {/* Decorative Orbs */}
      <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-3xl pointer-events-none animate-pulse-slow"></div>
      <div className="absolute top-[30%] -left-[10%] w-[400px] h-[400px] bg-blue-900/5 rounded-full blur-3xl pointer-events-none" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 flex-1 p-6 lg:p-12 pb-32 max-w-4xl mx-auto w-full">
        
        <Reveal>
          <div className="mb-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-white to-indigo-50 text-indigo-900 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-900/10 border border-white/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-indigo-900/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <HelpCircle size={36} className="relative z-10" />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Frequently Asked Questions</h1>
            <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto leading-relaxed">
              Find answers to common questions about managing your finances and using the platform.
            </p>
          </div>
        </Reveal>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <Reveal key={index} delay={index * 100}>
              <div 
                className={`group bg-white/90 backdrop-blur-md border border-white/60 rounded-[1.5rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${
                  openIndex === index 
                    ? 'shadow-2xl shadow-indigo-900/10 ring-1 ring-indigo-900/10 transform scale-[1.01]' 
                    : 'shadow-sm hover:shadow-lg hover:scale-[1.005] hover:bg-white'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 lg:p-8 text-left flex items-center justify-between focus:outline-none"
                >
                  <span className={`font-bold text-lg lg:text-xl transition-colors duration-300 ${openIndex === index ? 'text-indigo-900' : 'text-slate-800 group-hover:text-indigo-900'}`}>
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === index ? 'bg-indigo-600 text-white rotate-180' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                    <ChevronDown size={18} />
                  </div>
                </button>
                <div 
                  className={`px-6 lg:px-8 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] overflow-hidden ${
                    openIndex === index ? 'max-h-64 pb-8 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-slate-600 leading-relaxed text-base lg:text-lg font-medium">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={600}>
          <div className="mt-16 bg-[#1e293b] rounded-[2rem] p-10 lg:p-12 text-center text-white shadow-2xl shadow-slate-900/30 relative overflow-hidden group">
            {/* Inner grain for the dark card */}
            <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            
            <div className="relative z-10 transition-transform duration-700 group-hover:scale-[1.02]">
                <h3 className="text-2xl font-black mb-3">Still have questions?</h3>
                <p className="text-slate-300 mb-8 text-lg">Our dedicated support team is just a message away.</p>
                <button className="bg-white text-slate-900 font-black py-4 px-10 rounded-2xl hover:bg-slate-50 hover:shadow-lg transition-all inline-flex items-center gap-3 transform active:scale-95">
                    <MessageCircle size={20} /> Contact Support
                </button>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl transition-opacity duration-1000 group-hover:opacity-30"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-white/5 rounded-full blur-3xl transition-opacity duration-1000 group-hover:opacity-30"></div>
          </div>
        </Reveal>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default FAQ;
