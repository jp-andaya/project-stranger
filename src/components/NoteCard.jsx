import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/cn';

export default function NoteCard({ note, onLike, onFlag, liked = false }) {
  const [flagged, setFlagged] = useState(false);

  const handleFlag = () => {
    if (flagged) return;
    onFlag?.(note.id);
    setFlagged(true);
  };

  return (
    <motion.div
      className="p-6 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl transition-[box-shadow,background] duration-250 hover:bg-[#E2D8F5] hover:shadow-[0_4px_20px_rgba(46,26,110,0.10)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
    >
      <p className="text-[0.9375rem] leading-[1.75] text-[#2E1A6E] mb-4">
        {note.content}
      </p>

      <div className="flex justify-between items-center">
        <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35 tracking-wide uppercase">
          {note.time_ago || note.time}
        </span>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFlag}
            className={cn(
              'font-mono text-[0.6875rem] px-2 py-1 transition-colors cursor-pointer',
              flagged ? 'text-[#ff9b7a]' : 'text-[#2E1A6E]/35 hover:text-[#2E1A6E]/60'
            )}
          >
            {flagged ? 'Reported' : 'Report'}
          </button>

          <motion.button
            onClick={() => onLike?.(note.id)}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 border rounded-full text-[0.6875rem] font-mono transition-all cursor-pointer',
              liked
                ? 'border-[#ff9b7a]/25 bg-[#ff9b7a]/[0.06] text-[#ff9b7a]'
                : 'border-[#2E1A6E]/[0.08] text-[#2E1A6E]/35 hover:border-[#2E1A6E]/20 hover:bg-[#EAE2F8]'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {note.likes}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
