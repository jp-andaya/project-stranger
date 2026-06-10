// screens.jsx — Auth, Onboarding, Home, Feed, Compose, Wins, AddWin,
// Profile, Explore, Donation, PromptArchive. Ported from the design handoff
// (pondr-screens.jsx); browser-Babel globals replaced with ES imports and the
// `window.MY_HANDLE` read replaced by a `myHandle` prop on ComposeScreen.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './icons.jsx';
import { Bowl, BowlPhoto, Plant } from './Bowl.jsx';
import {
  PROMPTS, CATEGORIES, ADJECTIVES, CREATURES, MY_NUMBER,
  FREE_NOTES, UNLOCK_SUBS, WIN_ICONS,
} from './data.js';

// ───────────── Shared bits ─────────────
function TopBar({ title, subtitle, left, right, wordmark }) {
  return (
    <div className="topbar">
      {left}
      {wordmark ?
        <div className="wordmark">{wordmark}</div> :
        <div className="topbar-stack">
          <div className="topbar-title">{title}</div>
          {subtitle && <div className="topbar-sub">{subtitle}</div>}
        </div>
      }
      {right}
    </div>
  );
}

function NoteCard({ note, onClick, compact = false, index = 0 }) {
  return (
    <button className={"note-card nt-" + (index % 5)} onClick={onClick} style={{ textAlign: 'left', width: '100%' }}>
      <Icon.Sparkle4 size={12} />
      <span className="spark"><Icon.Sparkle4 size={12} /></span>
      <span className="chip">{note.cat}</span>
      <p className="body" style={{
        display: '-webkit-box',
        WebkitLineClamp: compact ? 4 : 8,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>{note.body}</p>
      <div className="meta">{note.when}</div>
    </button>
  );
}

// Home feed card — headline + body (identity is shown in the note view)
function FeedNoteCard({ note, onClick, index = 0 }) {
  return (
    <button className={"feed-note nt-" + (index % 5)} onClick={onClick}>
      <span className="feed-note-spark"><Icon.Sparkle4 size={12} /></span>
      <h4 className="feed-note-title">{note.title || note.body}</h4>
      <p className="feed-note-body">{note.body}</p>
      <div className="feed-note-foot">
        <span className="feed-note-meta">{note.when}</span>
        <span className="feed-note-more" aria-label="Read more"><Icon.Dots size={18} /></span>
      </div>
    </button>
  );
}

// ───────────── Home ─────────────

// Relative time label: under a day → hours (Xh ago) · then N days ago · then date
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function relativeLabel(date) {
  const ms = Date.now() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + "m ago";
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days <= 6) return days + (days === 1 ? " day ago" : " days ago");
  if (days <= 13) return "1 week ago";
  return MONTHS[date.getMonth()] + " " + date.getDate();
}

// Build a dated prompt for each day, newest first. Today's prompt posts a few
// hours ago, so it reads "Xh ago" and older ones read "N days ago".
export function buildPromptItems() {
  const DAY = 24 * 3600000;
  const base = Date.now() - 4 * 3600000; // today's prompt ~4h old
  return PROMPTS.map((text, i) => {
    const d = new Date(base - i * DAY);
    return { text, offset: i, date: d, label: relativeLabel(d) };
  });
}

const DAY_MS = 24 * 3600000;
function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p2 = (n) => String(n).padStart(2, "0");
  return p2(h) + ":" + p2(m) + ":" + p2(sec);
}

