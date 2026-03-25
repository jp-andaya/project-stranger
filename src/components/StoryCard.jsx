import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import styles from './StoryCard.module.css';

const StoryCard = ({ note }) => {
  const { theme } = useTheme();
  const { likeNote, hasLiked } = useNotes();
  const liked = hasLiked(note.id);

  const handleLike = async () => {
    await likeNote(note.id);
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
  );
};

export default StoryCard;
