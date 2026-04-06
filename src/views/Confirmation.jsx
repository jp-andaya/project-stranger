import { motion } from 'framer-motion';
import { useNotes } from '../context/NotesContext';
import GlowingBowl from '../components/GlowingBowl';
import styles from './Confirmation.module.css';

const Confirmation = ({ onNavigate }) => {
  const { notes } = useNotes();

  return (
    <main className={styles.main}>
      <div className={styles.bowlContainer}>
        <div className={styles.droppingNote} />
        <GlowingBowl noteCount={notes.length} size="md" />
      </div>

      <h1 className={styles.title}>Story shared</h1>
      <p className={styles.subtitle}>Your words are now in the bowl.</p>
      <p className={styles.message}>A stranger somewhere will find them.</p>

      <div className={styles.buttons}>
        <motion.button
          className={styles.outlineButton}
          onClick={() => onNavigate('read')}
          whileTap={{ scale: 0.96 }}
        >
          Read stories
        </motion.button>
        <motion.button
          className={styles.solidButton}
          onClick={() => onNavigate('home')}
          whileTap={{ scale: 0.96 }}
        >
          Write another
        </motion.button>
      </div>
    </main>
  );
};

export default Confirmation;
