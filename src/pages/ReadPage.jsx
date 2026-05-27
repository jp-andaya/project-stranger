import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNotes } from '../stores/useNotes';
import { cn } from '../lib/cn';

export default function ReadPage({ go }) {
  const { currentPrompt, getRandomNote, likeNote, hasLiked } = useNotes();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (currentPrompt) pick();
  }, [currentPrompt]);

  const pick = async () => {
    setLoading(true);
    const n = await getRandomNote(currentPrompt.id);
    setNote(n);
    setKey((k) => k + 1);
    setLoading(false);
  };

  const handleLike = async () => {
    if (!note) return;
    const result = await likeNote(note.id);
    if (result && !result.already_liked) {
      setNote((prev) => ({ ...prev, likes: result.likes }));
    }
  };

  if (loading && !note) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md px-6 space-y-4">
          <div className="h-4 w-24 mx-auto rounded-full bg-[#EAE2F8] animate-pulse" />
          <div className="h-5 w-3/4 mx-auto rounded bg-[#EAE2F8] animate-pulse" />
          <div className="h-52 w-full rounded-2xl bg-[#EAE2F8] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="font-serif text-2xl text-[#2E1A6E]/60 mb-2">The jar is empty</p>
        <p className="text-sm text-[#2E1A6E]/35 mb-8">No stories have been shared yet</p>
        <motion.button
          onClick={() => go('home')}
          whileTap={{ scale: 0.96 }}
          className="px-8 py-3.5 rounded-full bg-[#2E1A6E] text-[#F2EDE4] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Go back
        </motion.button>
      </div>
    );
  }

  const liked = hasLiked(note.id);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 text-center">
      <div className="inline-block px-4 py-1.5 rounded-full bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] font-mono text-[0.6875rem] tracking-widest uppercase text-[#2E1A6E]/35 mb-3">
        From the jar
      </div>

      <p className="font-serif italic text-lg text-[#2E1A6E]/60 tracking-tight mb-10 max-w-md">
        "{currentPrompt?.text}"
      </p>

      <motion.div
        key={key}
        className="w-full max-w-lg p-8 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl text-left mb-8"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      >
        <p className="text-[0.9375rem] leading-[1.85] text-[#2E1A6E] mb-6">{note.content}</p>

        <div className="flex justify-between items-center pt-4 border-t border-[#2E1A6E]/[0.06]">
          <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35 tracking-wide uppercase">
            {note.time_ago || note.time}
          </span>
          <motion.button
            onClick={handleLike}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 border rounded-full text-[0.6875rem] font-mono transition-all cursor-pointer',
              liked
                ? 'border-[#ff9b7a]/25 bg-[#ff9b7a]/[0.06] text-[#ff9b7a]'
                : 'border-[#2E1A6E]/[0.08] text-[#2E1A6E]/35 hover:border-[#2E1A6E]/20'
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {note.likes}
          </motion.button>
        </div>
      </motion.div>

      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={pick}
          disabled={loading}
          whileTap={{ scale: 0.96 }}
          className="px-8 py-3.5 rounded-full bg-[#2E1A6E] text-[#F2EDE4] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Picking...' : 'Pick another note'}
        </motion.button>
        <button onClick={() => go('home')} className="text-[0.6875rem] text-[#2E1A6E]/35 hover:text-[#2E1A6E]/60 transition-colors cursor-pointer">
          Back to today
        </button>
      </div>
    </div>
  );
}
