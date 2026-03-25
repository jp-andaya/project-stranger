import { useTheme } from '../context/ThemeContext';
import BowlIcon from './BowlIcon';
import ThemeToggle from './ThemeToggle';
import styles from './Header.module.css';

const Header = ({ currentView, onNavigate }) => {
  const { theme } = useTheme();

  const navItems = [
    { id: 'home', label: 'Today' },
    { id: 'archive', label: 'Archive' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header
      className={styles.header}
      style={{
        backgroundColor: theme.bg,
        borderBottomColor: theme.borderLight,
      }}
    >
      <div className={styles.container}>
        <button
          className={styles.logoButton}
          onClick={() => onNavigate('home')}
          aria-label="Go to home"
        >
          <BowlIcon />
        </button>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={styles.navButton}
              onClick={() => onNavigate(item.id)}
              style={{
                color: currentView === item.id ? theme.text : theme.textMuted,
              }}
            >
              {item.label}
            </button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
};

export default Header;
