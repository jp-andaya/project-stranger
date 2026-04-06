import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import Skeleton from '../components/Skeleton';
import styles from './Read.module.css';

const Read = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { currentPrompt, getRandomNote, likeNote, hasLiked } = useNotes();
  const [note, setNote] = useState(null);
  const [loadingNote, setLoadingNote] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (currentPrompt) pickNote();
  }, [currentPrompt]);

  const pickNote = async () => {
    setLoadingNote(true);
    const randomNote = await getRandomNote(currentPrompt.id);
    setNote(randomNote);
    setKey((k) => k + 1);
    setLoadingNote(false);
  };

  const handleLike = async () => {
    if (!note) return;
    const result = await likeNote(note.id);
    if (result && !result.already_liked) {
      setNote((prev) => ({ ...prev, likes: result.likes }));
    }
  };

  if (loadingNote && !note) {
    return (
      <main className={styles.main}>
        <Skeleton width="100px" height="14px" radius={100} style={{ margin: '0 auto 14px' }} />
        <Skeleton width="80%" height="20px" radius={4} style={{ margin: '0 auto 48px' }} />
        <Skeleton width="100%" height="220px" radius={16} />
      </main>
    );
  }

  if (!note) {
    return (
      <main className={styles.main}>
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>The bowl is empty</p>
          <p className={styles.emptyHint}>No stories have been shared yet</p>
          <motion.button
            className={styles.primaryButton}
            onClick={() => onNavigate('home')}
            whileTap={{ scale: 0.96 }}
          >
            Go back
          </motion.button>
        </div>
      </main>
    );
  }

  const liked = hasLiked(note.id);

  return (
    <main className={styles.main}>
      <div className={styles.label}>From the bowl</div>
      <p className={styles.prompt}>"{currentPrompt.text}"</p>

      <motion.div
        key={key}
        className={styles.noteCard}
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <p className={styles.noteContent}>{note.content}</p>
        <div className={styles.noteFooter}>
          <span className={styles.time}>{note.time_ago || note.time}</span>
          <motion.button
            className={styles.warmthButton}
            onClick={handleLike}
            data-liked={liked ? '' : undefined}
            whileTap={{ scale: 0.92 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{note.likes}</span>
          </motion.button>
        </div>
      </motion.div>

      <div className={styles.actions}>
        <motion.button
          className={styles.primaryButton}
          onClick={pickNote}
          disabled={loadingNote}
          whileTap={{ scale: 0.96 }}
        >
          {loadingNote ? 'Picking...' : 'Pick another note'}
        </motion.button>

        <button
          className={styles.backLink}
          onClick={() => onNavigate('home')}
        >
          Back to today
        </button>
      </div>
    </main>
  );
};

export default Read;
