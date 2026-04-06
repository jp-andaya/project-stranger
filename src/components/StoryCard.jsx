import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotes } from '../context/NotesContext';
import styles from './StoryCard.module.css';

const StoryCard = ({ note }) => {
  const { likeNote, hasLiked, flagNoteForReview } = useNotes();
  const liked = hasLiked(note.id);
  const [flagged, setFlagged] = useState(false);

  const handleLike = async () => {
    await likeNote(note.id);
  };

  const handleFlag = async () => {
    if (flagged) return;
    const success = await flagNoteForReview(note.id);
    if (success) setFlagged(true);
  };

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <p className={styles.content}>
        {note.content}
      </p>
      <div className={styles.footer}>
        <span className={styles.time}>
          {note.time_ago || note.time}
        </span>
        <div className={styles.actions}>
          <button
            className={styles.flagButton}
            onClick={handleFlag}
            title={flagged ? 'Reported' : 'Report this note'}
            data-flagged={flagged ? '' : undefined}
          >
            {flagged ? 'Reported' : 'Report'}
          </button>
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
      </div>
    </motion.div>
  );
};

export default StoryCard;
