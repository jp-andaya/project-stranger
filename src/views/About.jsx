import { useTheme } from '../context/ThemeContext';
import Bowl from '../components/Bowl';
import styles from './About.module.css';

const About = ({ onNavigate }) => {
  const { theme } = useTheme();

  const steps = [
    { num: '1', text: 'Each day, a new prompt appears asking about your experiences, fears, or hopes.' },
    { num: '2', text: 'Write your story and drop it in the bowl. No account needed.' },
    { num: '3', text: "Pick a note to read a stranger's story. Send warmth if it resonates." },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.bowlContainer}>
        <Bowl noteCount={8} size="lg" />
      </div>

      <h1 className={styles.title} style={{ color: theme.text }}>
        About Stranger
      </h1>

      <p className={styles.paragraph} style={{ color: theme.textWhite }}>
        Stranger is an anonymous space where people share personal stories in response to daily prompts. Like notes passed between strangers, each story is a small act of vulnerability and connection.
      </p>

      <p className={styles.paragraph} style={{ color: theme.textWhite }}>
        There are no profiles, no followers, no likes tied to your identity. Just words from people you'll never meet, reminding you that you're not alone.
      </p>

      <div
        className={styles.howItWorks}
        style={{ backgroundColor: theme.cardBg }}
      >
        <h2 className={styles.sectionTitle} style={{ color: theme.text }}>
          How it works
        </h2>
        {steps.map((step) => (
          <div key={step.num} className={styles.step}>
            <div
              className={styles.stepNumber}
              style={{ backgroundColor: theme.accent }}
            >
              {step.num}
            </div>
            <p className={styles.stepText} style={{ color: theme.textWhite }}>
              {step.text}
            </p>
          </div>
        ))}
      </div>

      <div
        className={styles.quote}
        style={{ borderTopColor: theme.borderLight }}
      >
        <p className={styles.quoteText} style={{ color: theme.text }}>
          "A stranger in this place wants you to feel better."
        </p>
        <p className={styles.quoteAttribution} style={{ color: theme.textMuted }}>
          People do care.
        </p>
      </div>

      <div
        className={styles.privacy}
        style={{ backgroundColor: theme.bgSecondary }}
      >
        <h3 className={styles.privacyTitle} style={{ color: theme.textMuted }}>
          Privacy
        </h3>
        <p className={styles.privacyText} style={{ color: theme.textWhite }}>
          Stranger collects no personal information. No accounts, no cookies, no tracking. Your stories are completely anonymous.
        </p>
      </div>

      <div className={styles.cta}>
        <button
          className={styles.ctaButton}
          onClick={() => onNavigate('home')}
          style={{ backgroundColor: theme.accent }}
        >
          Start Writing
        </button>
      </div>
    </main>
  );
};

export default About;
