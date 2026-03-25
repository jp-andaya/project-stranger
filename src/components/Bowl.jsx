import { useTheme } from '../context/ThemeContext';
import styles from './Bowl.module.css';

const NOTE_COLORS = ['#e8d5b7', '#d4a574', '#c9a87c', '#b8997a', '#dcc5a0', '#c4b08a'];

const Bowl = ({ noteCount = 0, size = 'lg', clickable = false, onClick }) => {
  const { theme } = useTheme();

  const dimensions = {
    lg: { width: 170, height: 140 },
    md: { width: 100, height: 82 },
    sm: { width: 60, height: 50 },
    icon: { width: 28, height: 23 },
  };

  const { width, height } = dimensions[size] || dimensions.lg;
  const count = Math.min(noteCount, 14);

  // Generate random note positions
  const notes = [...Array(count)].map((_, i) => ({
    color: NOTE_COLORS[i % NOTE_COLORS.length],
    x: 18 + Math.random() * 50,
    y: 30 + (i / count) * 45,
    rotation: (Math.random() - 0.5) * 40,
  }));

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      onClick?.();
    }
  };

  return (
    <div
      className={`${styles.bowl} ${clickable ? styles.clickable : ''}`}
      style={{ width }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Pick a random note from ${noteCount} stories` : undefined}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 170 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Bowl body */}
        <ellipse
          cx="85"
          cy="85"
          rx="75"
          ry="55"
          fill={theme.bowlFill}
          stroke={theme.bowlStroke}
          strokeWidth="1.5"
        />
        {/* Opening */}
        <ellipse
          cx="85"
          cy="30"
          rx="50"
          ry="14"
          fill={theme.bg}
          stroke={theme.bowlStroke}
          strokeWidth="1.5"
        />
        {/* Inner rim */}
        <ellipse
          cx="85"
          cy="32"
          rx="42"
          ry="10"
          fill="none"
          stroke={theme.bowlStroke}
          strokeWidth="0.75"
          opacity="0.5"
        />
        {/* Glass reflection */}
        <path
          d="M 25 60 Q 18 75 22 100"
          stroke={theme.bowlReflect}
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
        <ellipse cx="35" cy="55" rx="5" ry="10" fill={theme.bowlReflect} opacity="0.5" />
      </svg>

      {/* Notes inside bowl */}
      {size !== 'icon' && (
        <div className={styles.notesContainer}>
          {notes.map((note, i) => (
            <div
              key={i}
              className={styles.note}
              style={{
                left: `${note.x}%`,
                top: `${note.y}%`,
                backgroundColor: note.color,
                transform: `rotate(${note.rotation}deg)`,
                width: size === 'lg' ? '22%' : '24%',
                height: size === 'lg' ? '18%' : '20%',
              }}
            />
          ))}
        </div>
      )}

      {/* Pick a note prompt */}
      {clickable && (
        <div className={styles.pickPrompt} style={{ color: theme.textSecondary }}>
          pick a note
        </div>
      )}

      {/* Note count */}
      {noteCount > 0 && size !== 'icon' && (
        <div className={styles.noteCount} style={{ color: theme.textMuted }}>
          {noteCount} {noteCount === 1 ? 'story' : 'stories'}
        </div>
      )}
    </div>
  );
};

export default Bowl;
