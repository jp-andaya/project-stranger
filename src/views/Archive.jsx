import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import Bowl from '../components/Bowl';
import styles from './Archive.module.css';

const Archive = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { prompts, loading } = useNotes();

  if (loading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title} style={{ color: theme.text }}>
          Archive
        </h1>
        <p className={styles.subtitle} style={{ color: theme.textMuted }}>
          Loading past prompts...
        </p>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.title} style={{ color: theme.text }}>
        Archive
      </h1>
      <p className={styles.subtitle} style={{ color: theme.textMuted }}>
        Past prompts and their stories
      </p>

      <div className={styles.promptList}>
        {prompts.map((prompt) => (
          <button
            key={prompt.id}
            className={styles.promptCard}
            onClick={() => onNavigate('home')}
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderLight,
            }}
          >
            <Bowl noteCount={prompt.note_count} size="sm" />
            <div className={styles.promptInfo}>
              <p className={styles.promptText} style={{ color: theme.text }}>
                {prompt.text}
              </p>
              <span
                className={styles.promptMeta}
                style={{ color: theme.textMuted }}
              >
                {prompt.scheduled_date} · {prompt.note_count}{' '}
                {prompt.note_count === 1 ? 'story' : 'stories'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
};

export default Archive;
