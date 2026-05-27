import { useState } from 'react';
import { motion } from 'framer-motion';

export default function WriteForm({ onSubmit, submitting = false }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const ready = text.length >= 20 && !submitting;

  const handleSubmit = async () => {
    if (!ready) return;
    setError('');
    try {
      await onSubmit(text);
      setText('');
    } catch (err) {
      setError(err.message || 'Your story could not be shared.');
    }
  };

  return (
    <div>
      <div className="bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl overflow-hidden transition-[border-color] focus-within:border-[#2E1A6E]/20">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value.slice(0, 2000));
            if (error) setError('');
          }}
          placeholder="Write something true..."
          disabled={submitting}
          className="w-full min-h-[160px] p-6 bg-transparent text-[#2E1A6E] text-[0.9375rem] leading-[1.75] resize-none outline-none placeholder:text-[#2E1A6E]/25 font-[inherit]"
        />
        <div className="px-5 py-2.5 border-t border-[#2E1A6E]/[0.06] flex justify-end">
          <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/25">{text.length}/2000</span>
        </div>
      </div>

      {error && (
        <div className="mt-3 px-5 py-3.5 rounded-xl border-l-[3px] border-[#ff6b5a] bg-[#ff6b5a]/[0.08] text-[#ff6b5a] text-sm leading-relaxed">
          {error}
        </div>
      )}

      <div className="flex justify-center mt-5">
        <motion.button
          onClick={handleSubmit}
          disabled={!ready}
          whileTap={ready ? { scale: 0.96 } : undefined}
          className={`px-8 py-3.5 rounded-full text-sm font-medium transition-opacity cursor-pointer ${
            ready
              ? 'bg-[#2E1A6E] text-[#F2EDE4] hover:opacity-90'
              : 'bg-[#2E1A6E]/[0.15] text-[#2E1A6E]/35 cursor-not-allowed'
          }`}
        >
          {submitting ? 'Sharing...' : 'Drop into the jar'}
        </motion.button>
      </div>

      <p className="flex items-center justify-center gap-2 mt-5 text-[0.6875rem] text-[#2E1A6E]/25">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        Your identity remains completely anonymous
      </p>
    </div>
  );
}
