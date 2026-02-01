import React, { useState } from 'react';
import { User, Mail, Calendar, Bell, Lock, ChevronRight, UserCircle, X, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileProps {
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleNotificationToggle = () => {
    setToastMessage('Preferences updated successfully.');
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  const handlePasswordSave = () => {
    // Simulate API call
    setShowPasswordModal(false);
    setToastMessage('Password updated successfully.');
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto animate-fade-in pb-24 relative">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your personal information and preferences.</p>
      </div>

      {showNotificationToast && (
        <div className="fixed top-24 right-10 bg-[#003A6F] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-in z-50">
          <CheckCircle2 size={20} className="text-green-400" />
          <span className="text-sm font-bold">{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center">
            <div className={`w-24 h-24 mx-auto rounded-full ${user.avatarColor} flex items-center justify-center text-white mb-4 border-4 border-white shadow-md`}>
              <UserCircle size={64} />
            </div>
            <h2 className="text-xl font-black text-slate-900">{user.name}</h2>
            
            <div className="mt-8 pt-8 border-t border-slate-100 text-left space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Mail size={16} className="text-slate-400" />
                <span className="text-xs font-bold">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span className="text-xs font-bold">Joined {user.memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Security & Privacy</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {/* Password Management */}
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group text-left outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#003A6F] group-hover:text-white transition-all">
                    <Lock size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Password Management</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Update security credentials</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Login Notifications */}
              <button 
                onClick={handleNotificationToggle}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-all group text-left outline-none"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-[#003A6F] group-hover:text-white transition-all">
                    <Bell size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Login Notifications</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Push & Email alerts enabled</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 bg-blue-50 text-[#003A6F] rounded-full flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Account Verified</p>
              <p className="text-xs text-slate-500 font-medium">Your profile has been active since {user.memberSince}.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-900">Update Password</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Keep your account secure with a strong password.</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#003A6F] transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-[#003A6F] transition-all" />
              </div>
              <button 
                onClick={handlePasswordSave}
                className="w-full bg-[#003A6F] text-white font-black py-4 rounded-2xl mt-4 hover:bg-[#00284d] transition-all shadow-lg active:scale-95"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;