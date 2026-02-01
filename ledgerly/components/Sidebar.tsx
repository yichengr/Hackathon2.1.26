
import React from 'react';
import { LayoutDashboard, CreditCard, LogOut, MessageSquareText, TrendingUp, HelpCircle } from 'lucide-react';
import { Page } from '../types';
import Logo from './Logo';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onSignOut, isOpen, setIsOpen }) => {
  const navItems = [
    { id: Page.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { id: Page.TRANSACTIONS, label: 'Transactions', icon: CreditCard },
    { id: Page.ADVISOR, label: 'Ledgerly Assistant', icon: MessageSquareText },
  ];

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0f172a] text-white transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col shadow-xl`}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-center lg:justify-start">
          <button 
            onClick={() => {
              onNavigate(Page.DASHBOARD);
              setIsOpen(false);
            }}
            className="hover:opacity-90 transition-opacity focus:outline-none"
          >
            <Logo lightText={true} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-bold tracking-wide">{item.label}</span>
              </button>
            );
          })}
          
          <div className="pt-4 mt-4 border-t border-slate-800">
             <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Growth Tools</p>
             <button
                onClick={() => {
                  onNavigate(Page.EMPOWER);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  currentPage === Page.EMPOWER 
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg' 
                    : 'text-violet-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <TrendingUp size={20} />
                <span className="text-sm font-bold tracking-wide">Growth Tools</span>
              </button>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800">
             <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Support</p>
             <button
                onClick={() => {
                  onNavigate(Page.FAQ);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  currentPage === Page.FAQ 
                    ? 'bg-blue-600 text-white font-bold shadow-lg' 
                    : 'text-blue-200 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <HelpCircle size={20} />
                <span className="text-sm font-bold tracking-wide">FAQ</span>
              </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold tracking-wide">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
