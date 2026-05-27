import { useMemo } from 'react';
import { motion } from 'framer-motion';

const noteTileColors = ['#C4B0E8', '#D4C8F0', '#B8A0E8', '#CAB8EC', '#D8CFF2'];

const Sparkle = ({ x, y, size, delay, dur }) => (
  <svg
    width={size} height={size}
    viewBox="0 0 20 20"
    style={{
      position: 'absolute',
      left: `${x}%`,
      top: `${y}%`,
      animation: `sparkle-pulse ${dur}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none',
    }}
  >
    <path
      d="M10 0 L11.5 8.5 L20 10 L11.5 11.5 L10 20 L8.5 11.5 L0 10 L8.5 8.5 Z"
      fill="#2E1A6E"
      opacity="0.45"
    />
  </svg>
);

const BotanicalLeft = ({ scale = 1 }) => (
  <svg width={52 * scale} height={90 * scale} viewBox="0 0 52 90" fill="none" style={{ position: 'absolute', left: -10 * scale, bottom: 20 * scale, pointerEvents: 'none' }}>
    <path d="M26 85 Q20 60 14 40 Q8 20 16 8" stroke="#7B5EA7" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M14 40 Q4 32 2 22" stroke="#7B5EA7" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M2 22 Q-2 14 4 10" stroke="#B8A0E8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M20 55 Q10 50 6 38" stroke="#7B5EA7" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M6 38 Q2 28 8 22" stroke="#B8A0E8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <ellipse cx="16" cy="8" rx="5" ry="3" fill="#B8A0E8" opacity="0.6" transform="rotate(-30 16 8)"/>
    <ellipse cx="4" cy="10" rx="4" ry="2.5" fill="#B8A0E8" opacity="0.5" transform="rotate(-60 4 10)"/>
    <ellipse cx="8" cy="22" rx="4" ry="2.5" fill="#C4B0E8" opacity="0.5" transform="rotate(-45 8 22)"/>
  </svg>
);

const BotanicalRight = ({ scale = 1 }) => (
  <svg width={52 * scale} height={90 * scale} viewBox="0 0 52 90" fill="none" style={{ position: 'absolute', right: -10 * scale, bottom: 20 * scale, pointerEvents: 'none' }}>
    <path d="M26 85 Q32 60 38 40 Q44 20 36 8" stroke="#7B5EA7" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M38 40 Q48 32 50 22" stroke="#7B5EA7" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M50 22 Q54 14 48 10" stroke="#B8A0E8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <path d="M32 55 Q42 50 46 38" stroke="#7B5EA7" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
    <path d="M46 38 Q50 28 44 22" stroke="#B8A0E8" strokeWidth="1" fill="none" strokeLinecap="round"/>
    <ellipse cx="36" cy="8" rx="5" ry="3" fill="#B8A0E8" opacity="0.6" transform="rotate(30 36 8)"/>
    <ellipse cx="48" cy="10" rx="4" ry="2.5" fill="#B8A0E8" opacity="0.5" transform="rotate(60 48 10)"/>
    <ellipse cx="44" cy="22" rx="4" ry="2.5" fill="#C4B0E8" opacity="0.5" transform="rotate(45 44 22)"/>
  </svg>
);

export default function Bowl({ noteCount = 0, size = 'lg', clickable = false, onClick }) {
  const dim = { lg: [220, 260], md: [140, 165], sm: [48, 56] }[size] || [220, 260];
  const [w, h] = dim;
  const scale = w / 220;
  const count = Math.min(noteCount, 12);

  const particles = useMemo(() =>
    size === 'sm' ? [] : [...Array(Math.max(count, 6))].map((_, i) => ({
      x: 15 + Math.random() * 70,
      y: 30 + Math.random() * 50,
      rot: (Math.random() - 0.5) * 28,
      delay: Math.random() * 4,
      dur: 3 + Math.random() * 3,
      sz: size === 'lg' ? 14 + Math.random() * 10 : 9 + Math.random() * 6,
      color: noteTileColors[i % noteTileColors.length],
    })),
  [count, size]);

  const sparkles = useMemo(() =>
    size !== 'lg' ? [] : [
      { x: 8,  y: 15, size: 8,  delay: 0,   dur: 3.2 },
      { x: 82, y: 10, size: 12, delay: 0.8, dur: 2.8 },
      { x: 90, y: 55, size: 7,  delay: 1.5, dur: 3.5 },
      { x: 4,  y: 60, size: 10, delay: 0.4, dur: 4.0 },
      { x: 60, y: 5,  size: 6,  delay: 2.0, dur: 2.6 },
    ],
  [size]);

  const showBotanicals = size === 'lg';

  return (
    <div className="relative flex flex-col items-center mx-auto" style={{ width: w + (showBotanicals ? 80 : 20) }}>

      {/* Sparkles */}
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}

      {/* Botanicals */}
      {showBotanicals && (
        <>
          <BotanicalLeft scale={scale} />
          <BotanicalRight scale={scale} />
        </>
      )}

      <motion.div
        className={clickable ? 'cursor-pointer' : ''}
        style={{ width: w, height: h, position: 'relative' }}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `Pick a random note from ${noteCount} stories` : undefined}
        onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick?.() : undefined}
        whileHover={clickable ? { scale: 1.03 } : undefined}
        whileTap={clickable ? { scale: 0.95 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Illustrated jar SVG */}
        <svg width={w} height={h} viewBox="0 0 220 260" fill="none" className="relative z-10">
          {/* Rim */}
          <rect x="62" y="30" width="96" height="12" rx="5"
            fill="rgba(46,26,110,0.04)" stroke="#3D2A8A" strokeWidth="1.4" />
          {/* Neck */}
          <rect x="68" y="40" width="84" height="18" rx="2"
            fill="rgba(46,26,110,0.03)" stroke="#3D2A8A" strokeWidth="1.2" />
          {/* Body */}
          <path d="M58 58 Q48 85 46 130 Q44 175 52 210 Q62 238 110 242 Q158 238 168 210 Q176 175 174 130 Q172 85 162 58 Z"
            fill="rgba(46,26,110,0.03)" stroke="#3D2A8A" strokeWidth="1.4" strokeLinejoin="round" />
          {/* Glass reflection left */}
          <path d="M62 75 Q54 110 54 155" stroke="#3D2A8A" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.3"/>
          {/* Glass reflection right */}
          <path d="M74 65 Q68 85 68 110" stroke="#3D2A8A" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.2"/>
          {/* Bottom curve detail */}
          <path d="M60 205 Q80 235 110 238 Q140 235 160 205"
            stroke="#3D2A8A" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.4" />
        </svg>

        {/* Note tiles inside jar */}
        <div className="absolute top-[30%] left-[20%] w-[60%] h-[52%] z-20 overflow-hidden rounded-b-[40%] pointer-events-none">
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-sm"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.sz}px`,
                height: `${p.sz * 0.72}px`,
                backgroundColor: p.color,
                transform: `rotate(${p.rot}deg)`,
                animation: `drift ${p.dur}s ease-in-out ${p.delay}s infinite`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Labels */}
      {clickable && size !== 'sm' && (
        <p className="mt-4 text-sm font-serif italic text-[#2E1A6E]/40 animate-[fadeIn_1s_ease_0.5s_backwards]">
          pick a note
        </p>
      )}
      {noteCount > 0 && size !== 'sm' && (
        <p className="mt-1.5 text-[0.6875rem] font-mono text-[#2E1A6E]/35">
          {noteCount} {noteCount === 1 ? 'story' : 'stories'}
        </p>
      )}
    </div>
  );
}
