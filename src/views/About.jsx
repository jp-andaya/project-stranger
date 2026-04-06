import { motion } from 'framer-motion';
import GlowingBowl from '../components/GlowingBowl';
import styles from './About.module.css';

const About = ({ onNavigate }) => {
  const steps = [
    { num: '1', text: 'Each day, a new prompt appears asking about your experiences, fears, or hopes.' },
    { num: '2', text: 'Write your story and drop it in the bowl. No account needed.' },
    { num: '3', text: "Pick a note to read a stranger's story. Send warmth if it resonates." },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.bowlContainer}>
        <GlowingBowl noteCount={8} size="md" />
      </div>

      <h1 className={styles.title}>About Stranger</h1>

      <p className={styles.paragraph}>
        Stranger is an anonymous space where people share personal stories in response to daily prompts. Like notes passed between strangers, each story is a small act of vulnerability and connection.
      </p>

      <p className={styles.paragraph}>
        There are no profiles, no followers, no likes tied to your identity. Just words from people you'll never meet, reminding you that you're not alone.
      </p>

      <div className={styles.stepsCard}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        {steps.map((step) => (
          <div key={step.num} className={styles.step}>
            <div className={styles.stepNumber}>{step.num}</div>
            <p className={styles.stepText}>{step.text}</p>
          </div>
        ))}
      </div>

      <div className={styles.quote}>
        <p className={styles.quoteText}>
          "A stranger in this place wants you to feel better."
        </p>
        <p className={styles.quoteAttribution}>People do care.</p>
      </div>

      <div className={styles.privacyCard}>
        <h3 className={styles.privacyTitle}>Privacy</h3>
        <p className={styles.privacyText}>
          Stranger collects no personal information. No accounts, no cookies, no tracking. Your stories are completely anonymous.
        </p>
      </div>

      <div className={styles.cta}>
        <motion.button
          className={styles.ctaButton}
          onClick={() => onNavigate('home')}
          whileTap={{ scale: 0.96 }}
        >
          Start writing
        </motion.button>
      </div>
    </main>
  );
};

export default About;
