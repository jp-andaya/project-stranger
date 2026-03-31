import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import styles from './StoryCard.module.css';

const StoryCard = ({ note }) => {
  const { theme } = useTheme();
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
    <div
      className={styles.card}
      style={{
        backgroundColor: theme.cardBg,
        borderLeftColor: theme.accent,
      }}
    >
      <p className={styles.content} style={{ color: theme.textWhite }}>
        {note.content}
      </p>
      <div className={styles.footer}>
        <span className={styles.time} style={{ color: theme.textMuted }}>
          {note.time_ago || note.time}
        </span>
        <div className={styles.actions}>
          <button
            className={styles.flagButton}
            onClick={handleFlag}
            title={flagged ? 'Reported' : 'Report this note'}
            style={{
              color: flagged ? theme.accent : theme.textMuted,
              opacity: flagged ? 1 : 0.5,
            }}
          >
            {flagged ? '⚑' : '⚐'}
          </button>
          <button
            className={styles.likeButton}
            onClick={handleLike}
            style={{
              backgroundColor: liked
                ? 'rgba(201, 168, 124, 0.15)'
                : 'transparent',
              borderColor: liked ? theme.accent : theme.border,
            }}
          >
            <span style={{ color: liked ? theme.accent : theme.textMuted }}>
              {liked ? '♥' : '♡'}
            </span>
            <span style={{ color: liked ? theme.accent : theme.textMuted }}>
              {note.likes}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCard;
