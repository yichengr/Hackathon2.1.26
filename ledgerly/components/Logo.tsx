
import React from 'react';

interface LogoProps {
  className?: string;
  lightText?: boolean;
  animate?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', lightText = false, animate = false }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Abstract Symbol: Stacked Ledger/Layers */}
      <svg 
        width="32" 
        height="32" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className={`shrink-0 ${animate ? 'animate-fade-in-up' : ''}`}
      >
         {/* Base Layer: Charcoal/Navy */}
         <rect x="6" y="10" width="14" height="4" rx="2" fill="#1e293b" />
         
         {/* Middle Layer: Indigo - extended slightly */}
         <rect x="6" y="17" width="19" height="4" rx="2" fill="#6366f1" />
         
         {/* Top Layer: Violet Accent - longest */}
         <rect x="6" y="24" width="24" height="4" rx="2" fill="#8b5cf6" />
      </svg>
      
      {/* Wordmark */}
      <span className={`font-sans font-bold text-xl tracking-tight lowercase ${lightText ? 'text-white' : 'text-slate-900'} ${animate ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '100ms' }}>
        ledgerly
      </span>
    </div>
  );
};

export default Logo;
