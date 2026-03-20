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
      case SubscriptionPlan.Patient: return 'PATIENT';
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
    const limit = profile.subscriptionPlan === SubscriptionPlan.Patient ? 20 : 
                  profile.role === 'student' ? 50 : 
                  profile.role === 'doctor' ? 200 : null;
    if (limit === null) return "Unlimited";
    return `${profile.reportCount || 0}/${limit}`;
  };

  const usageDisplay = getUsageDisplay();
  const planLabel = getPlanLabel();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="bg-teal-600 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-white shadow-lg shadow-teal-600/20 flex-shrink-0">
            <Logo size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="flex flex-row items-baseline space-x-1 sm:space-x-1.5 leading-none group cursor-default">
              <span className="text-lg sm:text-3xl font-display font-bold text-[#0f172a] tracking-tight group-hover:text-emerald-900 transition-all duration-300 truncate">
                Vishwasini
              </span>
              <span className="text-base sm:text-2xl font-brand font-bold text-[#059669] tracking-tighter uppercase group-hover:text-emerald-500 transition-all duration-300 flex-shrink-0">
                MediAI
              </span>
            </h1>
            <div className="flex items-center mt-0.5 group">
              <div className="hidden xs:block h-[1px] w-4 sm:w-8 bg-emerald-200 mr-1 sm:mr-2 group-hover:w-6 sm:group-hover:w-12 transition-all duration-500"></div>
              <p className="text-[5px] sm:text-[9px] text-slate-400 font-brand font-bold uppercase tracking-[0.1em] sm:tracking-[0.35em] opacity-80 group-hover:opacity-100 transition-opacity duration-300 truncate">
                Your Trusted AI Health Companion
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-4 flex-shrink-0">
          {/* Country Switcher */}
          <div className="relative">
            <button 
              onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
              className="flex items-center space-x-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm group h-8 sm:h-10"
            >
              <span className="text-xs sm:text-base leading-none">{country.flag}</span>
              <span className="hidden xs:inline text-[9px] sm:text-[11px] font-brand font-black text-slate-600 group-hover:text-emerald-700 transition-colors leading-none pt-[1px] sm:pt-[3px]">{country.currency}</span>
              <ChevronDown size={10} className={`sm:w-[14px] sm:h-[14px] text-slate-300 transition-transform ${isCountryMenuOpen ? 'rotate-180' : ''} group-hover:text-emerald-400`} />
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
            <div className="flex items-center space-x-1.5 sm:space-x-3">
              {usageDisplay && (
                <div className="hidden lg:flex items-center px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-200">
                  <Activity size={12} className="mr-1 text-teal-500" />
                  {usageDisplay}
                </div>
              )}
              
              {isAdmin && (
                <button 
                  onClick={() => setIsAdminOpen(true)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all cursor-pointer"
                  title="Admin Dashboard"
                >
                  <Shield size={16} className="sm:w-[20px] sm:h-[20px]" />
                </button>
              )}
              
              <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-50 p-0.5 sm:p-1 pr-1.5 sm:pr-3 rounded-full border border-slate-200">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 flex-shrink-0">
                  <User size={14} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold text-slate-800 truncate max-w-[80px]">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </p>
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut size={14} className="sm:w-[16px] sm:h-[16px]" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-teal-600/20 cursor-pointer flex-shrink-0"
            >
              <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
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