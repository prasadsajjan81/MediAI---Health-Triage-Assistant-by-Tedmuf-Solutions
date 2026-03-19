import React from 'react';
import { Mail, Phone, User } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-teal-600 p-1.5 rounded-lg text-white">
                <Logo size={20} />
              </div>
              <h3 className="text-white font-display font-bold text-2xl tracking-tight">Vishwasini <span className="text-emerald-400 font-brand font-bold uppercase tracking-tighter">MediAI</span></h3>
            </div>
            <p className="text-sm leading-relaxed">
              Empowering individuals with AI-driven health triage and holistic wellness insights. 
              Your trusted companion for bridging modern technology with traditional wisdom.
            </p>
          </div>
          <div>
            <h3 className="text-white font-outfit font-bold text-sm uppercase tracking-widest mb-6">Contact Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start">
                <User size={16} className="mr-3 text-teal-400 mt-0.5" />
                <div className="flex flex-col space-y-1">
                  <span className="text-slate-100 font-medium">Basavprasad Sajjanshetty <span className="text-[10px] text-slate-500 uppercase ml-2">Founder</span></span>
                  <span className="text-slate-100 font-medium">Dr. Priya Sajjanshetty <span className="text-[10px] text-slate-500 uppercase ml-2">Co-Founder</span></span>
                </div>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-3 text-teal-400" />
                <a href="tel:7506549564" className="hover:text-white transition-colors cursor-pointer">7506549564</a>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-teal-400" />
                <a href="mailto:prasadsajjan81@gmail.com" className="hover:text-white transition-colors cursor-pointer">prasadsajjan81@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center text-xs">
          <p>© {new Date().getFullYear()} Vishwasini - MediAI. All rights reserved.</p>
          <p className="mt-2">
            Site developed and maintained by - <a href="https://www.tedmuf.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors cursor-pointer">www.tedmuf.com</a>
          </p>
          <p className="mt-2 text-slate-400">
            Special thanks to JSV Sajjan and team
          </p>
          <p className="mt-4 text-slate-500">
            Disclaimer: This application is for informational purposes only and does not provide medical diagnosis or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
