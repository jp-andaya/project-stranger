// App.jsx — Pondr root: routing/tab state, identity/auth state, server data,
// overlays. All state that used to live in localStorage/sample data now comes
// from the FastAPI backend via src/pondr/api.js; only the bearer token and
// appearance preferences stay client-side.

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Icon } from './pondr/icons.jsx';
import { Bowl } from './pondr/Bowl.jsx';
import * as api from './pondr/api.js';
import {
  mapPromptItems, streakDoneOn, AuthScreen, OnboardingScreen, HomeScreen,
  FeedScreen, ComposeScreen, WinsScreen, ProfileScreen, ExploreScreen,
  DonationScreen, AddWinScreen, PromptArchive,
} from './pondr/screens.jsx';
import { CaptureInstantScreen, StrangerWinsScreen, InstantViewer, fmtClock } from './pondr/instants.jsx';
import { SettingsScreen } from './pondr/settings.jsx';

// Appearance defaults (was the prototype's TWEAK_DEFAULTS / EDITMODE block).
const APPEARANCE_DEFAULTS = {
  theme: "light",
  accent: "purple",
  bowl: "photo",
  noteFont: "sans",
  notePalette: "warm",
};

// Instants display settings — the handoff defaults for what were demo tweaks.
const INSTANT_VIEW = "close";
const INSTANT_SECONDS = 8;
const INSTANT_OVERLAY = "chips";
const INSTANT_FRAME = "clean";

const writeLS = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

// Server datetimes are UTC but serialized without a timezone suffix.
const parseUTC = (s) => {
  if (!s) return 0;
  const iso = /Z$|[+-]\d\d:\d\d$/.test(s) ? s : s + "Z";
  return Date.parse(iso);
};

const DAY_MS = 24 * 3600000;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── Server → screen shape mappers ──
const mapNote = (n) => ({
  id: n.id,
  title: n.title,
  body: n.body,
  cat: n.category,
  prompt_id: n.prompt_id,
  author: n.author_number,
  likes: n.likes,
  liked: n.liked,
  when: n.when,
});

const mapWin = (w) => ({
  id: w.id,
  text: w.text,
  date: w.date,
  win_date: w.win_date,
  // <img> can't send the bearer header, so the token rides the query string.
  photo: w.photo_url ? w.photo_url + "?token=" + encodeURIComponent(api.getToken() || "") : null,
  likes: w.likes,
  liked: w.liked,
  private: w.is_private,
  comments: (w.comments || []).map((c) => ({
    id: c.id,
    author: c.author_is_me ? "you" : c.author_number,
    text: c.text,
  })),
});