// Home-screen card: "you've already shared this prompt" + live countdown
function ShareTimerCard({ unlockAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (unlockAt <= now) return null;
  return (
    <div className="share-timer">
      <div className="share-timer-top">
        <div className="share-timer-icon"><Icon.Check size={15} /></div>
        <span className="share-timer-lab">You've shared for this prompt</span>
      </div>
      <span className="share-timer-sub">You can share again in</span>
      <div className="share-timer-clock">{fmtCountdown(unlockAt - now)}</div>
    </div>
  );
}

function PromptCard({ item }) {
  return (
    <div className="prompt-card">
      <span className="spark" style={{ top: 20, left: 18 }}><Icon.Sparkle4 size={10} /></span>
      <span className="spark" style={{ top: 50, right: 22 }}><Icon.Sparkle4 size={14} /></span>
      <span className="spark" style={{ bottom: 18, left: 32 }}><Icon.Sparkle4 size={9} /></span>
      <span className="spark" style={{ bottom: 30, right: 38 }}><Icon.Sparkle4 size={9} /></span>
      <span className="prompt-date-badge">{item.label}</span>
      <div className="star"><Icon.Sparkle size={20} /></div>
      <div className="prompt-eyebrow">Prompt of the day</div>
      <h2 className="prompt-text">{item.text}</h2>
    </div>
  );
}

function PromptCarousel({ items, idx, onChange }) {
  const [drag, setDrag] = useState(0);
  const startX = useRef(null);
  const n = items.length;
  const go = (d) => onChange((idx + d + n) % n); // wraps — looping

  const down = (e) => { startX.current = e.clientX; };
  const move = (e) => {
    if (startX.current == null) return;
    setDrag(e.clientX - startX.current);
  };
  const up = () => {
    if (startX.current == null) return;
    if (drag < -45) go(1);
    else if (drag > 45) go(-1);
    startX.current = null;
    setDrag(0);
  };

  return (
    <div className="prompt-feature">
      <div
        className="prompt-stage"
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}>
        <div
          className="prompt-swipe"
          style={{
            transform: `translateX(${drag}px)`,
            transition: startX.current == null ? 'transform 240ms cubic-bezier(.22,.61,.36,1)' : 'none'
          }}>
          <PromptCard key={idx} item={items[idx]} />
        </div>
      </div>
      <div className="prompt-nav">
        <div className="carousel-dots">
          {items.map((_, i) =>
            <button
              key={i}
              className={"dot" + (i === idx ? " active" : "")}
              onClick={() => onChange(i)}
              aria-label={"Prompt " + (i + 1)} />
          )}
        </div>
      </div>
    </div>
  );
}

// A blurred, skewed peek of the next locked note with a lock overlay + info
function LockedPeek({ peek, hiddenCount, mySubs, onCompose }) {
  const pct = Math.min(100, Math.round((mySubs / UNLOCK_SUBS) * 100));
  return (
    <div className="feed-peek">
      <div className="feed-peek-card" aria-hidden="true">
        {peek && <FeedNoteCard note={peek} index={3} />}
      </div>
      <div className="feed-peek-overlay">
        <div className="feed-lock-icon peek-lock"><Icon.Lock size={32} /></div>
        <p className="feed-peek-msg">Share your own story to help open the full list for everyone.</p>
        <div className="feed-lock-prog">
          <div className="feed-lock-bar"><span style={{ width: pct + "%" }} /></div>
          <span className="feed-lock-count">{Math.min(mySubs, UNLOCK_SUBS)} / {UNLOCK_SUBS} shared</span>
        </div>
      </div>
    </div>
  );
}

