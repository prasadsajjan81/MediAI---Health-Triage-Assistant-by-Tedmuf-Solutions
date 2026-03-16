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
      {/* Shield Shape - Representing Trust (Vishwasini) */}
      <path 
        d="M50 5L15 20V45C15 68.3333 30 88.3333 50 95C70 88.3333 85 68.3333 85 45V20L50 5Z" 
        fill="currentColor" 
        fillOpacity="0.1"
      />
      <path 
        d="M50 5L15 20V45C15 68.3333 30 88.3333 50 95C70 88.3333 85 68.3333 85 45V20L50 5Z" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinejoin="round"
      />
      
      {/* Heart Pulse / "V" Shape */}
      <path 
        d="M25 50H35L42 35L52 65L60 45L65 50H75" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Intelligence Spark */}
      <circle cx="75" cy="35" r="5" fill="currentColor">
        <animate 
          attributeName="opacity" 
          values="1;0.4;1" 
          dur="2s" 
          repeatCount="indefinite" 
        />
      </circle>
    </svg>
  );
};

export default Logo;
