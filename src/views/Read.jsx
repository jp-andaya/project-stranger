import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import styles from './Read.module.css';

const Read = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { currentPrompt, getRandomNote, likeNote, hasLiked } = useNotes();
  const [note, setNote] = useState(null);
  const [loadingNote, setLoadingNote] = useState(true);
  const [key, setKey] = useState(0);

  // Pick first note on mount
  useEffect(() => {
    if (currentPrompt) {
      pickNote();
    }
  }, [currentPrompt]);

  const pickNote = async () => {
    setLoadingNote(true);
    const randomNote = await getRandomNote(currentPrompt.id);
    setNote(randomNote);
    setKey((k) => k + 1);
    setLoadingNote(false);
  };

  const pickAnother = () => {
    pickNote();
  };

  const handleLike = async () => {
    if (!note) return;
    const result = await likeNote(note.id);
    if (result && !result.already_liked) {
      // Update local note state with new like count
      setNote((prev) => ({ ...prev, likes: result.likes }));
    }
  };

  // Loading state
  if (loadingNote && !note) {
    return (
      <div className={styles.empty}>
        <p style={{ color: theme.textMuted, fontStyle: 'italic' }}>
          Reaching into the bowl...
        </p>
      </div>
    );
  }

  // Empty bowl
  if (!note) {
    return (
      <div className={styles.empty}>
        <p style={{ color: theme.textMuted }}>The bowl is empty...</p>
        <button
          className={styles.backButton}
          onClick={() => onNavigate('home')}
          style={{ backgroundColor: theme.accent }}
        >
          Go back
        </button>
      </div>
    );
  }

  const liked = hasLiked(note.id);

  return (
    <main className={styles.main}>
      <div className={styles.label} style={{ color: theme.textMuted }}>
        From the bowl
      </div>
      <p className={styles.prompt} style={{ color: theme.textSecondary }}>
        "{currentPrompt.text}"
      </p>

      <div
        key={key}
        className={styles.noteCard}
        style={{
          backgroundColor: theme.cardBg,
          borderColor: theme.borderLight,
        }}
      >
        <p className={styles.noteContent} style={{ color: theme.textWhite }}>
          {note.content}
        </p>
        <div
          className={styles.noteFooter}
          style={{ borderTopColor: theme.borderLight }}
        >
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

      <button
        className={styles.pickButton}
        onClick={pickAnother}
        disabled={loadingNote}
        style={{ backgroundColor: theme.accent }}
      >
        {loadingNote ? 'Picking...' : 'Pick Another Note'}
      </button>

      <button
        className={styles.backLink}
        onClick={() => onNavigate('home')}
        style={{ color: theme.textMuted }}
      >
        ← Back to today
      </button>
    </main>
  );
};

export default Read;
