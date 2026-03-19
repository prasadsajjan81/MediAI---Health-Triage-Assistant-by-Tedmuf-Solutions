import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Country, COUNTRIES, DEFAULT_COUNTRY } from '../constants/countries';

interface GlobalContextType {
  country: Country;
  setCountry: (country: Country) => void;
  currency: string;
  currencySymbol: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);

  // Attempt to auto-detect country on first load
  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const detectedCountry = COUNTRIES.find(c => {
        // Simple mapping for demonstration
        if (timeZone.includes('America/New_York') || timeZone.includes('America/Los_Angeles')) return c.code === 'US';
        if (timeZone.includes('Asia/Kolkata')) return c.code === 'IN';
        if (timeZone.includes('Europe/London')) return c.code === 'GB';
        if (timeZone.includes('Europe/Paris')) return c.code === 'FR';
        if (timeZone.includes('Europe/Berlin')) return c.code === 'DE';
        if (timeZone.includes('Asia/Dubai')) return c.code === 'AE';
        if (timeZone.includes('Australia/Sydney')) return c.code === 'AU';
        if (timeZone.includes('Asia/Singapore')) return c.code === 'SG';
        if (timeZone.includes('America/Toronto')) return c.code === 'CA';
        return false;
      });

      if (detectedCountry) {
        setCountry(detectedCountry);
      }
    } catch (e) {
      console.error('Error detecting country:', e);
    }
  }, []);

  return (
    <GlobalContext.Provider value={{ 
      country, 
      setCountry, 
      currency: country.currency, 
      currencySymbol: country.currencySymbol 
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
