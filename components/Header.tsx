import React from 'react';
import { HeartPulse } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-teal-600 p-2 rounded-lg text-white">
            <HeartPulse size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MediAI</h1>
            <p className="text-xs text-slate-500 font-medium">Multimodal Triage Assistant</p>
          </div>
        </div>
        <div className="hidden sm:block">
           <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded border border-teal-200">
             Powered by Gemini 3 Pro
           </span>
        </div>
      </div>
    </header>
  );
};

export default Header;