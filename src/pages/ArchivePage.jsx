import { motion } from 'framer-motion';
import { useNotes } from '../stores/useNotes';
import { formatDateShort } from '../lib/date';

export default function ArchivePage({ go }) {
  const { prompts, getNoteCount } = useNotes();

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 pb-16">
      <h1 className="font-serif text-3xl text-[#2E1A6E] mb-2">Archive</h1>
      <p className="text-sm text-[#2E1A6E]/35 mb-10">Past prompts and their stories</p>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3.5"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {prompts.map((prompt) => (
          <motion.button
            key={prompt.id}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
            }}
            onClick={() => go('home')}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col justify-between text-left p-6 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl cursor-pointer transition-[box-shadow,background] hover:bg-[#E2D8F5] hover:shadow-[0_4px_20px_rgba(46,26,110,0.10)]"
          >
            <p className="font-serif italic text-[0.9375rem] leading-relaxed text-[#2E1A6E] mb-4">
              {prompt.text}
            </p>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35">{formatDateShort(prompt.scheduled_date)}</span>
              <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35">{getNoteCount(prompt.id)} stories</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
