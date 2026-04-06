import styles from './Header.module.css';

const Header = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'Today' },
    { id: 'archive', label: 'Archive' },
    { id: 'about', label: 'About' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <header className={styles.header}>
      <nav className={styles.pill}>
        <button
          className={styles.logo}
          onClick={() => onNavigate('home')}
          aria-label="Go to home"
        >
          Stranger
        </button>

        <div className={styles.divider} />

        <div className={styles.links}>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={styles.navLink}
              onClick={() => onNavigate(item.id)}
              data-active={currentView === item.id ? '' : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;
