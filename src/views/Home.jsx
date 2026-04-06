import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { formatDate } from '../utils/date';
import GlowingBowl from '../components/GlowingBowl';
import StoryCard from '../components/StoryCard';
import Skeleton from '../components/Skeleton';
import styles from './Home.module.css';

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const Home = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { currentPrompt, notes, loading, error, addNote } = useNotes();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const promptText = currentPrompt?.text || '';
  const { displayed, done } = useTypingAnimation(promptText, 40);

  if (loading) {
    return (
      <main className={styles.main}>
        <section className={styles.hero}>
          <Skeleton width="120px" height="24px" radius={100} style={{ margin: '0 auto 14px' }} />
          <Skeleton width="70%" height="48px" radius={4} style={{ margin: '0 auto 16px' }} />
          <Skeleton width="50%" height="48px" radius={4} style={{ margin: '0 auto' }} />
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.errorCard}>
            <p className={styles.errorText}>{error}</p>
            <p className={styles.errorHint}>Make sure the backend is running at localhost:8000</p>
          </div>
        </section>
      </main>
    );
  }

  const promptNotes = notes;
  const isReady = text.length >= 20 && !submitting;

  const handleSubmit = async () => {
    if (!isReady) return;
    setSubmitError('');
    try {
      setSubmitting(true);
      await addNote(text, currentPrompt.id);
      setText('');
      onNavigate('confirm');
    } catch (err) {
      setSubmitError(
        err.message || 'Your story could not be shared. Please ensure your content is respectful.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* ── Hero Section ── */}
      <section className={styles.hero}>
        <div className={styles.badge}>TODAY'S PROMPT</div>
        <div className={styles.date}>
          {formatDate(currentPrompt.scheduled_date)}
        </div>
        <h1 className={styles.promptText}>
          {displayed}
          {!done && <span className={styles.cursor}>|</span>}
        </h1>
        <div className={styles.tagRow}>
          <span className={styles.tag}>
            {currentPrompt.category || 'TRUTH'}
          </span>
        </div>

        <div className={styles.bowlContainer}>
          <GlowingBowl
            noteCount={promptNotes.length}
            size="lg"
            clickable
            onClick={() => onNavigate('read')}
          />
        </div>
      </section>

      {/* ── Write Section ── */}
      <section className={styles.writeSection}>
        <div className={styles.sectionDivider} />

        <h2 className={styles.writeTitle}>Share your story</h2>

        <div className={styles.writeCard}>
          <textarea
            className={styles.textarea}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, 2000));
              if (submitError) setSubmitError('');
            }}
            placeholder="Write something only a stranger would understand..."
            disabled={submitting}
          />
          <div className={styles.writeFooter}>
            <span className={styles.charCount}>{text.length}/2000</span>
          </div>
        </div>

        {submitError && (
          <div className={styles.submitError}>
            {submitError}
          </div>
        )}

        <div className={styles.submitRow}>
          <motion.button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!isReady}
            whileTap={isReady ? { scale: 0.96 } : undefined}
          >
            {submitting ? 'Sharing...' : 'Drop into the bowl'}
          </motion.button>
        </div>

        <p className={styles.privacyNote}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Your identity remains completely anonymous
        </p>
      </section>

      {/* ── Stories Section ── */}
      {promptNotes.length > 0 && (
        <section className={styles.storiesSection}>
          <div className={styles.sectionDivider} />

          <div className={styles.storiesHeader}>
            <h2 className={styles.storiesTitle}>Stories from strangers</h2>
            <span className={styles.storiesCount}>{promptNotes.length} shared</span>
          </div>

          <motion.div
            className={styles.storiesList}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {promptNotes.slice(0, 5).map((note) => (
              <StoryCard key={note.id} note={note} />
            ))}
          </motion.div>
        </section>
      )}

      {promptNotes.length === 0 && (
        <section className={styles.storiesSection}>
          <div className={styles.sectionDivider} />
          <p className={styles.emptyState}>
            No stories yet. Be the first to share.
          </p>
        </section>
      )}
    </main>
  );
};

export default Home;
