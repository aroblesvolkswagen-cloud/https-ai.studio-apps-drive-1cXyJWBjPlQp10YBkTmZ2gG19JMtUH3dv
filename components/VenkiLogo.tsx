import React from 'react';

const VenkiLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Venki Logo"
    >
      <defs>
        <linearGradient id="venkiGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'var(--venki-cyan)', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: 'var(--venki-magenta)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--venki-yellow)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize="30"
        fontWeight="bold"
        fill="url(#venkiGradient)"
      >
        VENKI
      </text>
    </svg>
  );
};

export default VenkiLogo;