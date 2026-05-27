import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotes } from '../stores/useNotes';
import Bowl from '../components/Bowl';
import PromptDisplay from '../components/PromptDisplay';
import WriteForm from '../components/WriteForm';
import NoteCard from '../components/NoteCard';

export default function HomePage({ go }) {
  const { currentPrompt, notes, loading, error, addNote, likeNote, hasLiked, flagNote } = useNotes();
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-24 h-6 rounded-full bg-[#EAE2F8] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-6">
        <div className="max-w-md p-7 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl border-l-[3px] border-l-[#ff6b5a]">
          <p className="text-[#2E1A6E] mb-2">{error}</p>
          <p className="text-sm text-[#2E1A6E]/35">Make sure the backend is running at localhost:8000</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (text) => {
    setSubmitting(true);
    try {
      await addNote(text, currentPrompt.id);
      go('confirm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <section className="min-h-dvh flex flex-col items-center justify-center px-6 pt-8 pb-12">
        <PromptDisplay prompt={currentPrompt} />
        <div className="mt-12">
          <Bowl noteCount={notes.length} size="lg" clickable onClick={() => go('read')} />
        </div>
      </section>

      {/* Write */}
      <section className="max-w-xl mx-auto px-6 pb-12">
        <div className="w-16 h-px mx-auto mb-12 bg-gradient-to-r from-transparent via-[#7B5EA7] to-transparent opacity-40" />
        <h2 className="font-serif text-2xl text-center text-[#2E1A6E] mb-6">Share your story</h2>
        <WriteForm onSubmit={handleSubmit} submitting={submitting} />
      </section>

      {/* Stories */}
      <section className="max-w-xl mx-auto px-6 pb-20">
        <div className="w-16 h-px mx-auto mb-12 bg-gradient-to-r from-transparent via-[#7B5EA7] to-transparent opacity-40" />

        {notes.length > 0 ? (
          <>
            <div className="flex justify-between items-baseline mb-6">
              <h2 className="font-serif text-2xl text-[#2E1A6E]">Stories from Pondr</h2>
              <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35">{notes.length} shared</span>
            </div>
            <motion.div
              className="flex flex-col gap-3.5"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            >
              {notes.slice(0, 5).map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  liked={hasLiked(note.id)}
                  onLike={likeNote}
                  onFlag={flagNote}
                />
              ))}
            </motion.div>
          </>
        ) : (
          <p className="text-center font-serif italic text-lg text-[#2E1A6E]/35 py-12">
            No stories yet. Be the first to share.
          </p>
        )}
      </section>
    </>
  );
}
