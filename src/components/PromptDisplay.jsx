import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { formatDate } from '../lib/date';

export default function PromptDisplay({ prompt }) {
  const { displayed, done } = useTypingAnimation(prompt?.text || '', 40);

  return (
    <div className="text-center">
      <div className="inline-block px-4 py-1.5 rounded-full bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] font-mono text-[0.6875rem] tracking-widest uppercase text-[#2E1A6E]/40 mb-4">
        Prompt of the day
      </div>

      <div className="font-mono text-[0.6875rem] text-[#2E1A6E]/35 tracking-wide mb-6">
        {formatDate(prompt?.scheduled_date)}
      </div>

      <h1 className="font-serif text-4xl md:text-5xl font-normal leading-[1.15] tracking-tight text-[#2E1A6E] max-w-xl mx-auto min-h-[80px]">
        {displayed}
        {!done && <span className="text-[#2E1A6E] animate-[blink_1s_infinite]">|</span>}
      </h1>

      {prompt?.category && (
        <div className="mt-5">
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#2E1A6E]/[0.08] text-[#2E1A6E] font-mono text-[10px] tracking-widest uppercase">
            {prompt.category}
          </span>
        </div>
      )}
    </div>
  );
}