export function HomeScreen({ promptItems, bowlMode, notes, mySubs, myPosts, onPickFromBowl, onOpenCompose, onOpenFeed, onOpenNote, onOpenMenu }) {
  const [promptIdx, setPromptIdx] = useState(0);
  // Carousel only spans the last week; older prompts live in the archive.
  const weekItems = promptItems.filter((p) => p.offset <= 6);
  const activePrompt = weekItems[Math.min(promptIdx, weekItems.length - 1)];
  const shownNotes = notes.filter((n) => n.prompt === activePrompt.text);

  // Contribute-to-unlock gate
  const unlockedAll = mySubs >= UNLOCK_SUBS;
  const hasShared = mySubs >= 1;
  const visibleNotes = !hasShared ? [] : unlockedAll ? shownNotes : shownNotes.slice(0, FREE_NOTES);
  const hiddenCount = shownNotes.length - visibleNotes.length;
  const activeUnlockAt = myPosts && myPosts[activePrompt.text] ? myPosts[activePrompt.text] + DAY_MS : 0;
  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Pondr"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      {/* Prompt carousel — looping; the feed below follows the active prompt */}
      <PromptCarousel items={weekItems} idx={Math.min(promptIdx, weekItems.length - 1)} onChange={setPromptIdx} />

      {/* Bowl scene */}
      <div className="bowl-scene">
        <span className="sparkle" style={{ top: 30, left: 92 }}><Icon.Sparkle4 size={11} /></span>
        <span className="sparkle" style={{ top: 60, right: 88 }}><Icon.Sparkle4 size={9} /></span>
        <span className="sparkle" style={{ top: 16, left: 132 }}><Icon.Sparkle4 size={7} /></span>
        <span className="sparkle" style={{ top: 100, right: 32 }}><Icon.Sparkle4 size={8} /></span>
        <span className="sparkle" style={{ top: 90, left: 32 }}><Icon.Sparkle4 size={9} /></span>

        <div className={"bowl-wrap" + (!hasShared ? " bowl-locked" : "")} onClick={onPickFromBowl} role="button" aria-label="Reach into the bowl">
          {bowlMode === "photo" ?
            <BowlPhoto /> :
            <Bowl />
          }
          {!hasShared &&
            <div className="bowl-lock">
              <div className="bowl-lock-box">
                <div className="feed-lock-icon"><Icon.Lock size={24} /></div>
                <p className="bowl-lock-msg">Drop a note of your own to unlock the bowl.</p>
              </div>
            </div>
          }
        </div>
      </div>

      {/* You've-already-shared countdown (moved here from Compose) */}
      <ShareTimerCard unlockAt={activeUnlockAt} />

      {/* Notes feed — responses to the active prompt */}
      {(shownNotes.length === 0 || hasShared) &&
        <React.Fragment>
          <h3 className="section-title">Notes from Strangers</h3>

          <div className="feed-column">
            {shownNotes.length === 0 ?
              <div className="feed-empty">No responses yet — be the first to drop one.</div> :
              <React.Fragment>
                {visibleNotes.map((n, i) =>
                  <FeedNoteCard key={n.id} note={n} index={i} onClick={() => onOpenNote(n)} />
                )}
                {hiddenCount > 0 &&
                  <LockedPeek peek={shownNotes[FREE_NOTES]} hiddenCount={hiddenCount} mySubs={mySubs} onCompose={onOpenCompose} />
                }
              </React.Fragment>
            }
          </div>

          {hasShared && shownNotes.length > 0 && hiddenCount === 0 &&
            <div className="feed-footer">
              <Icon.Sparkle4 size={10} /> You've reached the end of your feed — well done! <Icon.Sparkle4 size={10} />
            </div>
          }
        </React.Fragment>
      }
    </div>
  );
}

// ───────────── Notes from Strangers — feed ─────────────
export function FeedScreen({ notes, onBack, onOpenNote }) {
  const [activeCat, setActiveCat] = useState("All");
  const [showFilter, setShowFilter] = useState(false);

  const filtered = useMemo(() =>
    activeCat === "All" ? notes : notes.filter((n) => n.cat === activeCat),
    [activeCat, notes]);

  return (
    <div className="screen screen-enter">
      <TopBar
        title="Notes from Strangers"
        subtitle="Thoughts shared by others"
        left={
          <button className="icon-btn left" onClick={onBack} aria-label="Back">
            <Icon.ArrowLeft />
          </button>
        }
        right={
          <button
            className={"icon-btn right" + (showFilter ? " active" : "")}
            onClick={() => setShowFilter((v) => !v)}
            aria-label="Filter">
            <Icon.Filter />
          </button>
        } />

      {showFilter &&
        <div className="chip-row" style={{ animation: 'screenIn 220ms both' }}>
          {["All", ...CATEGORIES].map((c) =>
            <button
              key={c}
              className={"chip-btn" + (c === activeCat ? " active" : "")}
              onClick={() => setActiveCat(c)}>
              {c}</button>
          )}
        </div>
      }

      <div className="feed-grid">
        {filtered.map((n, i) =>
          <NoteCard key={n.id} note={n} index={i} onClick={() => onOpenNote(n)} />
        )}
      </div>

      <div className="feed-footer">
        <Icon.Sparkle4 size={10} /> You've reached the end of your feed — well done! <Icon.Sparkle4 size={10} />
      </div>
    </div>
  );
}

