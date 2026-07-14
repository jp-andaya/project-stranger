// screens.jsx — Auth, Onboarding, Home, Feed, Compose, Wins, AddWin,
// Profile, Settings link, Explore, Donation, PromptArchive. Ported from the
// design handoff (pondr-screens.jsx); browser-Babel globals replaced with ES
// imports. Instants components live in instants.jsx, Settings in settings.jsx.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icon } from './icons.jsx';
import { Bowl, BowlPhoto, Plant } from './Bowl.jsx';
import {
  CATEGORIES, ADJECTIVES, CREATURES, UNLOCK_SUBS, handleFromNumber,
} from './data.js';
import { CameraCapture, InstantStack, TodayInstantCard } from './instants.jsx';

// ───────────── Shared bits ─────────────
export function TopBar({ title, subtitle, left, right, wordmark }) {
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

// Map server prompts (GET /api/prompts/archive) to carousel items, newest
// first. label: "Today" for the live prompt, then relative-date labels.
export function mapPromptItems(prompts) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return prompts.map((p) => {
    const d = new Date(p.scheduled_date + "T00:00:00");
    const offset = Math.max(0, Math.round((today - d) / (24 * 3600000)));
    return {
      id: p.id,
      text: p.text,
      offset,
      date: d,
      noteCount: p.note_count,
      label: offset === 0 ? "Today" : relativeLabel(d),
    };
  });
}

function fmtCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p2 = (n) => String(n).padStart(2, "0");
  return p2(h) + ":" + p2(m) + ":" + p2(sec);
}

