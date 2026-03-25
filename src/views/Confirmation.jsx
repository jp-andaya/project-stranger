import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import Bowl from '../components/Bowl';
import styles from './Confirmation.module.css';

const Confirmation = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { currentPrompt, notes } = useNotes();

  return (
    <main className={styles.main}>
      <div className={styles.bowlContainer}>
        <div className={styles.droppingNote} />
        <Bowl noteCount={notes.length} size="lg" />
      </div>

      <h1 className={styles.title} style={{ color: theme.text }}>
        Story shared
      </h1>
      <p className={styles.subtitle} style={{ color: theme.textMuted }}>
        Your words are now in the bowl.
      </p>
      <p className={styles.message} style={{ color: theme.textMuted }}>
        A stranger somewhere will find them.
      </p>

      <div className={styles.buttons}>
        <button
          className={styles.secondaryButton}
          onClick={() => onNavigate('read')}
          style={{ borderColor: theme.border, color: theme.textWhite }}
        >
          Read Stories
        </button>
        <button
          className={styles.primaryButton}
          onClick={() => onNavigate('home')}
          style={{ backgroundColor: theme.accent }}
        >
          Write Another
        </button>
      </div>
    </main>
  );
};

export default Confirmation;