// ───────────── Compose / Drop a note ─────────────
export function ComposeScreen({ prompt, onBack, onSubmit, defaultAnon = false, unlockAt = 0, myHandle }) {
  const [cat, setCat] = useState("Reflection");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [anon, setAnon] = useState(defaultAnon);
  const [now, setNow] = useState(Date.now());
  const max = 280;
  const locked = unlockAt > now;
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [locked]);
  const fmt = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const p2 = (x) => String(x).padStart(2, "0");
    return p2(h) + ":" + p2(m) + ":" + p2(sec);
  };

  return (
    <div className="screen screen-enter">
      <TopBar
        title="Drop a note"
        subtitle="Share anonymously"
        left={
          <button className="icon-btn left" onClick={onBack}>
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="compose-card">
        <div className="body">
          <div className="compose-prompt-eyebrow">Prompt of the day</div>
          <h2 className="compose-prompt-text">{prompt}</h2>

          {locked ?
            <div className="feed-lock" style={{ margin: "6px 0 0" }}>
              <div className="feed-lock-icon"><Icon.Lock size={22} /></div>
              <h4>You've shared for this prompt</h4>
              <p>One note per prompt each day. You can drop another in:</p>
              <div className="compose-timer">{fmt(unlockAt - now)}</div>
              <button className="ghost-btn" style={{ marginTop: 4, maxWidth: 280 }} onClick={onBack}>Back to the bowl</button>
            </div> :
            <React.Fragment>
              <div className="category-chips">
                {CATEGORIES.map((c) =>
                  <button
                    key={c}
                    className={"chip-btn" + (c === cat ? " active" : "")}
                    onClick={() => setCat(c)}>
                    {c}</button>
                )}
              </div>

              <input
                className="compose-title"
                placeholder="Add a title…"
                maxLength={60}
                value={title}
                onChange={(e) => setTitle(e.target.value)} />

              <div className="note-paper">
                <textarea
                  autoFocus
                  maxLength={max}
                  placeholder="Write whatever's true for you right now…"
                  value={text}
                  onChange={(e) => setText(e.target.value)} />
                <div className="char-count">{text.length} / {max}</div>
              </div>

              <div className="compose-anon">
                <div className="compose-anon-text">
                  <span className="lab"><Icon.EyeOff size={15} /> Post anonymously</span>
                  <span className="sub">{anon ? "Shown as “Anonymous”" : "Shown as " + (myHandle || "your name")}</span>
                </div>
                <button
                  className={"switch" + (anon ? " on" : "")}
                  role="switch"
                  aria-checked={anon}
                  onClick={() => setAnon((v) => !v)}>
                  <span className="knob" />
                </button>
              </div>

              <button
                className="primary-btn"
                disabled={text.trim().length < 4}
                onClick={() => onSubmit({ cat, title: title.trim(), text: text.trim(), anon })}>
                <Icon.Pencil size={16} /> Drop into the bowl
              </button>
              <button className="ghost-btn" onClick={onBack}>
                Cancel
              </button>
            </React.Fragment>
          }
        </div>
      </div>
    </div>
  );
}

// ───────────── Wins ─────────────
export function WinsScreen({ wins, streak, weekDays, onAdd }) {
  const isEmpty = wins.length === 0;

  return (
    <div className="screen screen-enter">
      <TopBar wordmark="Pondr" />

      <div className="wins-hero">
        <div className="plant-l"><Plant size={80} /></div>
        <div className="plant-r"><Plant size={80} /></div>
        <h1>The good matters.</h1>
        <p>Track the little things that<br />make your days brighter.</p>
      </div>

      <div className="streak-card">
        <div className="flame"><Icon.Flame size={26} /></div>
        <div className="info">
          <div className="top">
            <span className="num">{streak}</span>
            <span className="day-label">day streak</span>
          </div>
          <div className="label">{streak > 0 ? "Keep it going!" : "Start your streak today"}</div>
        </div>
        <div className="week">
          {weekDays.map((d, i) =>
            <div key={i} className={"day" + (d.done ? "" : " empty")}>
              <div className="dot">{d.done && <Icon.Check />}</div>
              <span className="letter">{d.letter}</span>
            </div>
          )}
        </div>
      </div>

      <div className="wins-header">
        <h2>Your wins</h2>
        <button className="add-btn" onClick={onAdd}>
          <Icon.PlusBare size={14} /> Add win
        </button>
      </div>

      {isEmpty ?
        <div className="empty-state">
          <div className="icon"><Icon.Sparkle size={26} /></div>
          <h4>No wins yet</h4>
          <p>Even the smallest moments count.<br />Log your first win to get started.</p>
          <button className="primary-btn" onClick={onAdd} style={{ marginTop: 0 }}>
            <Icon.PlusBare size={16} /> Add your first win
          </button>
        </div> :

        <div className="wins-list">
          {wins.map((w, i) => {
            const IconComp = Icon[w.icon] || Icon.Star;
            return (
              <div key={w.id} className="win-row" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="icon"><IconComp size={20} /></div>
                <div className="text">{w.text}</div>
                <div className="date">{w.date}</div>
                <button className="more" aria-label="More"><Icon.Dots /></button>
              </div>
            );
          })}
        </div>
      }

      {!isEmpty &&
        <div className="summary-card">
          <div className="trophy"><Icon.TrophyBig size={26} /></div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow">This month</div>
            <h3>You've logged {wins.length} win{wins.length === 1 ? '' : 's'}</h3>
            <p>Keep celebrating the little wins.</p>
          </div>
          <span className="sparks"><Icon.Sparkle4 size={14} /></span>
        </div>
      }
    </div>
  );
}

