import { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './GlowingBowl.module.css';

const GlowingBowl = ({ noteCount = 0, size = 'lg', clickable = false, onClick }) => {
  const dimensions = {
    lg: { width: 220, height: 260 },
    md: { width: 140, height: 165 },
    sm: { width: 48, height: 56 },
  };

  const { width, height } = dimensions[size] || dimensions.lg;
  const count = Math.min(noteCount, 12);

  // Glow intensity based on note count
  const glowIntensity = Math.min(0.3 + (count / 12) * 0.5, 0.8);

  // Generate floating note particles inside the jar
  const particles = useMemo(() =>
    [...Array(size === 'sm' ? 0 : Math.min(count, 8))].map((_, i) => ({
      x: 20 + Math.random() * 60,
      y: 35 + Math.random() * 45,
      rotation: (Math.random() - 0.5) * 30,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3,
      size: size === 'lg' ? 12 + Math.random() * 8 : 8 + Math.random() * 5,
    })),
  [count, size]);

  // Firefly particles around the jar
  const fireflies = useMemo(() =>
    size !== 'lg' ? [] : [...Array(6)].map((_, i) => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 4 + Math.random() * 4,
    })),
  [size]);

  const handleClick = () => {
    if (clickable && onClick) onClick();
  };

  const handleKeyDown = (e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) onClick?.();
  };

  return (
    <div className={styles.wrapper} style={{ width: size === 'lg' ? width + 60 : width + 20 }}>
      {/* Firefly particles (large only) */}
      {fireflies.map((f, i) => (
        <div
          key={`firefly-${i}`}
          className={styles.firefly}
          style={{
            left: `${f.x}%`,
            top: `${f.y}%`,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        />
      ))}

      <motion.div
        className={`${styles.bowl} ${clickable ? styles.clickable : ''}`}
        style={{ width, height }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        aria-label={clickable ? `Pick a random note from ${noteCount} stories` : undefined}
        whileHover={clickable ? { scale: 1.03 } : undefined}
        whileTap={clickable ? { scale: 0.95 } : undefined}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Glow behind the jar */}
        <div
          className={styles.glow}
          style={{ opacity: glowIntensity }}
        />

        {/* Jar SVG */}
        <svg
          width={width}
          height={height}
          viewBox="0 0 220 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.jar}
        >
          {/* Jar body */}
          <path
            d="M55 60 Q55 60 45 80 Q30 110 30 150 Q30 210 60 230 Q80 245 110 245 Q140 245 160 230 Q190 210 190 150 Q190 110 175 80 Q165 60 165 60"
            fill="rgba(255, 255, 255, 0.03)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
          {/* Jar neck */}
          <rect
            x="65" y="38" width="90" height="24" rx="4"
            fill="rgba(255, 255, 255, 0.02)"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
          {/* Jar rim */}
          <rect
            x="58" y="32" width="104" height="10" rx="5"
            fill="rgba(255, 255, 255, 0.05)"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="1"
          />
          {/* Glass reflections */}
          <path
            d="M52 90 Q46 120 48 160"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <ellipse
            cx="60" cy="85"
            rx="4" ry="12"
            fill="rgba(255, 255, 255, 0.04)"
          />
        </svg>

        {/* Floating note particles inside */}
        <div className={styles.particleContainer}>
          {particles.map((p, i) => (
            <div
              key={i}
              className={styles.noteParticle}
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size * 0.65}px`,
                transform: `rotate(${p.rotation}deg)`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Inner amber glow */}
        <div className={styles.innerGlow} style={{ opacity: glowIntensity * 0.6 }} />
      </motion.div>

      {/* Pick a note prompt */}
      {clickable && size !== 'sm' && (
        <p className={styles.pickPrompt}>pick a note</p>
      )}

      {/* Note count */}
      {noteCount > 0 && size !== 'sm' && (
        <p className={styles.noteCount}>
          {noteCount} {noteCount === 1 ? 'story' : 'stories'}
        </p>
      )}
    </div>
  );
};

export default GlowingBowl;
