// App.jsx — Pondr root: routing/tab state, identity/auth/unlock state,
// persistence, overlays. Ported from the design handoff (pondr-app.jsx).
// The prototype's iOS frame and Tweaks panel are intentionally NOT ported —
// appearance settings now live on the Profile screen, and the device frame is
// replaced by the web shell in main.jsx + styles/index.css.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from './pondr/icons.jsx';
import { Bowl } from './pondr/Bowl.jsx';
import {
  SAMPLE_NOTES, SAMPLE_WINS, PROMPTS, MY_NUMBER,
  handleFromNumber, authorHandle,
} from './pondr/data.js';
import {
  buildPromptItems, AuthScreen, OnboardingScreen, HomeScreen, FeedScreen,
  ComposeScreen, WinsScreen, ProfileScreen, ExploreScreen, DonationScreen,
  AddWinScreen, PromptArchive,
} from './pondr/screens.jsx';

// Appearance defaults (was the prototype's TWEAK_DEFAULTS / EDITMODE block).
const APPEARANCE_DEFAULTS = {
  theme: "light",
  accent: "purple",
  bowl: "photo",
  noteFont: "sans",
  notePalette: "warm",
};

const readLS = (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } };
const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// Persisted appearance settings, replacing the prototype's useTweaks hook.
function useAppearance() {
  const [appearance, setAppearance] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("pondr.appearance") || "null");
      return saved ? { ...APPEARANCE_DEFAULTS, ...saved } : APPEARANCE_DEFAULTS;
    } catch {
      return APPEARANCE_DEFAULTS;
    }
  });
  const set = useCallback((key, value) => {
    setAppearance((prev) => {
      const next = { ...prev, [key]: value };
      writeLS("pondr.appearance", JSON.stringify(next));
      return next;
    });
  }, []);
  return [appearance, set];
}

