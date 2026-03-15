import React from 'react';
import { HeartPulse, LogIn, LogOut, User, Crown } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenSubscription: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAuth, onOpenSubscription }) => {
  const { user, profile, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Vishwasini - MediAI</h1>
            <p className="text-xs text-slate-500 font-medium">Multimodal Triage Assistant</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              {profile?.subscriptionStatus === 'active' ? (
                <div className="hidden md:flex items-center bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-xs font-bold">
                  <Crown size={14} className="mr-1" />
                  PRO
                </div>
              ) : (
                <button 
                  onClick={onOpenSubscription}
                  className="hidden md:flex items-center bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-200 text-xs font-bold hover:bg-teal-100 transition-colors"
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
                  {isAdmin && <p className="text-[10px] text-teal-600 font-bold uppercase">Admin</p>}
                </div>
                <button 
                  onClick={() => signOut(auth)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={onOpenAuth}
              className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-teal-600/20"
            >
              <LogIn size={18} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;