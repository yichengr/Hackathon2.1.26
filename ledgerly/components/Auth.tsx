
import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import Logo from './Logo';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
  onRegister: (newUser: any) => void;
  registeredUsers: any[];
}

const Auth: React.FC<AuthProps> = ({ onLogin, onRegister, registeredUsers }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Format Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isLogin) {
      // Login Logic: Check if user exists and password matches
      const existingUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!existingUser) {
        setError('No account found with this email. Please create one first.');
        return;
      }

      if (existingUser.password !== password) {
        setError('Incorrect password. Please try again.');
        return;
      }

      // Successful Login
      onLogin({
        name: existingUser.name,
        email: existingUser.email,
        memberSince: existingUser.memberSince,
        avatarColor: 'bg-indigo-600'
      });
    } else {
      // Register Logic
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }

      const userExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        setError('An account with this email already exists.');
        return;
      }

      const now = new Date();
      const memberSince = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const newUser = {
        name,
        email,
        password,
        memberSince
      };

      onRegister(newUser);
      
      // Auto-login after registration
      onLogin({
        name: newUser.name,
        email: newUser.email,
        memberSince: newUser.memberSince,
        avatarColor: 'bg-indigo-600'
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none"></div>

      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in border border-slate-100 relative z-10">
        <div className="p-8 pb-0 flex flex-col items-center">
          <div className="transform scale-125 mb-6 mt-4">
             <Logo />
          </div>
          <h1 className="text-xl font-medium text-slate-500 tracking-tight">Financial Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">
            {isLogin ? 'Sign in to your ledger' : 'Start your financial journey'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-start gap-3 text-xs font-bold animate-shake shadow-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Jane Doe" 
                  className="w-full pl-12 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                placeholder="name@email.com" 
                className={`w-full pl-12 p-4 bg-slate-50 border-2 ${error && !validateEmail(email) ? 'border-red-200' : 'border-slate-100'} rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-medium`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                placeholder="••••••••" 
                className={`w-full pl-12 p-4 bg-slate-50 border-2 ${error && password.length < 6 ? 'border-red-200' : 'border-slate-100'} rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-900 font-medium`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-[#1e293b] text-white font-bold py-4 rounded-2xl hover:bg-[#0f172a] transition-all shadow-xl flex items-center justify-center gap-2 group active:scale-[0.98]"
          >
            {isLogin ? 'Enter Ledgerly' : 'Create Account'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="px-8 pb-8 text-center border-t border-slate-50 pt-6">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
          >
            {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign In"}
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <ShieldCheck size={14} className="text-emerald-500" />
            End-to-end Encrypted
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