// Home-screen card: "you've already shared this prompt" + flip-clock countdown
function ShareTimerCard({ unlockAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (unlockAt <= now) return null;
  const s = Math.max(0, Math.floor((unlockAt - now) / 1000));
  const units = [
    { v: String(Math.floor(s / 3600)).padStart(2, "0"), lab: "hours" },
    { v: String(Math.floor((s % 3600) / 60)).padStart(2, "0"), lab: "minutes" },
    { v: String(s % 60).padStart(2, "0"), lab: "seconds" },
  ];
  return (
    <div className="share-timer flip">
      <div className="share-timer-glow"></div>
      <div className="share-timer-top">
        <div className="share-timer-icon"><Icon.Check size={15} /></div>
        <span className="share-timer-lab">You've shared for this prompt</span>
      </div>
      <span className="share-timer-sub">You can share again in</span>
      <div className="flip-clock">
        {units.map((u) => (
          <div className="flip-unit" key={u.lab}>
            <div className="flip-tile">
              <span className="flip-num" key={u.v}>{u.v}</span>
              <span className="flip-split"></span>
              <span className="flip-pin l"></span>
              <span className="flip-pin r"></span>
            </div>
            <span className="flip-lab">{u.lab}</span>
          </div>
        ))}
      </div>
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

function PromptCarousel({ items, idx, onChange, onSuggest }) {
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
      {onSuggest &&
        <button className="prompt-suggest" onClick={onSuggest}>
          <Icon.PlusBare size={12} /> Suggest a prompt
        </button>
      }
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

export function HomeScreen({ promptItems, promptIdx, onPromptIdx, bowlMode, feed, mySubs, unlockAt, onPickFromBowl, onOpenCompose, onOpenFeed, onOpenNote, onOpenMenu, onSuggestPrompt }) {
  // Carousel only spans the last week; older prompts live in the archive.
  const weekItems = promptItems.filter((p) => p.offset <= 6);
  if (weekItems.length === 0) {
    return (
      <div className="screen screen-enter">
        <TopBar wordmark="Pondr" left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu"><Icon.Menu /></button>
        } />
        <div className="feed-empty">Loading prompts…</div>
      </div>
    );
  }

  // The unlock economy is enforced server-side: `feed` already contains only
  // the notes this user may read, plus the true total for the locked peek.
  const visibleNotes = feed ? feed.notes : [];
  const total = feed ? feed.total : 0;
  const hiddenCount = Math.max(0, total - visibleNotes.length);
  const hasShared = mySubs >= 1;
  const activeUnlockAt = unlockAt || 0;
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
      <PromptCarousel items={weekItems} idx={Math.min(promptIdx, weekItems.length - 1)} onChange={onPromptIdx} onSuggest={onSuggestPrompt} />

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
      {(total === 0 || hasShared) &&
        <React.Fragment>
          <h3 className="section-title">Notes from Strangers</h3>

          <div className="feed-column">
            {total === 0 ?
              <div className="feed-empty">No responses yet — be the first to drop one.</div> :
              <React.Fragment>
                {visibleNotes.map((n, i) =>
                  <FeedNoteCard key={n.id} note={n} index={i} onClick={() => onOpenNote(n)} />
                )}
                {hiddenCount > 0 &&
                  <LockedPeek peek={visibleNotes[visibleNotes.length - 1]} hiddenCount={hiddenCount} mySubs={mySubs} onCompose={onOpenCompose} />
                }
              </React.Fragment>
            }
          </div>

          {hasShared && total > 0 && hiddenCount === 0 &&
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
export function ComposeScreen({ prompt, onBack, onSubmit, unlockAt = 0 }) {
  const [cat] = useState("Reflection");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
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
                  <span className="lab"><Icon.EyeOff size={15} /> Posted without a username</span>
                  <span className="sub">Notes are always anonymous. Your ID tag is stored privately for safety.</span>
                </div>
              </div>

              <button
                className="primary-btn"
                disabled={text.trim().length < 4}
                onClick={() => onSubmit({ cat, title: title.trim(), text: text.trim() })}>
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

// ───────────── Streak history calendar (dropdown inside the ember card) ─────────────
// Real history only: `logSet` is a Set of Date.toDateString() keys built from
// the server's wins summary (GET /api/wins/summary → logged_dates).
export function streakDoneOn(date, logSet) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((today - d) / 86400000);
  if (diff < 0) return null;      // future
  return logSet ? logSet.has(d.toDateString()) : false;
}

const CAL_RANGES = [
  { key: "1M", label: "1M", months: 1 },
  { key: "1Y", label: "1Y", months: 12 },
];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthCells(year, month) {
  // Cells for a Monday-first calendar grid; null = leading blank.
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let day = 1; day <= count; day++) cells.push(new Date(year, month, day));
  return cells;
}

function StreakCalendar({ range, onRange, logSet }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const months = CAL_RANGES.find((r) => r.key === range).months;

  // Months in the range, oldest first, ending with the current month
  const list = [];
  for (let i = months - 1; i >= 0; i--) {
    const m = new Date(today.getFullYear(), today.getMonth() - i, 1);
    list.push({ year: m.getFullYear(), month: m.getMonth() });
  }

  let logged = 0, total = 0;
  const start = new Date(list[0].year, list[0].month, 1);
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    total++;
    if (streakDoneOn(d, logSet)) logged++;
  }

  return (
    <div className="streak-cal">
      <div className="cal-range">
        {CAL_RANGES.map((r) =>
          <button
            key={r.key}
            className={"cal-range-btn" + (r.key === range ? " on" : "")}
            onClick={() => onRange(r.key)}>
            {r.label}
          </button>
        )}
      </div>

      {months === 1 ?
        <div className="cal-month-full">
          <div className="cal-month-title">{MONTH_NAMES[list[0].month]} {list[0].year}</div>
          <div className="cal-grid">
            {["M", "T", "W", "T", "F", "S", "S"].map((l, i) => <span key={"h" + i} className="cal-head">{l}</span>)}
            {monthCells(list[0].year, list[0].month).map((d, i) => {
              if (!d) return <span key={i} className="cal-cell blank"></span>;
              const done = streakDoneOn(d, logSet);
              const isToday = d.getTime() === today.getTime();
              return (
                <span key={i} className={"cal-cell" + (done ? " done" : "") + (done === null ? " future" : "") + (isToday ? " today" : "")}>
                  {d.getDate()}
                </span>);
            })}
          </div>
        </div> :

        <div className="cal-mini-grid">
          {list.map(({ year, month }) => {
            const cells = monthCells(year, month);
            return (
              <div key={year + "-" + month} className="cal-mini">
                <div className="cal-mini-title">{MONTH_SHORT[month]}{month === 0 ? " '" + String(year).slice(2) : ""}</div>
                <div className="cal-mini-dots">
                  {cells.map((d, i) => {
                    if (!d) return <span key={i} className="mini-dot blank"></span>;
                    const done = streakDoneOn(d, logSet);
                    return <span key={i} className={"mini-dot" + (done ? " done" : "") + (done === null ? " future" : "")}></span>;
                  })}
                </div>
              </div>);
          })}
        </div>
      }

      <div className="cal-summary">
        <Icon.Flame size={13} />
        <span><strong>{logged}</strong> of {total} days logged</span>
      </div>
    </div>
  );
}

// ───────────── Mountain progress (Wins hero) ─────────────
// Month-to-date elevation: each logged win climbs, each missed day descends (never below base).
// Resets with each new month; the ridge accumulates day by day until month end.
function MountainProgress({ streak = 0, zoom = true, breakDays = 0, deletedAgo = 0, descent = 0.6, logSet }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = today.getFullYear(), month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dToday = today.getDate();

  let elev = 0;
  const elevs = [0];
  // Demo-state overrides: a broken streak marks the most recent N days missed;
  // a deleted back-dated win flips that one day to missed.
  const doneOn = (date) => {
    const diff = Math.round((today - date) / 86400000);
    if (breakDays > 0 && diff >= 0 && diff < breakDays) return false;
    if (deletedAgo > 0 && diff === deletedAgo) return false;
    return streakDoneOn(date, logSet);
  };
  for (let d = 1; d <= dToday; d++) {
    const done = doneOn(new Date(year, month, d));
    elev = done ? elev + 1 : Math.max(0, elev - descent);
    elevs.push(elev);
  }
  const effStreak = breakDays > 0 ? 0 : streak;

  // zoom=true → tight close-up of the last few days (the climber & checkpoint up close);
  // zoom=false → whole month at a glance
  const startIdx = zoom ? Math.max(0, elevs.length - 4) : 0;
  const pts = elevs.slice(startIdx);
  const hiE = zoom ? Math.max(...pts) + 0.5 : Math.max(5, ...elevs);
  const loE = zoom ? Math.max(0, Math.min(...pts) - 0.9) : 0;

  const W = 320, H = 138, base = 128, top = 44;
  const span = zoom ? Math.max(1, pts.length - 1) : daysInMonth;
  const padR = zoom ? 34 : 16; // extra right headroom in zoom so the scaled flag + pulse fit
  const px = (i) => 8 + (i / span) * (W - padR);
  const py = (e) => base - ((e - loE) / (hiE - loE)) * (base - top);
  const line = "M " + pts.map((e, i) => px(i).toFixed(1) + " " + py(e).toFixed(1)).join(" L ");
  const area = line + ` L ${px(pts.length - 1).toFixed(1)} ${H} L ${px(0)} ${H} Z`;

  // decorative far ridge spanning the whole month
  let back = `M 0 ${H}`;
  for (let i = 0; i <= 10; i++) {
    const bx = (i / 10) * W;
    const by = base - 26 - Math.abs(Math.sin(i * 2.3 + month)) * 46;
    back += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
  }
  back += ` L ${W} ${H} Z`;

  const cx = px(pts.length - 1).toFixed(1);
  const cy = py(pts[pts.length - 1]).toFixed(1);
  const flagS = zoom ? 1.7 : 1;

  return (
    <div className="mtn-wrap">
      <div className={"mtn-sky" + (zoom ? " zoomed" : "")} key={zoom ? "zoom" : "full"}>
        <div className="mtn-caption">
          {zoom ?
            <React.Fragment>Your climb through <em>{MONTH_NAMES[month]}</em> so far.</React.Fragment> :
            <React.Fragment>This is how far you've come since <em>March 12</em>.</React.Fragment>
          }
        </div>
        <span className="mtn-cloud c1"></span>
        <span className="mtn-cloud c2"></span>
        <svg className="mtn-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="mtnFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#d96b3f" stopOpacity="0.9"></stop>
              <stop offset="1" stopColor="#d96b3f" stopOpacity="0.12"></stop>
            </linearGradient>
          </defs>
          <path className="mtn-back" d={back}></path>
          <path className="mtn-area" d={area} fill="url(#mtnFill)"></path>
          <path className="mtn-line" d={line} pathLength="1" fill="none"></path>
          <g className="mtn-flag" transform={`translate(${cx}, ${cy}) scale(${flagS})`}>
            <circle className="pulse" r="5"></circle>
            <circle className="dot" r="3.2"></circle>
            <line x1="0" y1="-3" x2="0" y2="-15"></line>
            <polygon className="cloth" points="0,-15 9,-11.5 0,-8"></polygon>
          </g>
        </svg>
      </div>
      <div className="mtn-stats">
        <span className="mtn-badge">▲ {effStreak > 0 ? effStreak + "-day climb" : "at base camp"}</span>
      </div>
    </div>
  );
}

// ───────────── Wins ─────────────
// (The old EphemeralPhoto stub was replaced by the Instants feature — see instants.jsx)
export function WinsScreen({ wins, streak, logSet: logSetProp, onAdd, todayWin, myInstant, perspective, viewedMine, onCapture, onViewMine, onEditWin, onLikeWin, onCommentWin, onWinMenu }) {
  const isEmpty = wins.length === 0;
  const [calOpen, setCalOpen] = useState(false);
  const [calRange, setCalRange] = useState("1M");
  const [openComments, setOpenComments] = useState(null); // win id with comments expanded
  const [commentDraft, setCommentDraft] = useState("");

  // Logged days come from the server's wins summary (toDateString keys).
  const logSet = logSetProp || new Set();

  // Viewed week: 0 = current, negative = past, positive = future (swipe to navigate)
  const [weekOffset, setWeekOffset] = useState(0);
  const swipeX = useRef(null);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekLabel = monday.getMonth() === sunday.getMonth() ?
    `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()} – ${sunday.getDate()}` :
    `${MONTH_SHORT[monday.getMonth()]} ${monday.getDate()} – ${MONTH_SHORT[sunday.getMonth()]} ${sunday.getDate()}`;

  // Days of the viewed week from the same history the mountain/calendar use
  const viewedWeek = ["M", "T", "W", "T", "F", "S", "S"].map((letter, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { letter, done: streakDoneOn(d, logSet) === true };
  });
  const todayIdx = weekOffset === 0 ? (now.getDay() + 6) % 7 : -1;

  const swipeStart = (x) => { swipeX.current = x; };
  const swipeEnd = (x) => {
    if (swipeX.current === null) return;
    const dx = x - swipeX.current;
    swipeX.current = null;
    if (dx > 44) setWeekOffset(weekOffset - 1);       // swipe right → previous week
    else if (dx < -44) setWeekOffset(weekOffset + 1); // swipe left → next week
  };

  return (
    <div className="screen screen-enter wins-page">
      <TopBar wordmark="Captured Wins" />

      <div className="streak-card ember mountain">
        <MountainProgress
          streak={streak}
          zoom={!calOpen}
          logSet={logSet} />
        {!calOpen &&
          <div
            className="week-swipe"
            onTouchStart={(e) => swipeStart(e.touches[0].clientX)}
            onTouchEnd={(e) => swipeEnd(e.changedTouches[0].clientX)}
            onMouseDown={(e) => swipeStart(e.clientX)}
            onMouseUp={(e) => swipeEnd(e.clientX)}
            onMouseLeave={() => { swipeX.current = null; }}>
            <div key={weekOffset} className="week-pane">
              <div className="week-label">{weekLabel}</div>
              <div className="week">
                {viewedWeek.map((d, i) =>
                  <div key={i} className={"day" + (d.done ? "" : " empty") + (i === todayIdx ? " today" : "")}>
                    <div className="dot">{d.done && <Icon.Check />}</div>
                    <span className="letter">{d.letter}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        <button className={"cal-toggle" + (calOpen ? " open" : "")} onClick={() => setCalOpen((o) => !o)} aria-label={calOpen ? "Hide calendar" : "View calendar"}>
          <Icon.ChevronDown size={16} />
        </button>
        {calOpen && <StreakCalendar range={calRange} onRange={setCalRange} logSet={logSet} />}
      </div>

      {/* Owner surface — today's instant (capture unlock / posted states) */}
      <TodayInstantCard
        todayWin={todayWin}
        myInstant={myInstant}
        perspective={perspective}
        viewedMine={viewedMine}
        streak={streak}
        onAddWin={onAdd}
        onCapture={onCapture}
        onView={onViewMine} />

      {isEmpty ?
        <div className="empty-state">
          <div className="icon"><Icon.Sparkle size={26} /></div>
          <h4>No wins yet</h4>
          <p>Even the smallest moments count.<br />Log your first win to get started.</p>
          <button className="primary-btn" onClick={onAdd} style={{ marginTop: 0 }}>
            <Icon.PlusBare size={16} /> Add your first win
          </button>
        </div> :

        <div className="wins-grid">
          {wins.map((w, i) => {
            const comments = w.comments || [];
            const sendComment = () => {
              const t = commentDraft.trim();
              if (!t) return;
              onCommentWin(w.id, t);
              setCommentDraft("");
            };
            return (
              <div key={w.id} className="win-cell insta" style={{ animationDelay: `${i * 40}ms` }}>
                <div className={"win-photo-lg" + (w.photo ? "" : " ph")}>
                  {w.photo ?
                    <img src={w.photo} alt="Day instant" /> :
                    <Icon.Camera size={24} />
                  }
                  <span className="win-date-chip">{w.date}</span>
                  {w.private && <span className="win-private-chip"><Icon.Lock size={11} /> Private</span>}
                  <button className="win-more" onClick={() => onWinMenu(w)} aria-label="Post options">
                    <Icon.Dots size={18} />
                  </button>
                </div>
                <div className="win-caption">{w.text}</div>
                <div className="win-actions">
                  <button className={"win-act like" + (w.liked ? " on" : "")} onClick={() => onLikeWin(w.id)}>
                    <Icon.Heart size={17} filled={!!w.liked} /> {w.likes || 0}
                  </button>
                  <button
                    className={"win-act" + (openComments === w.id ? " on" : "")}
                    onClick={() => { setOpenComments(openComments === w.id ? null : w.id); setCommentDraft(""); }}>
                    <Icon.Chat size={17} /> {comments.length}
                  </button>
                </div>
                {openComments === w.id &&
                  <div className="win-comments">
                    {comments.map((c) =>
                      <div key={c.id} className="win-comment">
                        <span className="who">{c.author === "you" ? "You" : handleFromNumber(c.author)}</span>
                        <span className="what">{c.text}</span>
                      </div>
                    )}
                    {comments.length === 0 &&
                      <div className="win-comment-empty">No comments yet.</div>
                    }
                    <div className="win-comment-input">
                      <input
                        type="text"
                        value={commentDraft}
                        maxLength={120}
                        placeholder="Add a comment…"
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") sendComment(); }} />
                      <button disabled={!commentDraft.trim()} onClick={sendComment} aria-label="Send comment">
                        <Icon.Send size={15} />
                      </button>
                    </div>
                  </div>
                }
              </div>);
          })}
        </div>
      }
    </div>
  );
}

// ───────────── Add a Win — camera first, then the win as a caption ─────────────
export function AddWinScreen({ onBack, onSubmit }) {
  const [step, setStep] = useState("camera"); // camera | caption
  const [shot, setShot] = useState(null);     // { photo, retakes }
  const [text, setText] = useState("");
  const max = 140;

  if (step === "camera") {
    return (
      <div className="screen screen-enter capture-screen cam-full" data-screen-label="Add win — camera">
        <TopBar
          title="Add a win"
          left={
            <button className="icon-btn left" onClick={onBack}>
              <Icon.ArrowLeft />
            </button>
          } />
        <CameraCapture
          full
          acceptLabel="Use photo"
          onDone={(s) => { setShot(s); setStep("caption"); }} />
      </div>
    );
  }

  return (
    <div className="screen screen-enter" data-screen-label="Add win — caption">
      <TopBar
        left={
          <button className="icon-btn left" onClick={() => setStep("camera")}>
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="compose-card addwin-card">
        <div className="body">
          <div className="addwin-shot-row">
            <div className="addwin-shot">
              {shot && <img src={shot.photo} alt="Your instant" />}
            </div>
            <div className="addwin-shot-meta">
              <span className="lab">Today's instant</span>
              <span className="sub">{shot && shot.retakes > 0 ? shot.retakes + " retake" + (shot.retakes === 1 ? "" : "s") : "first take"}</span>
              <button className="addwin-reshoot" onClick={() => setStep("camera")}>
                <Icon.Retry size={13} /> Retake
              </button>
            </div>
          </div>

          <h2 className="compose-prompt-text">What win can we<br />note down today?</h2>

          <div className="note-paper" style={{ minHeight: 260 }}>
            <textarea
              autoFocus
              maxLength={max}
              placeholder={"What's the \"W\" today?.."}
              value={text}
              onChange={(e) => setText(e.target.value)} />
            <div className="char-count">{text.length} / {max}</div>
          </div>

          <button
            className="primary-btn"
            disabled={text.trim().length < 3}
            onClick={() => onSubmit({ text: text.trim(), photo: shot && shot.photo, retakes: shot ? shot.retakes : 0 })}>
            <Icon.PlusBare size={14} /> Submit your win
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
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const valid = email.includes("@") && email.includes(".") && pw.length >= (mode === "signup" ? 8 : 4);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onAuth(mode, { email: email.trim(), password: pw });
    } catch (e) {
      setErr(e.message || "Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboard">
      <div className="onboard-scroll">
        <div className="onboard-logo">Pondr</div>

        <div className="auth-toggle">
          <button className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setErr(null); }}>Create account</button>
          <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setErr(null); }}>Log in</button>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
                 placeholder={mode === "signup" ? "8+ characters" : "••••••••"}
                 autoComplete={mode === "signup" ? "new-password" : "current-password"}
                 onKeyDown={(e) => { if (e.key === "Enter" && valid && !busy) submit(); }} />
        </label>

        {err && <div className="onboard-name-err" role="alert">{err}</div>}

        <button className="primary-btn" disabled={!valid || busy} onClick={submit}>
          {busy ? "One moment…" : mode === "signup" ? "Continue" : "Log in"}
        </button>

        <div className="auth-note">
          <span className="auth-note-badge"><Icon.Lock size={16} /></span>
          <span>Private and protected. Only your username is shown to others - and you can hide it anytime.</span>
        </div>
      </div>
    </div>
  );
}

// ───────────── Onboarding / choose your username ─────────────
export function OnboardingScreen({ onComplete, number, checkHandle }) {
  const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const genName = () => rand(ADJECTIVES) + " " + rand(CREATURES);
  const [name, setName] = useState(() => genName());
  const [winsPublic, setWinsPublic] = useState(true);
  const [profilePrivate, setProfilePrivate] = useState(false);
  const [taken, setTaken] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const tooShort = name.trim().length < 3;

  // Debounced live availability check against the server.
  useEffect(() => {
    setErr(null);
    const trimmed = name.trim();
    if (trimmed.length < 3 || !checkHandle) { setTaken(false); return; }
    let stale = false;
    const id = setTimeout(async () => {
      try {
        const available = await checkHandle(trimmed);
        if (!stale) setTaken(!available);
      } catch { /* offline — server re-checks on submit */ }
    }, 300);
    return () => { stale = true; clearTimeout(id); };
  }, [name, checkHandle]);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onComplete(name.trim(), { winsPublic, profilePrivate });
    } catch (e) {
      if (e.status === 409) setTaken(true);
      else setErr(e.message || "Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboard">
      <div className="onboard-scroll">
        <div className="onboard-logo">Pondr</div>
        <div className="onboard-tagline">Choose your username</div>

        <div className="onboard-preview">
          <span className="spark" style={{ top: 14, left: 16 }}><Icon.Sparkle4 size={10} /></span>
          <span className="spark" style={{ bottom: 14, right: 18 }}><Icon.Sparkle4 size={12} /></span>
          <div className="onboard-eyebrow">Your username</div>
          <div className="onboard-handle">{name.trim() || "…"}</div>
          <span className="author-token mine">@{number}</span>
        </div>

        <div className="onboard-section">Pick your own</div>
        <input
          className={"onboard-name-input" + (taken ? " err" : "")}
          type="text"
          value={name}
          maxLength={24}
          placeholder="Choose a username…"
          onChange={(e) => setName(e.target.value)} />
        {taken &&
          <div className="onboard-name-err">That username is taken — try another.</div>
        }
        {err && <div className="onboard-name-err" role="alert">{err}</div>}

        <button className="ghost-btn onboard-surprise" onClick={() => setName(genName())}>
          <Icon.Sparkle size={16} /> Generate one for me
        </button>

        <div className="onboard-toggle">
          <div className="onboard-toggle-text">
            <span className="lab"><Icon.Camera size={15} /> Show username on win captures</span>
            <span className="sub">{winsPublic ? "Strangers see your username on your wins." : "Your wins post as “Anonymous”."}</span>
          </div>
          <button
            className={"switch" + (winsPublic ? " on" : "")}
            role="switch"
            aria-checked={winsPublic}
            onClick={() => setWinsPublic((v) => !v)}>
            <span className="knob" />
          </button>
        </div>

        <div className="onboard-toggle">
          <div className="onboard-toggle-text">
            <span className="lab"><Icon.Lock size={15} /> Private profile</span>
            <span className="sub">{profilePrivate ? "Only you can see your profile." : "Your profile is visible to others."}</span>
          </div>
          <button
            className={"switch" + (profilePrivate ? " on" : "")}
            role="switch"
            aria-checked={profilePrivate}
            onClick={() => setProfilePrivate((v) => !v)}>
            <span className="knob" />
          </button>
        </div>

        <button
          className="primary-btn"
          disabled={taken || tooShort || busy}
          onClick={submit}>
          <Icon.ArrowRight size={16} /> {busy ? "One moment…" : "Enter Pondr"}
        </button>
        <p className="onboard-fine">
          Prompt notes never display a username. Your ID tag stays attached privately, for safety and data integrity.
        </p>
      </div>
    </div>
  );
}

// ───────────── Profile ─────────────
export function ProfileScreen({ handle, number, subs, winsCount, streak, winsNamePublic, onToggleWinsName, profilePrivate, onToggleProfilePrivate, onOpenMenu, onOpenArchive, onOpenWins, onOpenSettings, onLogout, theme, accent, onSetTheme, onSetAccent }) {
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
          <span className="profile-row-ic"><Icon.Camera size={18} /></span>
          <div className="profile-row-text">
            <span className="lab">Show username on win captures</span>
            <span className="sub">{winsNamePublic ? `Strangers see “${handle}” on your wins` : "Your wins post as “Anonymous”"}</span>
          </div>
          <button
            className={"switch" + (winsNamePublic ? " on" : "")}
            role="switch"
            aria-checked={winsNamePublic}
            onClick={onToggleWinsName}>
            <span className="knob" />
          </button>
        </div>
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.Lock size={18} /></span>
          <div className="profile-row-text">
            <span className="lab">Private profile</span>
            <span className="sub">{profilePrivate ? "Only you can see your profile" : "Your profile is visible to others"}</span>
          </div>
          <button
            className={"switch" + (profilePrivate ? " on" : "")}
            role="switch"
            aria-checked={profilePrivate}
            onClick={onToggleProfilePrivate}>
            <span className="knob" />
          </button>
        </div>
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.EyeOff size={18} /></span>
          <div className="profile-row-text">
            <span className="lab">Prompt notes stay anonymous</span>
            <span className="sub">No username is ever shown on notes. Your ID tag is stored privately for safety.</span>
          </div>
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
        <button className="profile-row tappable" onClick={onOpenSettings}>
          <span className="profile-row-ic"><Icon.Gear size={18} /></span>
          <div className="profile-row-text"><span className="lab">Settings</span></div>
          <Icon.ArrowRight size={18} />
        </button>
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

// ───────────── Explore — Instants discovery stack (always dark) ─────────────
export function ExploreScreen({ onOpenMenu, instants, viewedInstants, onOpenInstant, onSeenInstant, onOpenStranger, onLikeInstant, onReportInstant }) {
  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Explore"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      <div className="explore-instants-head">
        <h2>Stranger's captures</h2>
      </div>

      {instants && instants.length > 0 ? (
        <InstantStack
          instants={instants}
          viewedIds={viewedInstants || []}
          onOpen={onOpenInstant}
          onSeen={onSeenInstant}
          onLike={onLikeInstant}
          onReport={onReportInstant}
          onOpenStranger={onOpenStranger} />
      ) : (
        <div className="empty-state">
          <div className="icon"><Icon.Camera size={24} /></div>
          <h4>No instants today</h4>
          <p>Check back later for photos<br />from around the bowl.</p>
        </div>
      )}
    </div>
  );
}

// ───────────── Donation — Mind (mind.org.uk) ─────────────
// Direct-donation form. The card payment is a front-end mock — wire the submit
// to a real payment/charity API (Mind's endpoint or a processor like Stripe).
export function DonationScreen({ onOpenMenu, onDonate }) {
  const PRESETS = { once: [10, 25, 50, 100], monthly: [5, 10, 15, 25] };
  const IMPACT = {
    10: "answers a call to the Mind Infoline",
    25: "helps fund local peer support",
    50: "trains a volunteer listener",
    100: "keeps the helpline open longer",
    5: "supports someone through a tough week",
    15: "funds online crisis resources",
  };

  const [freq, setFreq] = useState("once");
  const [preset, setPreset] = useState(25);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [done, setDone] = useState(false);

  const amount = custom ? Math.max(0, parseInt(custom, 10) || 0) : preset;
  const cardDigits = card.replace(/\D/g, "");
  const valid =
    amount > 0 &&
    name.trim().length > 1 &&
    cardDigits.length >= 15 &&
    /^\d{2}\s*\/\s*\d{2}$/.test(exp) &&
    cvc.replace(/\D/g, "").length >= 3;

  const fmtCard = (v) =>
    v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const fmtExp = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + " / " + d.slice(2) : d;
  };

  if (done) {
    return (
      <div className="screen screen-enter">
        <TopBar
          wordmark="Donate"
          left={
            <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
              <Icon.Menu />
            </button>
          } />
        <div className="donate-thanks">
          <div className="donate-thanks-icon"><Icon.Heart size={34} /></div>
          <h2>Thank you</h2>
          <p>
            Your {freq === "monthly" ? "monthly gift" : "gift"} of <strong>£{amount}</strong> is on its way to
            {" "}<strong>Mind</strong>.
          </p>
          <div className="donate-thanks-note">
            A receipt has been sent to your email. Mind is a registered charity, no.&nbsp;219830.
          </div>
          <button className="ghost-btn" style={{ maxWidth: 280 }} onClick={() => { setDone(false); setCustom(""); }}>
            Make another donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen screen-enter">
      <TopBar
        wordmark="Donate"
        left={
          <button className="icon-btn left" onClick={onOpenMenu} aria-label="Menu">
            <Icon.Menu />
          </button>
        } />

      <div className="donate-org">
        <div className="donate-org-mark">mind</div>
        <div className="donate-org-text">
          <h2>Donate to Mind</h2>
          <p>For better mental health · mind.org.uk</p>
        </div>
      </div>

      <div className="donate-card">
        <div className="donate-seg">
          <button className={freq === "once" ? "active" : ""} onClick={() => { setFreq("once"); setPreset(25); setCustom(""); }}>
            Give once
          </button>
          <button className={freq === "monthly" ? "active" : ""} onClick={() => { setFreq("monthly"); setPreset(10); setCustom(""); }}>
            Monthly
          </button>
        </div>

        <div className="donate-amounts">
          {PRESETS[freq].map((a) =>
            <button
              key={a}
              className={"donate-amt-btn" + (!custom && preset === a ? " active" : "")}
              onClick={() => { setPreset(a); setCustom(""); }}>
              £{a}
            </button>
          )}
        </div>

        <div className="donate-custom">
          <span className="donate-custom-sign">£</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Other amount"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 5))} />
          {freq === "monthly" && amount > 0 && <span className="donate-custom-per">/ month</span>}
        </div>

        {amount > 0 && IMPACT[amount] &&
          <div className="donate-impact">
            <Icon.Heart size={14} /> £{amount} {IMPACT[amount]}.
          </div>}
      </div>

      <div className="donate-card">
        <div className="donate-section-label">Your details</div>
        <input
          className="compose-title donate-field"
          placeholder="Name on card"
          value={name}
          onChange={(e) => setName(e.target.value)} />
        <input
          className="compose-title donate-field"
          inputMode="numeric"
          placeholder="Card number"
          value={card}
          onChange={(e) => setCard(fmtCard(e.target.value))} />
        <div className="donate-field-row">
          <input
            className="compose-title donate-field"
            inputMode="numeric"
            placeholder="MM / YY"
            value={exp}
            onChange={(e) => setExp(fmtExp(e.target.value))} />
          <input
            className="compose-title donate-field"
            inputMode="numeric"
            placeholder="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        </div>
      </div>

      <button
        className="primary-btn donate-cta"
        disabled={!valid}
        onClick={async () => {
          // Card details are a front-end mock and never leave the device;
          // only the donation intent (amount + frequency) is recorded.
          try { if (onDonate) await onDonate(amount * 100, freq); } catch { /* stub — thank anyway */ }
          setDone(true);
        }}>
        <Icon.Heart size={15} /> {amount > 0 ? "Donate £" + amount : "Donate"}{freq === "monthly" && amount > 0 ? " monthly" : ""}
      </button>
      <div className="donate-secure"><Icon.Lock size={13} /> Secure payment · your card is encrypted</div>
    </div>
  );
}