export default function App() {
  const [t, setAppearance] = useAppearance();
  const [tab, setTab] = useState("home");
  const [picking, setPicking] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [openNote, setOpenNote] = useState(null);
  const [toast, setToast] = useState(null);

  const [notes, setNotes] = useState(() => SAMPLE_NOTES);
  const [wins, setWins] = useState(() => SAMPLE_WINS);
  const [prompt] = useState(() => PROMPTS[0]);
  const promptItems = useMemo(() => buildPromptItems(), []);
  const [showPromptArchive, setShowPromptArchive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Identity: chosen handle (adjective + creature) + onboarding gate (persisted)
  const [authed, setAuthed] = useState(() => readLS("pondr.authed", "") === "1");
  const [myHandle, setMyHandle] = useState(() => readLS("pondr.handle", null));
  const [onboarded, setOnboarded] = useState(() => readLS("pondr.onboarded", "") === "1");
  const [defaultAnon, setDefaultAnon] = useState(() => readLS("pondr.hideName", "") === "1");
  const [mySubs, setMySubs] = useState(() => parseInt(readLS("pondr.subs", "0"), 10) || 0);
  const bumpSubs = (n) => {
    setMySubs((s) => {
      const next = Math.max(0, s + n);
      writeLS("pondr.subs", String(next));
      return next;
    });
  };

  // One note per prompt per 24h — map of prompt text -> last post timestamp
  const [myPosts, setMyPosts] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pondr.posts") || "{}"); } catch { return {}; }
  });
  const DAY = 24 * 3600000;
  const postedAt = myPosts[prompt];
  const composeUnlockAt = postedAt ? postedAt + DAY : 0;

  const authenticate = (mode) => {
    writeLS("pondr.authed", "1");
    setAuthed(true);
    if (mode === "login") {
      // existing account — ensure a handle exists, skip name creation
      if (!myHandle) {
        const h = handleFromNumber(MY_NUMBER);
        setMyHandle(h);
        writeLS("pondr.handle", h);
      }
      setOnboarded(true);
      writeLS("pondr.onboarded", "1");
    }
  };
  const completeOnboarding = (handle, hide) => {
    setMyHandle(handle);
    setDefaultAnon(!!hide);
    writeLS("pondr.handle", handle);
    writeLS("pondr.onboarded", "1");
    writeLS("pondr.hideName", hide ? "1" : "0");
    setOnboarded(true);
  };
  const logOut = () => {
    try {
      localStorage.removeItem("pondr.authed");
      localStorage.removeItem("pondr.onboarded");
      localStorage.removeItem("pondr.subs");
      localStorage.removeItem("pondr.posts");
    } catch { /* ignore */ }
    setMySubs(0);
    setMyPosts({});
    setOnboarded(false);
    setAuthed(false);
    setTab("home");
  };

  // Apply theme + accent + note styling to the document root
  useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.accent = t.accent;
    document.documentElement.dataset.noteFont = t.noteFont;
    document.documentElement.dataset.notePalette = t.notePalette;
  }, [t.theme, t.accent, t.noteFont, t.notePalette]);

  // Toast helper
  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // ───────── Actions ─────────
  const pickFromBowl = () => {
    if (mySubs < 1) {
      flashToast("Share a note first to reach into the bowl");
      setTab("compose");
      return;
    }
    setPicking(true);
    setTimeout(() => {
      setPicking(false);
      const pick = notes[Math.floor(Math.random() * notes.length)];
      setOpenNote(pick);
    }, 2000);
  };

  const submitNote = ({ cat, text, anon, title }) => {
    if (composeUnlockAt > Date.now()) return; // one per prompt per 24h
    setDropping(true);
    setTimeout(() => {
      const id = "n" + Date.now();
      let finalTitle = (title || "").trim();
      if (!finalTitle) {
        const words = text.replace(/\s+/g, ' ').trim().split(' ');
        finalTitle = words.slice(0, 5).join(' ');
        if (words.length > 5) finalTitle += '…';
      }
      setNotes((prev) => [{ id, cat, prompt, anon: !!anon, title: finalTitle, author: MY_NUMBER, body: text, when: "Just now" }, ...prev]);
      bumpSubs(1);
      setMyPosts((p) => {
        const next = { ...p, [prompt]: Date.now() };
        writeLS("pondr.posts", JSON.stringify(next));
        return next;
      });
      setDropping(false);
      setTab("home");
      flashToast("Your note is in the bowl ✨");
    }, 1600);
  };

  const submitWin = ({ icon, text }) => {
    const today = new Date();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const date = `${months[today.getMonth()]} ${today.getDate()}`;
    const id = "w" + Date.now();
    setWins((prev) => [{ id, icon, text, date }, ...prev]);
    setTab("wins");
    flashToast("Win logged 🌿");
  };

  // ───────── Bottom nav handler ─────────
  const handleTab = (next) => {
    if (next === "create") {
      if (composeUnlockAt > Date.now()) {
        flashToast("You've already shared this prompt today");
        setTab("home");
        return;
      }
      setTab("compose");
      return;
    }
    setTab(next);
  };

  // Week-day data for streak
  const weekDays = [
    { letter: "M", done: true },
    { letter: "T", done: true },
    { letter: "W", done: true },
    { letter: "T", done: true },
    { letter: "F", done: true },
    { letter: "S", done: true },
    { letter: "S", done: false },
  ];

  const activeTabKey =
    tab === "compose" ? "create" :
    tab === "home" ? "home" :
    tab === "explore" ? "explore" :
    tab === "donate" ? "donate" :
    tab === "wins" ? "wins" :
    tab === "profile" ? "profile" :
    tab === "addwin" ? "wins" :
    tab === "feed" ? "home" : "home";

  return (
    <div className="app" data-theme={t.theme} data-accent={t.accent}>
      {!authed && <AuthScreen onAuth={authenticate} />}
      {authed && !onboarded && <OnboardingScreen onComplete={completeOnboarding} />}
      <div className="screen-wrap">
        {tab === "home" && (
          <HomeScreen
            promptItems={promptItems}
            bowlMode={t.bowl}
            notes={notes}
            onPickFromBowl={pickFromBowl}
            onOpenCompose={() => setTab("compose")}
            onOpenFeed={() => setTab("feed")}
            onOpenNote={(n) => setOpenNote(n)}
            onOpenMenu={() => setMenuOpen(true)}
            mySubs={mySubs}
            myPosts={myPosts}
          />
        )}
        {tab === "feed" && (
          <FeedScreen
            notes={notes}
            onBack={() => setTab("home")}
            onOpenNote={(n) => setOpenNote(n)}
          />
        )}
        {tab === "compose" && (
          <ComposeScreen
            prompt={prompt}
            onBack={() => setTab("home")}
            onSubmit={submitNote}
            defaultAnon={defaultAnon}
            unlockAt={composeUnlockAt}
            myHandle={myHandle}
          />
        )}
        {tab === "wins" && (
          <WinsScreen
            wins={wins}
            streak={6}
            weekDays={weekDays}
            onAdd={() => setTab("addwin")}
          />
        )}
        {tab === "profile" && (
          <ProfileScreen
            handle={myHandle || handleFromNumber(MY_NUMBER)}
            number={MY_NUMBER}
            subs={mySubs}
            winsCount={wins.length}
            streak={6}
            hideName={defaultAnon}
            onToggleHideName={() => {
              const next = !defaultAnon;
              setDefaultAnon(next);
              writeLS("pondr.hideName", next ? "1" : "0");
            }}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenArchive={() => setShowPromptArchive(true)}
            onOpenWins={() => setTab("wins")}
            onLogout={logOut}
            theme={t.theme}
            accent={t.accent}
            onSetTheme={(v) => setAppearance("theme", v)}
            onSetAccent={(v) => setAppearance("accent", v)}
          />
        )}
        {tab === "explore" && (
          <ExploreScreen onOpenMenu={() => setMenuOpen(true)} />
        )}
        {tab === "donate" && (
          <DonationScreen onOpenMenu={() => setMenuOpen(true)} />
        )}
        {tab === "addwin" && (
          <AddWinScreen
            onBack={() => setTab("wins")}
            onSubmit={submitWin}
          />
        )}

        {/* Picking-from-the-bowl loader */}
        {picking && (
          <div className="pick-overlay">
            <div className="hand" style={{ color: 'var(--p-accent)' }}>
              <Icon.Hand size={200} />
            </div>
            <div className="label">Reaching into the bowl…</div>
          </div>
        )}

        {/* Note-drop animation */}
        {dropping && (
          <div className="drop-overlay">
            <div style={{ width: 280, height: 280, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bowl withSparkles={false} />
              <div className="note-svg" style={{ position: 'absolute', top: 0 }}>
                <svg viewBox="0 0 60 60" width="56" height="56">
                  <rect x="6" y="6" width="48" height="48" rx="3"
                        fill="var(--p-bowl-paper)" stroke="var(--p-bowl-stroke)" strokeWidth="1" />
                  <path d="M 48 6 L 54 12 L 48 12 Z" fill="var(--p-bowl-paper-2)" />
                </svg>
              </div>
            </div>
            <div className="label">Dropping your note…</div>
          </div>
        )}

        {/* Read-note modal */}
        {openNote && (
          <div className="modal-backdrop" onClick={() => setOpenNote(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setOpenNote(null)} aria-label="Close">
                <Icon.X />
              </button>
              <span className="chip">{openNote.cat}</span>
              <p className="body">{openNote.body}</p>
              {openNote.anon ? (
                <div className="modal-author">
                  <span className="author-name anon"><Icon.EyeOff size={13} /> Anonymous</span>
                </div>
              ) : (
                <div className="modal-author">
                  <span className="author-name">{authorHandle(openNote.author, myHandle)}</span>
                  <span className={"author-token" + (openNote.author === MY_NUMBER ? " mine" : "")}>
                    @{openNote.author}
                  </span>
                </div>
              )}
              <div className="meta modal-meta">
                {openNote.anon
                  ? "Posted anonymously · " + openNote.when
                  : (openNote.author === MY_NUMBER ? "You · " + openNote.when : openNote.when)}
              </div>
              <div className="actions">
                <button onClick={() => { setOpenNote(null); flashToast("Saved to your collection"); }}>
                  <Icon.Save /> Save
                </button>
                <button onClick={() => { setOpenNote(null); setTab("compose"); }}>
                  <Icon.Reply /> Reply
                </button>
              </div>
            </div>
          </div>
        )}

        {showPromptArchive && (
          <PromptArchive items={promptItems} onClose={() => setShowPromptArchive(false)} />
        )}

        {/* Side menu / drawer */}
        {menuOpen && (
          <div className="drawer-backdrop" onClick={() => setMenuOpen(false)}>
            <nav className="drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-head">
                <span className="drawer-word">Pondr</span>
                <button className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <Icon.X />
                </button>
              </div>
              <div className="drawer-id">
                <span className="author-name">{myHandle || handleFromNumber(MY_NUMBER)}</span>
                <span className="author-token mine">@{MY_NUMBER}</span>
              </div>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); setShowPromptArchive(true); }}>
                <Icon.Book size={18} /> <span>Past prompts</span>
              </button>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); setTab("wins"); }}>
                <Icon.Trophy size={18} /> <span>Your wins</span>
              </button>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); flashToast("About Pondr — coming soon"); }}>
                <Icon.Sparkle size={18} /> <span>About Pondr</span>
              </button>
            </nav>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>

      {/* Floating compose button — bottom right, above the tab bar (home only) */}
      {tab === "home" && (
        <button className="fab-compose" onClick={() => handleTab("create")} aria-label="Drop a note">
          <Icon.Pencil size={26} />
        </button>
      )}

      {/* Bottom nav */}
      <nav className="tabbar">
        <TabBtn icon={<Icon.Home filled={activeTabKey === "home"} />} label="Home"
                active={activeTabKey === "home"} onClick={() => handleTab("home")} />
        <TabBtn icon={<Icon.Compass filled={activeTabKey === "explore"} />} label="Explore"
                active={activeTabKey === "explore"} onClick={() => setTab("explore")} />
        <TabBtn icon={<Icon.Gift filled={activeTabKey === "donate"} />} label="Support"
                active={activeTabKey === "donate"} onClick={() => setTab("donate")} />
        <TabBtn icon={<Icon.Trophy filled={activeTabKey === "wins"} />} label="Wins"
                active={activeTabKey === "wins"} onClick={() => handleTab("wins")} />
        <TabBtn icon={<Icon.Profile filled={activeTabKey === "profile"} />} label="Profile"
                active={activeTabKey === "profile"} onClick={() => setTab("profile")} />
      </nav>
    </div>
  );
}

function TabBtn({ icon, label, active, onClick }) {
  return (
    <button className={"tab" + (active ? " active" : "")} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
