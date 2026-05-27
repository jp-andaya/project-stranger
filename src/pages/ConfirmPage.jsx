import { motion } from 'framer-motion';
import { useNotes } from '../stores/useNotes';
import Bowl from '../components/Bowl';

export default function ConfirmPage({ go }) {
  const { notes } = useNotes();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="relative inline-block mb-8">
        <div
          className="absolute top-[-40px] left-1/2 -translate-x-1/2 w-[22px] h-[14px] bg-[#C4B0E8] rounded-sm z-10"
          style={{
            animation: 'drop-note 1.6s ease-out forwards',
            boxShadow: '0 0 12px rgba(196,176,232,0.4)',
          }}
        />
        <Bowl noteCount={notes.length} size="md" />
      </div>

      <h1 className="font-serif text-3xl text-[#2E1A6E] mb-3">Story shared</h1>
      <p className="text-[0.9375rem] text-[#2E1A6E]/60 mb-1.5">Your words are now in the jar.</p>
      <p className="text-sm text-[#2E1A6E]/35 mb-10">A stranger somewhere will find them.</p>

      <div className="flex gap-3">
        <motion.button
          onClick={() => go('read')}
          whileTap={{ scale: 0.96 }}
          className="px-7 py-3 rounded-full border border-[#2E1A6E]/[0.12] text-sm text-[#2E1A6E]/60 hover:bg-[#EAE2F8] hover:border-[#2E1A6E]/20 transition-all cursor-pointer"
        >
          Read stories
        </motion.button>
        <motion.button
          onClick={() => go('home')}
          whileTap={{ scale: 0.96 }}
          className="px-7 py-3 rounded-full bg-[#2E1A6E] text-[#F2EDE4] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Write another
        </motion.button>
      </div>
    </div>
  );
}
