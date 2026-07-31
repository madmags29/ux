import React from 'react';

export default function Logo({ size = 'medium', animated = true }) {
  const iconSize = size === 'large' ? 42 : size === 'small' ? 26 : 34;
  const fontSize = size === 'large' ? '1.5rem' : size === 'small' ? '1rem' : '1.25rem';

  return (
    <div className={`brand-logo brand-logo--${size} ${animated ? 'brand-logo--animated' : ''}`}>
      <svg
        className="brand-logo__svg"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          <linearGradient id="logoGradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </linearGradient>

          <filter id="logoGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Sci-Fi Shield Frame */}
        <rect
          x="3"
          y="3"
          width="34"
          height="34"
          rx="10"
          fill="url(#logoGradGlow)"
          fillOpacity="0.12"
          stroke="url(#logoGradPrimary)"
          strokeWidth="1.5"
          className="logo-frame"
        />

        {/* Corner Circuit Dots */}
        <circle cx="7" cy="7" r="1.5" fill="#00f0ff" className="logo-dot" />
        <circle cx="33" cy="7" r="1.5" fill="#8b5cf6" className="logo-dot" />
        <circle cx="33" cy="33" r="1.5" fill="#ec4899" className="logo-dot" />
        <circle cx="7" cy="33" r="1.5" fill="#00f0ff" className="logo-dot" />

        {/* Animated Inner Star & Check Emblem */}
        <g filter="url(#logoGlowFilter)" className="logo-emblem">
          <path
            d="M20 9L23.2 15.5L30 16.5L25 21.4L26.2 28.2L20 25L13.8 28.2L15 21.4L10 16.5L16.8 15.5L20 9Z"
            fill="url(#logoGradPrimary)"
          />
          <path
            d="M16 20L19 23L24 17"
            stroke="#0a0a1a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="logo-checkmark"
          />
        </g>

        {/* Scanning Laser Beam */}
        <line
          x1="2"
          y1="0"
          x2="38"
          y2="0"
          stroke="#00f0ff"
          strokeWidth="1.5"
          className="logo-scan-line"
          opacity="0.8"
        />
      </svg>

      <span className="brand-logo__text" style={{ fontSize }}>
        <span className="brand-logo__part-1">Rate</span>
        <span className="brand-logo__part-2">My</span>
        <span className="brand-logo__part-3">UX</span>
      </span>
    </div>
  );
}
