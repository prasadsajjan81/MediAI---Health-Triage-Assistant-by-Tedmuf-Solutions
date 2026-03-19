import React, { useState } from 'react';
import { LogIn, LogOut, User, Crown, Shield, Activity } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Logo from './Logo';
import AdminDashboard from './AdminDashboard';
import { SubscriptionPlan } from '../types';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenSubscription }) => {
  const { user, profile, isAdmin } = useAuth();
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const getPlanLabel = () => {
    if (!profile) return null;
    if (profile.role === 'admin') return 'ADMIN';
    if (profile.role === 'student') return 'STUDENT';
    if (profile.role === 'doctor') return 'DOCTOR';
    if (profile.role === 'hospital') return 'HOSPITAL';
    
    if (profile.subscriptionStatus !== 'active') return null;
    
    switch (profile.subscriptionPlan) {
      case SubscriptionPlan.Student: return 'STUDENT';
      case SubscriptionPlan.Doctor: return 'DOCTOR';
      case SubscriptionPlan.Hospital: return 'HOSPITAL';
      default: return 'PRO';
    }
  };

  const getUsageDisplay = () => {
    if (!profile || isAdmin) return null;
    if (profile.subscriptionStatus === 'free') {
      return `${profile.freeTestsRemaining || 0} left`;
    }
    const limit = profile.role === 'student' ? 50 : profile.role === 'doctor' ? 200 : null;
    if (limit === null) return "Unlimited";
    return `${profile.reportCount || 0}/${limit}`;
  };

  const usageDisplay = getUsageDisplay();
  const planLabel = getPlanLabel();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg shadow-teal-600/20">
            <Logo size={24} />
          </div>
          <div>
            <h1 className="flex flex-col sm:flex-row sm:items-baseline sm:space-x-2 leading-none group">
              <span className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors duration-500">Vishwasini</span>
              <span className="text-xl sm:text-2xl font-outfit font-black bg-gradient-to-br from-teal-600 via-emerald-500 to-teal-700 bg-clip-text text-transparent tracking-tighter uppercase drop-shadow-sm">MediAI</span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-outfit font-bold uppercase tracking-[0.3em] mt-1.5 flex items-center">
              <span className="w-8 h-[1px] bg-gradient-to-r from-teal-200 to-transparent mr-2 hidden sm:block"></span>
              Your Trusted AI Health Companion
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              {usageDisplay && (
                <div className="hidden sm:flex items-center px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">
                  <Activity size={12} className="mr-1 text-teal-500" />
                  {usageDisplay}
                </div>
              )}
              
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminOpen(true)}
                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all cursor-pointer"
                  title="Admin Dashboard"
                >
                  <Shield size={20} />
                </button>
              )}

              {planLabel && (
                <div className={`hidden md:flex items-center px-3 py-1 rounded-full border text-xs font-bold ${
                  profile?.role === 'admin' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : planLabel === 'STUDENT'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : planLabel === 'DOCTOR' || planLabel === 'HOSPITAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  <Crown size={14} className="mr-1" />
                  {planLabel}
                </div>
              )}

              {!planLabel && !isAdmin && (
                <button 
                  onClick={onOpenSubscription}
                  className="hidden md:flex items-center bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  Upgrade
                </button>
              )}
              
              <div className="flex items-center space-x-2 bg-slate-50 p-1 pr-3 rounded-full border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700">
                  <User size={18} />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </p>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-600/20 cursor-pointer"
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {isAdminOpen && <AdminDashboard onClose={() => setIsAdminOpen(false)} />}
    </header>
  );
};

export default Header;