// ───────────── Add a Win ─────────────
export function AddWinScreen({ onBack, onSubmit }) {
  const [icon, setIcon] = useState("Sun");
  const [text, setText] = useState("");
  const max = 140;

  return (
    <div className="screen screen-enter">
      <TopBar
        title="Add a win"
        subtitle="Big or small — they all count"
        left={
          <button className="icon-btn left" onClick={onBack}>
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="compose-card">
        <div className="body">
          <div className="compose-prompt-eyebrow">What's a small good thing?</div>
          <h2 className="compose-prompt-text">Celebrate something<br />worth remembering.</h2>

          {/* Icon picker */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
            margin: '4px 0 14px'
          }}>
            {WIN_ICONS.map((name) => {
              const IconComp = Icon[name];
              const active = name === icon;
              return (
                <button
                  key={name}
                  onClick={() => setIcon(name)}
                  style={{
                    aspectRatio: '1 / 1',
                    borderRadius: 14,
                    background: active ? 'var(--p-accent)' : 'var(--p-bg)',
                    color: active ? 'var(--p-accent-on)' : 'var(--p-accent)',
                    border: active ? '1px solid transparent' : '1px solid var(--p-card-stroke)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 160ms'
                  }}>
                  <IconComp size={22} />
                </button>
              );
            })}
          </div>

          <div className="note-paper" style={{ minHeight: 140 }}>
            <textarea
              autoFocus
              maxLength={max}
              placeholder="What happened? (e.g. 'Made a friend laugh today.')"
              value={text}
              onChange={(e) => setText(e.target.value)} />
            <div className="char-count">{text.length} / {max}</div>
          </div>

          <button
            className="primary-btn"
            disabled={text.trim().length < 3}
            onClick={() => onSubmit({ icon, text: text.trim() })}>
            <Icon.PlusBare size={14} /> Log this win
          </button>
          <button className="ghost-btn" onClick={onBack}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ───────────── Past prompts archive ─────────────
export function PromptArchive({ items, onClose }) {
  return (
    <div className="archive-overlay">
      <TopBar
        title="Past prompts"
        subtitle="A prompt for every day"
        left={
          <button className="icon-btn left" onClick={onClose} aria-label="Back">
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="archive-list">
        {items.map((it, i) =>
          <div className="archive-row" key={i}>
            <div className="archive-row-date">{it.label}</div>
            <div className="archive-row-q">{it.text}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────── Auth — email + password (private / protected) ─────────────
export function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signup"); // signup | login
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const valid = email.includes("@") && email.includes(".") && pw.length >= 4;

  return (
    <div className="onboard">
      <div className="onboard-scroll">
        <div className="onboard-logo">Pondr</div>

        <div className="auth-toggle">
          <button className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create account</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Log in</button>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        </label>

        <button className="primary-btn" disabled={!valid} onClick={() => onAuth(mode)}>
          {mode === "signup" ? "Continue" : "Log in"}
        </button>

        <div className="auth-note">
          <span className="auth-note-badge"><Icon.Lock size={16} /></span>
          <span>Private and protected. Only your username is shown to others - and you can hide it anytime.</span>
        </div>
      </div>
    </div>
  );
}

// ───────────── Onboarding / create your stranger name ─────────────
export function OnboardingScreen({ onComplete }) {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const adjList = useMemo(() => [...ADJECTIVES].sort((a, b) => a.localeCompare(b)), []);
  const creatureList = useMemo(() => [...CREATURES].sort((a, b) => a.localeCompare(b)), []);
  const [adj, setAdj] = useState(() => rand(ADJECTIVES));
  const [creature, setCreature] = useState(() => rand(CREATURES));
  const [hide, setHide] = useState(false);
  const surprise = () => { setAdj(rand(ADJECTIVES)); setCreature(rand(CREATURES)); };

  return (
    <div className="onboard">
      <div className="onboard-scroll">
        <div className="onboard-logo">Pondr</div>
        <div className="onboard-tagline">Create your anonymous identity</div>

        <div className="onboard-preview">
          <span className="spark" style={{ top: 14, left: 16 }}><Icon.Sparkle4 size={10} /></span>
          <span className="spark" style={{ bottom: 14, right: 18 }}><Icon.Sparkle4 size={12} /></span>
          <div className="onboard-eyebrow">Your stranger name</div>
          <div className="onboard-handle">{adj} {creature}</div>
          <span className="author-token mine">@{MY_NUMBER}</span>
        </div>

        <button className="ghost-btn onboard-surprise" onClick={surprise}>
          <Icon.Sparkle size={16} /> Surprise me
        </button>

        <div className="onboard-section">Choose an adjective</div>
        <div className="chip-wrap">
          {adjList.map((a) =>
            <button key={a} className={"chip-btn" + (a === adj ? " active" : "")} onClick={() => setAdj(a)}>{a}</button>
          )}
        </div>

        <div className="onboard-section">Choose a creature</div>
        <div className="chip-wrap">
          {creatureList.map((c) =>
            <button key={c} className={"chip-btn" + (c === creature ? " active" : "")} onClick={() => setCreature(c)}>{c}</button>
          )}
        </div>

        <div className="onboard-toggle">
          <div className="onboard-toggle-text">
            <span className="lab"><Icon.EyeOff size={15} /> Hide my name on posts</span>
            <span className="sub">Posts show as “Anonymous”. They stay linked to your account for safety.</span>
          </div>
          <button
            className={"switch" + (hide ? " on" : "")}
            role="switch"
            aria-checked={hide}
            onClick={() => setHide((v) => !v)}>
            <span className="knob" />
          </button>
        </div>

        <button className="primary-btn" onClick={() => onComplete(adj + " " + creature, hide)}>
          <Icon.ArrowRight size={16} /> Enter Pondr
        </button>
        <p className="onboard-fine">
          No email shown, ever. Your identity stays anonymous — just a name and a number.
        </p>
      </div>
    </div>
  );
}

// ───────────── Profile ─────────────
export function ProfileScreen({ handle, number, subs, winsCount, streak, hideName, onToggleHideName, onOpenMenu, onOpenArchive, onOpenWins, onLogout, theme, accent, onSetTheme, onSetAccent }) {
  const creature = (handle || "").split(" ").slice(-1)[0] || "";
  const initial = (creature[0] || "P").toUpperCase();
  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Profile"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      <div className="profile-hero">
        <span className="spark" style={{ top: 18, left: 28 }}><Icon.Sparkle4 size={11} /></span>
        <span className="spark" style={{ bottom: 22, right: 34 }}><Icon.Sparkle4 size={13} /></span>
        <div className="profile-avatar">{initial}</div>
        <div className="profile-handle">{handle || "Your name"}</div>
        <span className="author-token mine profile-num">@{number}</span>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="num">{subs}</span>
          <span className="lab">Notes shared</span>
        </div>
        <div className="profile-stat">
          <span className="num">{winsCount}</span>
          <span className="lab">Wins</span>
        </div>
        <div className="profile-stat">
          <span className="num">{streak}</span>
          <span className="lab">Day streak</span>
        </div>
      </div>

      <div className="profile-section">Privacy</div>
      <div className="profile-list">
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.EyeOff size={18} /></span>
          <div className="profile-row-text">
            <span className="lab">Hide my name on posts</span>
            <span className="sub">Posts show as “Anonymous” by default</span>
          </div>
          <button
            className={"switch" + (hideName ? " on" : "")}
            role="switch"
            aria-checked={hideName}
            onClick={onToggleHideName}>
            <span className="knob" />
          </button>
        </div>
      </div>

      {/* Appearance — replaces the prototype-only Tweaks panel with a
          production-appropriate home for theme + accent selection. */}
      <div className="profile-section">Appearance</div>
      <div className="profile-list">
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.Moon size={18} /></span>
          <div className="profile-row-text"><span className="lab">Theme</span></div>
          <div className="seg">
            {["light", "dark"].map((v) =>
              <button key={v} className={"seg-btn" + (theme === v ? " active" : "")} onClick={() => onSetTheme(v)}>{v}</button>
            )}
          </div>
        </div>
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.Sparkle size={18} /></span>
          <div className="profile-row-text"><span className="lab">Accent</span></div>
          <div className="seg">
            {["purple", "sand", "teal"].map((v) =>
              <button key={v} className={"seg-btn" + (accent === v ? " active" : "")} onClick={() => onSetAccent(v)}>{v}</button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-section">Activity</div>
      <div className="profile-list">
        <button className="profile-row tappable" onClick={onOpenWins}>
          <span className="profile-row-ic"><Icon.Trophy size={18} /></span>
          <div className="profile-row-text"><span className="lab">Your wins</span></div>
          <Icon.ArrowRight size={18} />
        </button>
        <button className="profile-row tappable" onClick={onOpenArchive}>
          <span className="profile-row-ic"><Icon.Book size={18} /></span>
          <div className="profile-row-text"><span className="lab">Past prompts</span></div>
          <Icon.ArrowRight size={18} />
        </button>
      </div>

      <div className="profile-section">Account</div>
      <div className="profile-list">
        <button className="profile-row tappable danger" onClick={onLogout}>
          <span className="profile-row-ic"><Icon.Lock size={18} /></span>
          <div className="profile-row-text"><span className="lab">Log out</span></div>
          <Icon.ArrowRight size={18} />
        </button>
      </div>

      <div className="profile-foot">Pondr · a quieter place to share</div>
    </div>
  );
}

// ───────────── Explore (placeholder mockup) ─────────────
export function ExploreScreen({ onOpenMenu }) {
  const TOPICS = ["Reflection", "Hope", "Confession", "Gratitude", "Memory", "Question"];
  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Explore"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      <div className="placeholder-hero">
        <div className="placeholder-icon"><Icon.Compass size={30} /></div>
        <h2>Explore</h2>
        <p>Wander through themes, collections, and notes from across the bowl. Coming soon.</p>
        <span className="placeholder-pill">In development</span>
      </div>

      <div className="explore-grid">
        {TOPICS.map((tname, i) =>
          <div key={tname} className={"explore-card ex-" + (i % 3)}>
            <Icon.Sparkle4 size={12} />
            <span>{tname}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────── Donation (placeholder mockup) ─────────────
export function DonationScreen({ onOpenMenu }) {
  const TIERS = [
    { amt: "$3", lab: "Buy us a coffee" },
    { amt: "$8", lab: "Keep the lights on" },
    { amt: "$20", lab: "Fund a quieter web" },
  ];
  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Support"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      <div className="placeholder-hero">
        <div className="placeholder-icon"><Icon.Gift size={30} /></div>
        <h2>Support Pondr</h2>
        <p>Pondr is free and ad-free. If it's brought you a moment of calm, you can help keep it that way. Coming soon.</p>
        <span className="placeholder-pill">In development</span>
      </div>

      <div className="donate-tiers">
        {TIERS.map((tr) =>
          <div key={tr.amt} className="donate-tier">
            <span className="donate-amt">{tr.amt}</span>
            <span className="donate-lab">{tr.lab}</span>
            <span className="donate-heart"><Icon.Heart size={16} /></span>
          </div>
        )}
      </div>
      <button className="primary-btn donate-cta" disabled>
        <Icon.Heart size={15} /> Donations open soon
      </button>
    </div>
  );
}
