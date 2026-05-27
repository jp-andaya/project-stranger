import { cn } from '../lib/cn';

const HomeIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
    <path d="M9 21V12h6v9" />
  </svg>
);

const ProfileIcon = ({ filled }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

const PencilIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F2EDE4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const homeViews = ['home', 'read', 'confirm'];
const profileViews = ['about', 'archive', 'admin'];

export default function Nav({ current, go }) {
  const homeActive = homeViews.includes(current);
  const profileActive = profileViews.includes(current);

  return (
    <>
      {/* FAB — floats above the tab bar */}
      <button
        onClick={() => go('home')}
        aria-label="Write a note"
        className="fixed bottom-[52px] left-1/2 -translate-x-1/2 z-50 w-14 h-14 rounded-full bg-[#2E1A6E] flex items-center justify-center shadow-[0_4px_16px_rgba(46,26,110,0.35)] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
      >
        <PencilIcon />
      </button>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#F2EDE4] border-t border-[#2E1A6E]/[0.08] h-16 flex items-center">
        <div className="flex w-full">
          {/* Home tab */}
          <button
            onClick={() => go('home')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors cursor-pointer',
              homeActive ? 'text-[#2E1A6E]' : 'text-[#9E90C2] hover:text-[#7B5EA7]'
            )}
          >
            <HomeIcon filled={homeActive} />
            <span className="text-[0.6rem] font-medium tracking-wide">Home</span>
          </button>

          {/* Center spacer for FAB */}
          <div className="flex-1" />

          {/* Profile tab */}
          <button
            onClick={() => go('about')}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 h-16 transition-colors cursor-pointer',
              profileActive ? 'text-[#2E1A6E]' : 'text-[#9E90C2] hover:text-[#7B5EA7]'
            )}
          >
            <ProfileIcon filled={profileActive} />
            <span className="text-[0.6rem] font-medium tracking-wide">Profile</span>
          </button>
        </div>
      </nav>
    </>
  );
}
