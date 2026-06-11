import { motion } from 'framer-motion';
import Bowl from '../components/Bowl';

const steps = [
  { n: '1', text: 'Each day, a new prompt appears asking about your experiences, fears, or hopes.' },
  { n: '2', text: 'Write your story and drop it in the jar. No account needed.' },
  { n: '3', text: "Pick a note to read a stranger's story." },
];

export default function AboutPage({ go }) {
  return (
    <div className="max-w-lg mx-auto px-6 pt-8 pb-16">
      <div className="flex justify-center mb-10">
        <Bowl noteCount={8} size="md" />
      </div>

      <h1 className="font-serif text-3xl text-center text-[#2E1A6E] mb-8">About Pondr</h1>

      <p className="text-[0.9375rem] leading-[1.85] text-[#2E1A6E]/60 mb-5">
        Pondr is an anonymous space where people share personal stories in response to daily prompts. Like notes passed between strangers, each story is a small act of vulnerability and connection.
      </p>
      <p className="text-[0.9375rem] leading-[1.85] text-[#2E1A6E]/60 mb-10">
        There are no profiles, no followers, no metrics tied to your identity. Just words from people you'll never meet, reminding you that you're not alone.
      </p>

      <div className="p-7 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl mb-10">
        <h2 className="font-serif text-xl text-[#2E1A6E] mb-5">How it works</h2>
        {steps.map((s) => (
          <div key={s.n} className="flex gap-3.5 items-start mb-4 last:mb-0">
            <div className="w-6 h-6 rounded-full bg-[#2E1A6E] text-[#F2EDE4] flex items-center justify-center text-[0.6875rem] font-semibold shrink-0">
              {s.n}
            </div>
            <p className="text-sm leading-relaxed text-[#2E1A6E]/60">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="text-center py-10 border-t border-[#2E1A6E]/[0.06]">
        <p className="font-serif italic text-lg text-[#2E1A6E] mb-2">
          "A stranger in this place wants you to feel better."
        </p>
        <p className="text-sm text-[#2E1A6E]/35">People do care.</p>
      </div>

      <div className="p-6 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-2xl">
        <h3 className="font-mono text-[0.6875rem] font-medium tracking-widest uppercase text-[#2E1A6E]/35 mb-2.5">Privacy</h3>
        <p className="text-sm leading-relaxed text-[#2E1A6E]/60">
          Pondr collects no personal information. No accounts, no cookies, no tracking. Your stories are completely anonymous.
        </p>
      </div>

      <div className="text-center mt-10">
        <motion.button
          onClick={() => go('home')}
          whileTap={{ scale: 0.96 }}
          className="px-8 py-3.5 rounded-full bg-[#2E1A6E] text-[#F2EDE4] text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
        >
          Start writing
        </motion.button>
      </div>
    </div>
  );
}
