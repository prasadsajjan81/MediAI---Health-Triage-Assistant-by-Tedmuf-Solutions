export interface Country {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  languages: string[];
  flag: string;
  emergencyNumber: string;
  units: 'metric' | 'imperial';
}

export const COUNTRIES: Country[] = [
  {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    languages: ['Hindi', 'Kannada', 'Telugu', 'Tamil', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Odia', 'English'],
    flag: '🇮🇳',
    emergencyNumber: '102',
    units: 'metric'
  },
  {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    languages: ['English', 'Spanish'],
    flag: '🇺🇸',
    emergencyNumber: '911',
    units: 'imperial'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    languages: ['English'],
    flag: '🇬🇧',
    emergencyNumber: '999',
    units: 'metric'
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'د.إ',
    languages: ['Arabic', 'English'],
    flag: '🇦🇪',
    emergencyNumber: '998',
    units: 'metric'
  },
  {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    languages: ['English', 'French'],
    flag: '🇨🇦',
    emergencyNumber: '911',
    units: 'metric'
  },
  {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    languages: ['English'],
    flag: '🇦🇺',
    emergencyNumber: '000',
    units: 'metric'
  },
  {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    languages: ['German', 'English'],
    flag: '🇩🇪',
    emergencyNumber: '112',
    units: 'metric'
  },
  {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    languages: ['French', 'English'],
    flag: '🇫🇷',
    emergencyNumber: '112',
    units: 'metric'
  },
  {
    code: 'SG',
    name: 'Singapore',
    currency: 'SGD',
    currencySymbol: 'S$',
    languages: ['English', 'Mandarin', 'Malay', 'Tamil'],
    flag: '🇸🇬',
    emergencyNumber: '995',
    units: 'metric'
  }
];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India as default
