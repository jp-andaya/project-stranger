import { useTheme } from '../context/ThemeContext';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        backgroundColor: theme.toggleBg,
        borderColor: theme.border,
      }}
    >
      <div
        className={styles.knob}
        style={{
          left: isDark ? '20px' : '2px',
          backgroundColor: theme.toggleKnob,
        }}
      />
    </button>
  );
};

export default ThemeToggle;
