import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useNotes } from '../context/NotesContext';
import { formatDateShort } from '../utils/date';
import styles from './Archive.module.css';

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

const Archive = ({ onNavigate }) => {
  const { theme } = useTheme();
  const { prompts, getNoteCount } = useNotes();

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Archive</h1>
      <p className={styles.subtitle}>Past prompts and their stories</p>

      <motion.div
        className={styles.grid}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {prompts.map((prompt) => (
          <motion.button
            key={prompt.id}
            className={styles.card}
            variants={cardVariant}
            onClick={() => onNavigate('home')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <p className={styles.promptText}>{prompt.text}</p>
            <div className={styles.cardFooter}>
              <span className={styles.meta}>{formatDateShort(prompt.scheduled_date)}</span>
              <span className={styles.meta}>{getNoteCount(prompt.id)} stories</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </main>
  );
};

export default Archive;
