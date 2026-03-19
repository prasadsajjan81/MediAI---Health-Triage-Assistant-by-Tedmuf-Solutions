import React, { useState } from 'react';
import { LogIn, LogOut, User, Crown, Shield, Activity, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useGlobal } from '../context/GlobalContext';
import { COUNTRIES } from '../constants/countries';
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
  const { country, setCountry } = useGlobal();
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);

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
            <h1 className="flex flex-row items-baseline space-x-1.5 leading-none group cursor-default">
              <span className="text-2xl sm:text-3xl font-display font-bold text-[#0f172a] tracking-tight group-hover:text-emerald-900 transition-all duration-300">
                Vishwasini
              </span>
              <span className="text-xl sm:text-2xl font-brand font-bold text-[#059669] tracking-tighter uppercase group-hover:text-emerald-500 transition-all duration-300">
                MediAI
              </span>
            </h1>
            <div className="flex items-center mt-1.5 group">
              <div className="h-[1px] w-8 bg-emerald-200 mr-2 group-hover:w-12 transition-all duration-500"></div>
              <p className="text-[7px] sm:text-[9px] text-slate-400 font-brand font-bold uppercase tracking-[0.35em] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                Your Trusted AI Health Companion
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Country Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
              className="flex items-center space-x-2 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm group h-10"
            >
              <div className="flex items-center justify-center h-full">
                <span className="text-base leading-none">{country.flag}</span>
              </div>
              <div className="flex items-center h-full">
                <span className="text-[11px] font-brand font-black text-slate-600 group-hover:text-emerald-700 transition-colors leading-none pt-[3px]">{country.currency}</span>
              </div>
              <div className="flex items-center h-full">
                <ChevronDown size={14} className={`text-slate-300 transition-transform ${isCountryMenuOpen ? 'rotate-180' : ''} group-hover:text-emerald-400`} />
              </div>
            </button>

            {isCountryMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-[60] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Region</p>
                </div>
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c);
                      setIsCountryMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-teal-50 transition-colors cursor-pointer ${country.code === c.code ? 'bg-teal-50 text-teal-700 font-bold' : 'text-slate-700'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{c.currency}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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