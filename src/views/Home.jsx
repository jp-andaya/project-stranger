import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { formatDate } from '../utils/date';
import Bowl from '../components/Bowl';
import StoryCard from '../components/StoryCard';
import styles from './Home.module.css';

const Home = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { currentPrompt, notes, loading, error, addNote } = useNotes();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const promptText = currentPrompt?.text || '';
  const { displayed, done } = useTypingAnimation(promptText, 40);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.promptSection}>
          <p style={{ color: theme.textMuted, fontStyle: 'italic' }}>
            Loading today's prompt...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <div className={styles.promptSection}>
          <p style={{ color: theme.accent, fontStyle: 'italic' }}>
            {error}
          </p>
          <p style={{ color: theme.textMuted, marginTop: '12px', fontSize: '14px' }}>
            Make sure the backend is running at localhost:8000
          </p>
        </div>
      </main>
    );
  }

  const promptNotes = notes;

  const handleSubmit = async () => {
    if (text.length < 20 || submitting) return;

    try {
      setSubmitting(true);
      await addNote(text, currentPrompt.id);
      setText('');
      onNavigate('confirm');
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* Prompt Section */}
      <div className={styles.promptSection}>
        <div
          className={styles.promptBadge}
          style={{ backgroundColor: theme.bgSecondary, color: theme.textMuted }}
        >
          TODAY'S PROMPT
        </div>
        <div className={styles.date} style={{ color: theme.textMuted }}>
          {formatDate(currentPrompt.scheduled_date)}
        </div>
        <h1 className={styles.promptText} style={{ color: theme.text }}>
          {displayed}
          {!done && <span className={styles.cursor}>|</span>}
        </h1>
        <div className={styles.tagContainer}>
          <span
            className={styles.tag}
            style={{ borderColor: theme.border, color: theme.textMuted }}
          >
            {currentPrompt.category || 'TRUTH'}
          </span>
        </div>
      </div>

      {/* Bowl */}
      <div className={styles.bowlContainer}>
        <Bowl
          noteCount={promptNotes.length}
          size="lg"
          clickable
          onClick={() => onNavigate('read')}
        />
      </div>

      {/* Write Section */}
      <div
        className={styles.writeContainer}
        style={{ backgroundColor: theme.bgSecondary }}
      >
        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 2000))}
          placeholder="Share your story anonymously..."
          style={{ color: theme.textWhite }}
          disabled={submitting}
        />
        <div className={styles.charCount}>
          <span style={{ color: theme.textMuted }}>{text.length}/2000</span>
        </div>
      </div>

      <div className={styles.submitRow}>
        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={text.length < 20 || submitting}
          style={{
            backgroundColor:
              text.length >= 20 && !submitting
                ? theme.accent
                : 'rgba(255,255,255,0.1)',
            color:
              text.length >= 20 && !submitting ? '#0a0a0b' : theme.textMuted,
            cursor:
              text.length >= 20 && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Sharing...' : 'Share Anonymously'}
        </button>
      </div>

      <div className={styles.privacyNote}>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.textMuted}
          strokeWidth="1.5"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span style={{ color: theme.textMuted }}>
          Your identity remains completely anonymous
        </span>
      </div>

      {/* Stories Section */}
      <div
        className={styles.storiesSection}
        style={{ borderTopColor: theme.border }}
      >
        <div className={styles.storiesHeader}>
          <h2 className={styles.storiesTitle} style={{ color: theme.textWhite }}>
            Stories from Strangers
          </h2>
          <span style={{ color: theme.textMuted }}>
            {promptNotes.length} shared
          </span>
        </div>

        {promptNotes.length === 0 ? (
          <p className={styles.emptyState} style={{ color: theme.textMuted }}>
            No stories yet. Be the first to share.
          </p>
        ) : (
          <div className={styles.storiesList}>
            {promptNotes.slice(0, 5).map((note) => (
              <StoryCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Home;
