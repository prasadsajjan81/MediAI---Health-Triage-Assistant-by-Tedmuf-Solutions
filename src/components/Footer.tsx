import React from 'react';
import { Mail, Phone, User } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Vishwasini - MediAI</h3>
            <p className="text-sm leading-relaxed">
              Empowering individuals with AI-driven health triage and holistic wellness insights. 
              Bridging modern technology with traditional wisdom.
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <User size={16} className="mr-3 text-teal-400 mt-0.5" />
                <div className="flex flex-col">
                  <span>Founder: Basavprasad Sajjanshetty</span>
                  <span>Co-Founder: Dr. Priya Sajjanshetty</span>
                </div>
              </div>
              <div className="flex items-center">
                <Phone size={16} className="mr-3 text-teal-400" />
                <a href="tel:7506549564" className="hover:text-white transition-colors">7506549564</a>
              </div>
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-teal-400" />
                <a href="mailto:prasadsajjan81@gmail.com" className="hover:text-white transition-colors">prasadsajjan81@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 text-center text-xs">
          <p>© {new Date().getFullYear()} Vishwasini - MediAI. All rights reserved.</p>
          <p className="mt-2">
            Site developed and maintained by - <a href="https://www.tedmuf.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 transition-colors">www.tedmuf.com</a>
          </p>
          <p className="mt-2 text-slate-400">
            Special thanks to JSV Sajjan and team
          </p>
          <p className="mt-4 text-slate-500 italic">
            Disclaimer: This application is for informational purposes only and does not provide medical diagnosis or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
