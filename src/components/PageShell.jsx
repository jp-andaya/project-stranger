import { motion } from 'framer-motion';

export default function PageShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.25 } }}
      className="min-h-screen pb-24"
    >
      {children}
    </motion.div>
  );
}
