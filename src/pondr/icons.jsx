// icons.jsx — All inline SVG icons used by the app.
// Ported verbatim from the design handoff (pondr-icons.jsx).

export const Icon = {
  Home: ({ size = 22, filled = false }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" fill={filled ? "currentColor" : "none"} />
    </svg>
  ),
  Profile: ({ size = 22, filled = false }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" fill={filled ? "currentColor" : "none"} />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" fill={filled ? "currentColor" : "none"} />
    </svg>
  ),
  Compass: ({ size = 22, filled = false }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" fill={filled ? "currentColor" : "none"} />
      <path d="M15.8 8.2 14 14l-5.8 1.8L10 10z" fill={filled ? "var(--p-card)" : "none"} stroke={filled ? "var(--p-card)" : "currentColor"} />
    </svg>
  ),
  Gift: ({ size = 22, filled = false }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="1.5" fill={filled ? "currentColor" : "none"} />
      <path d="M3 7h18v3H3z" fill={filled ? "currentColor" : "none"} />
      <path d="M12 7v13" stroke={filled ? "var(--p-card)" : "currentColor"} />
      <path d="M12 7C12 7 11 3.5 8.5 3.5 7 3.5 6.5 5 7.5 6 8.5 7 12 7 12 7zM12 7C12 7 13 3.5 15.5 3.5 17 3.5 17.5 5 16.5 6 15.5 7 12 7 12 7z" />
    </svg>
  ),
  Trophy: ({ size = 22, filled = false }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" fill={filled ? "currentColor" : "none"} />
      <path d="M17 5h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3" />
      <path d="M7 5H5a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3" />
      <path d="M9 18h6M12 13v5M9 20h6" />
    </svg>
  ),
  Plus: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v9M7.5 12h9" />
    </svg>
  ),
  PlusBare: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Sparkle: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 2 L13.6 9.3 L21 11 L13.6 12.7 L12 20 L10.4 12.7 L3 11 L10.4 9.3 Z" />
    </svg>
  ),
  Sparkle4: ({ size = 14 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 2 L13.6 9.3 L21 11 L13.6 12.7 L12 20 L10.4 12.7 L3 11 L10.4 9.3 Z" />
    </svg>
  ),
  ArrowLeft: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  ),
  ArrowRight: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  ),
  Filter: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16l-6 8v6l-4-2v-4z" />
    </svg>
  ),
  Pencil: ({ size = 24 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5l4 4-12 12H4.5v-4z" />
      <path d="M14 6l4 4" />
    </svg>
  ),
  Flame: ({ size = 28 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 2c0 4-5 5-5 10a5 5 0 0 0 10 0c0-3-2-4-2-7 0 0-3 2-3 5 0-3 0-6 0-8z" />
    </svg>
  ),
  TrophyBig: ({ size = 30 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M17 5h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3" />
      <path d="M7 5H5a2 2 0 0 0-2 2v1a3 3 0 0 0 3 3" />
      <path d="M9 18h6M12 13v5M9 20h6" />
    </svg>
  ),
  Sun: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </svg>
  ),
  Heart: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 21s-7-4.5-9.3-9C1.2 9 3 5 6.5 5c2 0 3.4 1.2 4.5 2.7C12.1 6.2 13.5 5 15.5 5 19 5 20.8 9 19.3 12 17 16.5 12 21 12 21z" />
    </svg>
  ),
  Star: ({ size = 20, filled = true }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M12 3l2.6 5.6 6.1.6-4.6 4.2 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.3 9.2l6.1-.6z" />
    </svg>
  ),
  Leaf: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M12 3c-2 4-6 4-6 9a4.5 4.5 0 0 0 4.5 4.5C13 16.5 16 14 16 9c0-3-2-4-4-6z" />
      <path d="M9 21s1-3 3-5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  ),
  Moon: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <path d="M21 13a8 8 0 1 1-10-10 7 7 0 0 0 10 10z" />
    </svg>
  ),
  Coffee: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
      <path d="M16 11h2a2 2 0 0 1 0 4h-2" />
      <path d="M7 4c0 1.5 1 1.5 1 3M11 4c0 1.5 1 1.5 1 3" />
    </svg>
  ),
  Music: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V6l11-2v11" />
      <circle cx="7" cy="18" r="2" fill="currentColor" />
      <circle cx="18" cy="15" r="2" fill="currentColor" />
    </svg>
  ),
  Book: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h8a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H4z" />
      <path d="M20 4h-8a4 4 0 0 0-4 4v12a4 4 0 0 1 4-4h8z" />
    </svg>
  ),
  Menu: ({ size = 22 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  Lock: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  EyeOff: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A9 9 0 0 1 12 5c5 0 9 5 9 7a12 12 0 0 1-2.2 2.8M6.1 6.1C3.8 7.5 2 10.2 2 12c0 2 4 7 9 7a9 9 0 0 0 3.9-.9" />
      <path d="M9.5 9.6a3 3 0 0 0 4.2 4.2" />
    </svg>
  ),
  Dots: ({ size = 20 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
      <circle cx="12" cy="6" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18" r="1.6" />
    </svg>
  ),
  X: ({ size = 18 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  Reply: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 7L4 12l5 5" />
      <path d="M4 12h9a6 6 0 0 1 6 6v1" />
    </svg>
  ),
  Save: ({ size = 16 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4h10l3 3v13l-6-3-7 3z" />
    </svg>
  ),
  Hand: ({ size = 200 }) => (
    // simple stylized hand reaching down — used in the picking loader
    <svg viewBox="0 0 200 200" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M70 30 V 105" />
      <path d="M85 24 V 105" />
      <path d="M100 28 V 110" />
      <path d="M115 36 V 108" />
      <path d="M128 56 C 128 86 126 100 122 110" />
      <path d="M62 100 C 56 110 56 124 64 140 C 72 156 92 170 110 168 C 132 165 146 150 138 124" />
      <path d="M138 124 C 138 116 132 110 124 112" />
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
};
