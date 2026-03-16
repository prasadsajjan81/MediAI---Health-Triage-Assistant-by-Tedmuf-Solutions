import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 24, className = "" }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Elegant Shield Shape */}
      <path 
        d="M50 8L18 22V45C18 66 32 85 50 92C68 85 82 66 82 45V22L50 8Z" 
        fill="url(#logo-gradient)" 
        fillOpacity="0.15"
      />
      <path 
        d="M50 8L18 22V45C18 66 32 85 50 92C68 85 82 66 82 45V22L50 8Z" 
        stroke="currentColor" 
        strokeWidth="3.5" 
        strokeLinejoin="round"
      />
      
      {/* Refined Pulse / "V" Shape */}
      <path 
        d="M30 52H38L44 38L52 62L58 48L62 52H70" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Sophisticated Sparkle */}
      <path 
        d="M72 32L74 26L76 32L82 34L76 36L74 42L72 36L66 34L72 32Z" 
        fill="currentColor"
      >
        <animate 
          attributeName="opacity" 
          values="1;0.3;1" 
          dur="3s" 
          repeatCount="indefinite" 
        />
      </path>

      <defs>
        <linearGradient id="logo-gradient" x1="18" y1="8" x2="82" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default Logo;
