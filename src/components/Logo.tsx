import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  id?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 24, className = "", id }) => {
  return (
    <svg 
      id={id}
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Geometric Element - The "Network" */}
      <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
      
      {/* The "V" - Interlocking Geometric Planes */}
      {/* Left Plane - Trust */}
      <path 
        d="M25 30L50 85L50 55L25 30Z" 
        fill="currentColor" 
        fillOpacity="0.8"
      >
        <animate 
          attributeName="fill-opacity" 
          values="0.8;0.6;0.8" 
          dur="4s" 
          repeatCount="indefinite" 
        />
      </path>
      
      {/* Right Plane - Intelligence */}
      <path 
        d="M75 30L50 85L50 55L75 30Z" 
        fill="currentColor" 
        fillOpacity="0.4"
      />
      
      {/* The "Check" - Verification / Trust (Vishwas) */}
      <path 
        d="M40 55L50 65L75 30" 
        stroke="white" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="drop-shadow-sm"
      />
      
      {/* Central Node - The AI Core */}
      <circle cx="50" cy="55" r="4" fill="white">
        <animate 
          attributeName="r" 
          values="3;5;3" 
          dur="2s" 
          repeatCount="indefinite" 
        />
      </circle>

      <defs>
        <filter id="logo-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
};

export default Logo;
