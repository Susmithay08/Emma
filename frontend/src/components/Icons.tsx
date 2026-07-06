// Minimal inline SVG icon set (professional line icons, no external deps).
import React from 'react';

type P = { className?: string; size?: number };
const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconDashboard = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);
export const IconRobot = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="4" y="8" width="16" height="11" rx="2" />
    <path d="M12 8V4M9 4h6" />
    <circle cx="9" cy="13" r="1.2" />
    <circle cx="15" cy="13" r="1.2" />
    <path d="M2 12v3M22 12v3" />
  </svg>
);
export const IconDiagnostics = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12h4l2 6 4-14 2 8h6" />
  </svg>
);
export const IconHistory = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const IconSettings = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);
export const IconPlay = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPause = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none" />
  </svg>
);
export const IconStop = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
  </svg>
);
export const IconHome = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>
);
export const IconReset = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v6h-6" />
  </svg>
);
export const IconBattery = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="2" y="7" width="18" height="10" rx="2" />
    <path d="M22 10v4" />
  </svg>
);
export const IconWarning = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3l9 16H3z" />
    <path d="M12 9v4M12 16.5v.5" />
  </svg>
);
export const IconChip = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
    <path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
  </svg>
);
export const IconSpeed = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 14l4-4" />
    <path d="M4 18a8 8 0 1 1 16 0" />
  </svg>
);
export const IconSpray = ({ className, size }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9 5h6v6H9zM12 11v8" />
    <path d="M18 4v0M20 6v0M18 8v0" />
  </svg>
);