const mapInstantCard = (c) => ({
  id: c.id,
  author: c.author_number,
  handle: c.author_handle || undefined,
  streak: c.streak,
  time: c.time,
  retakes: c.retakes,
  win: c.caption || "",
  viewed: c.viewed,
  // Cover gradients are decorative; derive stable hues from the id.
  hue: (c.id * 47) % 360,
  hue2: (c.id * 101) % 360,
});

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

  // ── Identity: the server session is the single source of truth ──
  const [me, setMe] = useState(null);
  const [booting, setBooting] = useState(() => !!api.getToken());
  const authed = !!me;
  const onboarded = !!me && me.onboarded;
  const mySubs = me ? me.subs_count : 0;

  // ── Server data ──
  const [promptItems, setPromptItems] = useState([]);
  const [promptIdx, setPromptIdx] = useState(0);
  const [feed, setFeed] = useState(null);              // active prompt's notes feed
  const [unlockAts, setUnlockAts] = useState({});      // prompt id -> ms timestamp
  const [wins, setWins] = useState([]);
  const [summary, setSummary] = useState(null);        // { streak, logged_dates, ... }
  const [myInstant, setMyInstant] = useState(null);    // { photo, retakes, takenAt }
  const [exploreCards, setExploreCards] = useState([]);
  const [promptSuggestions, setPromptSuggestions] = useState([]);
  const [strangerProfile, setStrangerProfile] = useState(null);

  const [editWin, setEditWin] = useState(null);
  const [winDraft, setWinDraft] = useState("");
  const [winMenu, setWinMenu] = useState(null);
  const [showPromptArchive, setShowPromptArchive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestDraft, setSuggestDraft] = useState("");
  const [viewer, setViewer] = useState(null);          // { instant, burn }

  const flashToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const resetLocal = useCallback(() => {
    setMe(null);
    setPromptItems([]);
    setPromptIdx(0);
    setFeed(null);
    setUnlockAts({});
    setWins([]);
    setSummary(null);
    setMyInstant(null);
    setExploreCards([]);
    setPromptSuggestions([]);
    setStrangerProfile(null);
    setViewer(null);
    setTab("home");
  }, []);

  const logOut = useCallback(() => {
    api.clearToken();
    resetLocal();
  }, [resetLocal]);

  // ── Boot: restore the session from the stored token ──
  useEffect(() => {
    api.setOnUnauthorized(() => resetLocal());
    if (!api.getToken()) return;
    api.getMe()
      .then(setMe)
      .catch(() => api.clearToken())
      .finally(() => setBooting(false));
  }, [resetLocal]);

  // ── Load everything once the user is in ──
  const refreshWins = useCallback(() => {
    api.getMyWins().then((list) => setWins(list.map(mapWin))).catch(() => {});
    api.getWinsSummary().then(setSummary).catch(() => {});
  }, []);

  const refreshMyInstant = useCallback(() => {
    api.getMyInstantToday()
      .then((r) => setMyInstant({ photo: r.photo, retakes: r.retakes, takenAt: parseUTC(r.taken_at) }))
      .catch(() => setMyInstant(null));
  }, []);

  const refreshMe = useCallback(() => {
    api.getMe().then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (!onboarded) return;
    // Fetch the full archive (not just the carousel's last-7-days window) —
    // weekItems below still slices to 7 for the carousel, but PromptArchive
    // needs the rest or "Past prompts" just duplicates the carousel.
    api.getPromptArchive(50).then((prompts) => setPromptItems(mapPromptItems(prompts))).catch(() => {});
    api.getMyNotes().then((notes) => {
      const map = {};
      notes.forEach((n) => { map[n.prompt_id] = Math.max(map[n.prompt_id] || 0, parseUTC(n.unlock_at)); });
      setUnlockAts(map);
    }).catch(() => {});
    refreshWins();
    refreshMyInstant();
  }, [onboarded, refreshWins, refreshMyInstant]);

  // Active prompt follows the carousel; the feed follows the active prompt.
  const weekItems = useMemo(() => promptItems.filter((p) => p.offset <= 6), [promptItems]);
  const activePrompt = weekItems.length ? weekItems[Math.min(promptIdx, weekItems.length - 1)] : null;

  const refreshFeed = useCallback((promptId) => {
    api.getNotesFeed(promptId)
      .then((f) => setFeed({ ...f, notes: f.notes.map(mapNote) }))
      .catch(() => setFeed(null));
  }, []);

  useEffect(() => {
    if (!onboarded || !activePrompt) return;
    setFeed(null);
    refreshFeed(activePrompt.id);
  }, [onboarded, activePrompt && activePrompt.id, refreshFeed]);

  // Explore stack loads when the tab opens.
  useEffect(() => {
    if (!onboarded || tab !== "explore") return;
    api.getExplore().then((cards) => setExploreCards(cards.map(mapInstantCard))).catch(() => {});
  }, [onboarded, tab]);

  // Suggestions list loads when the modal opens.
  useEffect(() => {
    if (!suggestOpen || !onboarded) return;
    api.getMySuggestions().then(setPromptSuggestions).catch(() => {});
  }, [suggestOpen, onboarded]);

  const composeUnlockAt = activePrompt ? (unlockAts[activePrompt.id] || 0) : 0;

  // ── Auth flows ──
  const authenticate = async (mode, { email, password }) => {
    const { token, user } = mode === "signup"
      ? await api.signup(email, password)
      : await api.login(email, password);
    api.setToken(token);
    setMe(user);
  };

  const completeOnboarding = async (handle, prefs = {}) => {
    const user = await api.completeOnboarding(
      handle,
      prefs.winsPublic !== false,
      !!prefs.profilePrivate,
    );
    setMe(user);
  };

  const saveDetails = async ({ handle, email }) => {
    const user = await api.updateMe({ handle, email });
    setMe(user);
    flashToast("Details updated 🌿");
  };

  const deleteAccount = async () => {
    try {
      await api.deleteMe();
    } catch { /* fallthrough — log out regardless */ }
    logOut();
  };

  const toggleWinsName = () => {
    api.updateMe({ wins_name_public: !me.wins_name_public }).then(setMe).catch(() => {});
  };
  const toggleProfilePrivate = () => {
    api.updateMe({ profile_private: !me.profile_private }).then(setMe).catch(() => {});
  };

  // ── Prompt suggestions ──
  const submitPromptSuggestion = async () => {
    const text = suggestDraft.trim();
    if (!text) return;
    try {
      await api.suggestPrompt(text);
      setSuggestDraft("");
      api.getMySuggestions().then(setPromptSuggestions).catch(() => {});
      flashToast("Sent for review — admins approve prompts before they go live 🌿");
    } catch (e) {
      flashToast(e.message || "Couldn't send that suggestion");
    }
  };

  // ── Notes ──
  const pickFromBowl = () => {
    if (!activePrompt) return;
    if (mySubs < 1) {
      flashToast("Share a note first to reach into the bowl");
      setTab("compose");
      return;
    }
    setPicking(true);
    const started = Date.now();
    api.getRandomNote(activePrompt.id)
      .then((n) => {
        const wait = Math.max(0, 2000 - (Date.now() - started));
        setTimeout(() => { setPicking(false); setOpenNote(mapNote(n)); }, wait);
      })
      .catch((e) => {
        setPicking(false);
        flashToast(e.status === 404 ? "The bowl is empty for this prompt" : e.message);
      });
  };

  const submitNote = async ({ cat, text, title }) => {
    if (!activePrompt || composeUnlockAt > Date.now()) return;
    setDropping(true);
    try {
      await api.createNote({
        promptId: activePrompt.id,
        title: title || undefined,
        content: text,
        category: cat,
      });
      setUnlockAts((m) => ({ ...m, [activePrompt.id]: Date.now() + DAY_MS }));
      refreshFeed(activePrompt.id);
      refreshMe();
      setTab("home");
      flashToast("Your note is in the bowl ✨");
    } catch (e) {
      if (e.status === 409 && e.detail && e.detail.unlock_at) {
        setUnlockAts((m) => ({ ...m, [activePrompt.id]: parseUTC(e.detail.unlock_at) }));
        flashToast("You've already shared this prompt today");
      } else {
        flashToast(e.message || "Your note couldn't be shared");
      }
    } finally {
      setDropping(false);
    }
  };

  const toggleLikeNote = (note) => {
    const call = note.liked ? api.unlikeNote : api.likeNote;
    call(note.id).then((r) => {
      const patch = (n) => n.id === note.id ? { ...n, likes: r.likes, liked: r.liked } : n;
      setFeed((f) => f ? { ...f, notes: f.notes.map(patch) } : f);
      setOpenNote((n) => n && n.id === note.id ? patch(n) : n);
    }).catch(() => {});
  };

  // ── Wins ──
  const submitWin = async ({ text, photo, retakes }) => {
    try {
      const win = await api.createWin({ text, photo, retakes: retakes || 0 });
      setWins((prev) => [mapWin(win), ...prev]);
      api.getWinsSummary().then(setSummary).catch(() => {});
      refreshMe();
      if (photo) setMyInstant({ photo, retakes: retakes || 0, takenAt: Date.now() });
      setTab("wins");
      flashToast(photo ? "Win logged — your instant is up ✨" : "Win logged 🌿");
    } catch (e) {
      flashToast(e.message || "Your win couldn't be saved");
    }
  };

  const openEditWin = (w) => { setEditWin(w); setWinDraft(w.text); };
  const updateWin = () => {
    api.updateWin(editWin.id, { text: winDraft.trim() }).then((w) => {
      setWins((prev) => prev.map((x) => x.id === w.id ? mapWin(w) : x));
      setEditWin(null);
      flashToast("Win updated");
    }).catch((e) => flashToast(e.message || "Couldn't update that win"));
  };
  const removeWin = (id, close) => {
    api.deleteWin(id).then(() => {
      setWins((prev) => prev.filter((w) => w.id !== id));
      api.getWinsSummary().then(setSummary).catch(() => {});
      refreshMe();
      close();
      flashToast("Win removed");
    }).catch((e) => flashToast(e.message || "Couldn't remove that win"));
  };
  const toggleLikeWin = (id) => {
    const win = wins.find((w) => w.id === id);
    if (!win) return;
    const call = win.liked ? api.unlikeWin : api.likeWin;
    call(id).then((w) => {
      setWins((prev) => prev.map((x) => x.id === id ? mapWin(w) : x));
    }).catch(() => {});
  };
  const commentOnWin = (id, text) => {
    api.commentOnWin(id, text).then((w) => {
      setWins((prev) => prev.map((x) => x.id === id ? mapWin(w) : x));
    }).catch((e) => flashToast(e.message || "Couldn't add that comment"));
  };
  const togglePrivateWin = () => {
    const target = winMenu;
    api.updateWin(target.id, { is_private: !target.private }).then((w) => {
      setWins((prev) => prev.map((x) => x.id === w.id ? mapWin(w) : x));
      flashToast(target.private ? "Post is public again" : "Post set to private — only you can see it");
      setWinMenu(null);
    }).catch((e) => flashToast(e.message || "Couldn't update that win"));
  };

  // ── Instants ──
  const postInstant = async ({ photo, retakes }) => {
    try {
      await api.captureInstant({ photo, retakes });
      setMyInstant({ photo, retakes, takenAt: Date.now() });
      setTab("wins");
      flashToast("Your instant is up ✨");
    } catch (e) {
      setTab("wins");
      flashToast(e.status === 409 ? "You've already captured today's instant" : (e.message || "Couldn't post that instant"));
    }
  };

  const markCardViewed = (id) => {
    setExploreCards((cards) => cards.map((c) => c.id === id ? { ...c, viewed: true } : c));
  };

  const openInstant = (inst) => {
    api.viewInstant(inst.id)
      .then((r) => {
        markCardViewed(inst.id);
        setViewer({ instant: { ...inst, photo: r.photo, win: r.caption || inst.win }, burn: true });
      })
      .catch((e) => {
        markCardViewed(inst.id);
        flashToast(e.status === 410 ? "Gone — instants play once" : (e.message || "Couldn't open that instant"));
      });
  };

  const seenInstant = (inst) => {
    // Swiping past consumes the single view, same as opening it.
    markCardViewed(inst.id);
    api.viewInstant(inst.id).catch(() => {});
  };

  const likeInstant = (inst) => {
    api.likeInstant(inst.id).catch(() => {});
    flashToast("Sent a little love to " + (inst.handle || "@" + inst.author) + " ✨");
  };

  const reportInstant = (inst, reason) => {
    api.reportInstant(inst.id, reason || "Sensitive content").catch(() => {});
    markCardViewed(inst.id);
    flashToast("Report sent — thank you 🌿");
  };

  const openStranger = (author) => {
    setOpenNote(null);
    setStrangerProfile(null);
    setTab("stranger");
    api.getStrangerProfile(author)
      .then(setStrangerProfile)
      .catch(() => { setTab("explore"); flashToast("Couldn't load that profile"); });
  };

  // ── Derived view data ──
  const todayNow = new Date();
  const todayStr = MONTHS_SHORT[todayNow.getMonth()] + " " + todayNow.getDate();
  const todayWin = wins.find((w) => w.date === todayStr) || null;
  const streak = summary ? summary.streak : 0;
  const logSet = useMemo(() => {
    const set = new Set();
    (summary ? summary.logged_dates : []).forEach((d) => {
      set.add(new Date(d + "T00:00:00").toDateString());
    });
    return set;
  }, [summary]);

  const mineAsInstant = myInstant ? {
    id: "mine", author: me ? me.number : 0, handle: me ? me.handle : undefined,
    streak,
    time: fmtClock(myInstant.takenAt),
    win: todayWin ? todayWin.text : "",
    retakes: myInstant.retakes,
    photo: myInstant.photo,
  } : null;

  const viewedInstantIds = exploreCards.filter((c) => c.viewed).map((c) => c.id);

  // Apply theme + accent + note styling to the document root.
  // Explore always presents in dark, over a black page background.
  const effTheme = tab === "explore" ? "dark" : t.theme;
  useEffect(() => {
    document.documentElement.dataset.theme = effTheme;
    document.documentElement.dataset.accent = t.accent;
    document.documentElement.dataset.noteFont = t.noteFont;
    document.documentElement.dataset.notePalette = t.notePalette;
  }, [effTheme, t.accent, t.noteFont, t.notePalette]);

  // ── Bottom nav handler ──
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

  const activeTabKey =
    tab === "compose" ? "create" :
    tab === "home" ? "home" :
    tab === "explore" ? "explore" :
    tab === "donate" ? "donate" :
    tab === "wins" ? "wins" :
    tab === "profile" ? "profile" :
    tab === "addwin" ? "wins" :
    tab === "capture" ? "wins" :
    tab === "stranger" ? "home" :
    tab === "settings" ? "profile" :
    tab === "feed" ? "home" : "home";

  if (booting) {
    return <div className="app" data-theme={t.theme} data-accent={t.accent}></div>;
  }

  return (
    <div className="app" data-theme={effTheme} data-accent={t.accent} data-black={tab === "explore" ? "1" : undefined}>
      {!authed && <AuthScreen onAuth={authenticate} />}
      {authed && !onboarded && (
        <OnboardingScreen
          onComplete={completeOnboarding}
          number={me.number}
          checkHandle={(h) => api.handleCheck(h).then((r) => r.available)}
        />
      )}
      <div className="screen-wrap">
        {tab === "home" && (
          <HomeScreen
            promptItems={promptItems}
            promptIdx={promptIdx}
            onPromptIdx={setPromptIdx}
            bowlMode={t.bowl}
            feed={feed}
            mySubs={mySubs}
            unlockAt={composeUnlockAt}
            onPickFromBowl={pickFromBowl}
            onOpenCompose={() => setTab("compose")}
            onOpenFeed={() => setTab("feed")}
            onOpenNote={(n) => setOpenNote(n)}
            onOpenMenu={() => setMenuOpen(true)}
            onSuggestPrompt={() => setSuggestOpen(true)}
          />
        )}
        {tab === "feed" && (
          <FeedScreen
            notes={feed ? feed.notes : []}
            onBack={() => setTab("home")}
            onOpenNote={(n) => setOpenNote(n)}
          />
        )}
        {tab === "compose" && (
          <ComposeScreen
            prompt={activePrompt ? activePrompt.text : ""}
            onBack={() => setTab("home")}
            onSubmit={submitNote}
            unlockAt={composeUnlockAt}
          />
        )}
        {tab === "wins" && (
          <WinsScreen
            wins={wins}
            streak={streak}
            logSet={logSet}
            onAdd={() => setTab("addwin")}
            todayWin={todayWin}
            myInstant={myInstant}
            perspective="owner"
            viewedMine={false}
            onCapture={() => setTab("capture")}
            onEditWin={openEditWin}
            onLikeWin={toggleLikeWin}
            onCommentWin={commentOnWin}
            onWinMenu={(w) => setWinMenu(w)}
            onViewMine={() => setViewer({ instant: mineAsInstant, burn: false })}
          />
        )}
        {tab === "profile" && me && (
          <ProfileScreen
            handle={me.handle || ""}
            number={me.number}
            subs={mySubs}
            winsCount={wins.length}
            streak={streak}
            winsNamePublic={me.wins_name_public}
            onToggleWinsName={toggleWinsName}
            profilePrivate={me.profile_private}
            onToggleProfilePrivate={toggleProfilePrivate}
            onOpenMenu={() => setMenuOpen(true)}
            onOpenArchive={() => setShowPromptArchive(true)}
            onOpenWins={() => setTab("wins")}
            onOpenSettings={() => setTab("settings")}
            onLogout={logOut}
            theme={t.theme}
            accent={t.accent}
            onSetTheme={(v) => setAppearance("theme", v)}
            onSetAccent={(v) => setAppearance("accent", v)}
          />
        )}
        {tab === "settings" && me && (
          <SettingsScreen
            handle={me.handle || ""}
            number={me.number}
            email={me.email}
            winsNamePublic={me.wins_name_public}
            onToggleWinsName={toggleWinsName}
            profilePrivate={me.profile_private}
            onToggleProfilePrivate={toggleProfilePrivate}
            onBack={() => setTab("profile")}
            onSave={saveDetails}
            onDelete={deleteAccount}
            checkHandle={(h) => api.handleCheck(h).then((r) => r.available)}
          />
        )}
        {tab === "explore" && (
          <ExploreScreen
            onOpenMenu={() => setMenuOpen(true)}
            instants={exploreCards}
            viewedInstants={viewedInstantIds}
            onOpenInstant={openInstant}
            onSeenInstant={seenInstant}
            onLikeInstant={likeInstant}
            onReportInstant={reportInstant}
            onOpenStranger={openStranger}
          />
        )}
        {tab === "donate" && (
          <DonationScreen
            onOpenMenu={() => setMenuOpen(true)}
            onDonate={(amountPence, freq) => api.recordDonation(amountPence, freq)}
          />
        )}
        {tab === "addwin" && (
          <AddWinScreen
            onBack={() => setTab("wins")}
            onSubmit={submitWin}
          />
        )}
        {tab === "capture" && (
          <CaptureInstantScreen
            winToday={todayWin}
            frame={INSTANT_FRAME}
            onBack={() => setTab("wins")}
            onPost={postInstant}
          />
        )}
        {tab === "stranger" && (() => {
          if (!strangerProfile) {
            return (
              <div className="screen screen-enter">
                <div className="feed-empty" style={{ marginTop: 80 }}>Loading…</div>
              </div>
            );
          }
          const p = strangerProfile;
          const inst = p.has_instant_today ? {
            id: p.instant_id,
            author: p.number,
            handle: p.handle || undefined,
            streak: p.streak,
            time: p.instant_time || "",
          } : null;
          return (
            <StrangerWinsScreen
              author={p.number}
              instant={inst}
              viewed={p.instant_viewed}
              onBack={() => setTab("explore")}
              onOpen={() => inst && openInstant(inst)}
            />
          );
        })()}

        {/* Picking-from-the-bowl loader */}
        {picking && (
          <div className="pick-overlay">
            <div className="pick-spinner"></div>
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

        {/* Suggest-a-prompt modal — submissions are admin-approved before going live */}
        {suggestOpen && (
          <div className="modal-backdrop" onClick={() => setSuggestOpen(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setSuggestOpen(false)} aria-label="Close">
                <Icon.X />
              </button>
              <div className="win-menu-title">Suggest a prompt</div>
              <textarea
                className="edit-win-input"
                rows={2}
                maxLength={120}
                placeholder="What should Pondr ask everyone?"
                value={suggestDraft}
                onChange={(e) => setSuggestDraft(e.target.value)}
              ></textarea>
              <div className="edit-win-count">{suggestDraft.length}/120</div>
              <button
                className="primary-btn sm"
                style={{ width: "100%" }}
                disabled={suggestDraft.trim().length < 8}
                onClick={submitPromptSuggestion}>
                Submit for review
              </button>
              <p className="suggest-note"><Icon.Shield size={13} /> Prompts go live only after an admin approves them.</p>
              {promptSuggestions.length > 0 && (
                <div className="suggest-list">
                  <div className="win-menu-title">Your suggestions</div>
                  {promptSuggestions.map((s) => (
                    <div key={s.id} className="suggest-row">
                      <span className="txt">{s.text}</span>
                      <span className={"suggest-status " + s.status}>
                        {s.status === "approved" ? "Approved" : s.status === "rejected" ? "Not approved" : "Pending review"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Win "..." menu */}
        {winMenu && (
          <div className="modal-backdrop" onClick={() => setWinMenu(null)}>
            <div className="modal-card win-menu-card" onClick={(e) => e.stopPropagation()}>
              <div className="win-menu-title">{winMenu.date} · win</div>
              <button className="win-menu-item" onClick={() => { const w = winMenu; setWinMenu(null); openEditWin(w); }}>
                <Icon.Pencil size={16} /> Update description
              </button>
              <button className="win-menu-item" onClick={togglePrivateWin}>
                {winMenu.private ?
                  <React.Fragment><Icon.Eye size={16} /> Make public</React.Fragment> :
                  <React.Fragment><Icon.Lock size={16} /> Make private</React.Fragment>
                }
              </button>
              <button className="win-menu-item danger" onClick={() => removeWin(winMenu.id, () => setWinMenu(null))}>
                <Icon.Trash size={16} /> Delete post
              </button>
            </div>
          </div>
        )}

        {/* Edit-win modal */}
        {editWin && (
          <div className="modal-backdrop" onClick={() => setEditWin(null)}>
            <div className="modal-card edit-win-card" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setEditWin(null)} aria-label="Close">
                <Icon.X />
              </button>
              <div className="edit-win-date">{editWin.date}</div>
              <textarea
                className="edit-win-input"
                value={winDraft}
                maxLength={140}
                rows={3}
                onChange={(e) => setWinDraft(e.target.value)}
              ></textarea>
              <div className="edit-win-count">{winDraft.length}/140</div>
              <div className="edit-win-actions">
                <button className="edit-win-delete" onClick={() => removeWin(editWin.id, () => setEditWin(null))}>
                  <Icon.Trash size={15} /> Delete
                </button>
                <button className="primary-btn sm" disabled={!winDraft.trim()} onClick={updateWin}>
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Read-note modal */}
        {openNote && (
          <div className="modal-backdrop" onClick={() => setOpenNote(null)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <button className="close" onClick={() => setOpenNote(null)} aria-label="Close">
                <Icon.X />
              </button>
              <p className="body">{openNote.body}</p>
              {/* Notes never display a username — the author's ID tag stays on the
                  post data (openNote.author) for security & data integrity only. */}
              <div className="modal-author">
                <span className="author-name anon"><Icon.EyeOff size={13} /> Anonymous</span>
              </div>
              <div className="meta modal-meta">
                {openNote.when}
              </div>
              <div className="actions">
                <button className={openNote.liked ? "on" : ""} onClick={() => toggleLikeNote(openNote)}>
                  <Icon.Heart size={16} filled={!!openNote.liked} /> {openNote.likes || 0}
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

        {/* View-once instant viewer */}
        {viewer && viewer.instant && (
          <InstantViewer
            instant={viewer.instant}
            mode={INSTANT_VIEW}
            seconds={INSTANT_SECONDS}
            overlay={INSTANT_OVERLAY}
            burn={viewer.burn}
            myHandle={me ? me.handle : null}
            onReport={(reason) => {
              reportInstant(viewer.instant, reason);
              setViewer(null);
            }}
            onDone={() => {
              if (viewer.burn) {
                markCardViewed(viewer.instant.id);
                flashToast("Gone — instants play once");
              }
              setViewer(null);
            }}
            onCancel={() => setViewer(null)}
          />
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
                <span className="author-name">{me ? me.handle : ""}</span>
                <span className="author-token mine">@{me ? me.number : ""}</span>
              </div>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); setShowPromptArchive(true); }}>
                <Icon.Book size={18} /> <span>Past prompts</span>
              </button>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); setTab("wins"); }}>
                <Icon.Trophy size={18} /> <span>Your wins</span>
              </button>
              <button className="drawer-item" onClick={() => { setMenuOpen(false); setTab("settings"); }}>
                <Icon.Gear size={18} /> <span>Settings</span>
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

      {/* Floating add-win button (wins only) — camera when today's instant is unlocked */}
      {tab === "wins" && (
        <button
          className="fab-compose"
          onClick={() => (todayWin && !myInstant ? setTab("capture") : setTab("addwin"))}
          aria-label={todayWin && !myInstant ? "Capture today's instant" : "Add a win"}>
          {todayWin && !myInstant ? <Icon.Camera size={26} /> : <Icon.PlusBare size={28} />}
        </button>
      )}

      {/* Bottom nav */}
      <nav className="tabbar">
        <TabBtn icon={<Icon.Home filled={activeTabKey === "home"} />} label="Home"
                active={activeTabKey === "home"} onClick={() => handleTab("home")} />
        <TabBtn icon={<Icon.Compass filled={activeTabKey === "explore"} />} label="Explore"
                active={activeTabKey === "explore"} onClick={() => setTab("explore")} />
        <TabBtn icon={<Icon.Trophy filled={activeTabKey === "wins"} />} label="Wins"
                active={activeTabKey === "wins"} onClick={() => handleTab("wins")} />
        <TabBtn icon={<Icon.Heart filled={activeTabKey === "donate"} />} label="Donate"
                active={activeTabKey === "donate"} onClick={() => setTab("donate")} />
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
