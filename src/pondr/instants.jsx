// instants.jsx — ephemeral daily win photos ("Instants").
// Capture one real photo a day, posted with your win + streak.
// Strangers can open it exactly once — then it's gone for good.
// Ported from the design handoff (pondr-instants.jsx); browser-Babel globals
// replaced with ES imports. Extra icons live in icons.jsx (Retry, Clock, Flag).

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from './icons.jsx';
import { handleFromNumber } from './data.js';
import { TopBar } from './screens.jsx';

export const MAX_RETAKES = 3;

export function fmtClock(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return h + ":" + m + " " + ap;
}

// Simulated capture (used when the webcam is unavailable)
function genSimPhoto() {
  const c = document.createElement("canvas");
  c.width = 720; c.height = 960;
  const ctx = c.getContext("2d");
  const h1 = 18 + Math.random() * 45;
  const h2 = 240 + Math.random() * 70;
  ctx.fillStyle = `hsl(${h2} 30% 22%)`;
  ctx.fillRect(0, 0, c.width, c.height);
  const g1 = ctx.createRadialGradient(c.width * 0.25, c.height * 0.2, 40, c.width * 0.25, c.height * 0.2, 620);
  g1.addColorStop(0, `hsla(${h1} 55% 62% / 0.9)`);
  g1.addColorStop(1, "transparent");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, c.width, c.height);
  const g2 = ctx.createRadialGradient(c.width * 0.8, c.height * 0.85, 40, c.width * 0.8, c.height * 0.85, 560);
  g2.addColorStop(0, `hsla(${h2} 45% 48% / 0.85)`);
  g2.addColorStop(1, "transparent");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, c.width, c.height);
  // grain
  for (let i = 0; i < 3500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    ctx.fillRect(Math.random() * c.width, Math.random() * c.height, 1.2, 1.2);
  }
  return c.toDataURL("image/jpeg", 0.85);
}

// Placeholder "photo" for strangers' instants (no real imagery in the demo)
export function InstantPH({ hue = 40, hue2 = 290 }) {
  return (
    <div
      className="instant-ph"
      style={{
        background:
          `radial-gradient(120% 80% at 18% 14%, oklch(0.72 0.10 ${hue} / 0.9), transparent 55%),` +
          `radial-gradient(110% 90% at 84% 88%, oklch(0.55 0.10 ${hue2} / 0.85), transparent 60%),` +
          `oklch(0.32 0.05 ${hue2})`
      }}>
      <span className="instant-ph-tag">ephemeral photo</span>
    </div>
  );
}

// ───────────── View-once fullscreen viewer ─────────────
// mode: "close" (burns when closed) | "timed" (auto-burns) | "hold" (burns on release)
// overlay: "chips" | "paper" | "minimal" · burn=false → owner re-viewing, nothing is consumed
export function InstantViewer({ instant, mode = "close", seconds = 8, overlay = "chips", burn = true, myHandle, onDone, onCancel, onReport }) {
  const needHold = burn && mode === "hold";
  const [revealed, setRevealed] = useState(!needHold);
  const [left, setLeft] = useState(seconds);
  const [reporting, setReporting] = useState(false);
  const pausedRef = useRef(false); // pauses the timed countdown while reporting
  const doneRef = useRef(false);
  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    if (!(burn && mode === "timed" && revealed)) return;
    setLeft(seconds);
    const id = setInterval(() => {
      setLeft((s) => {
        if (pausedRef.current) return s;
        if (s <= 1) { clearInterval(id); finish(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [revealed]);

  const handle = instant.handle || (instant.id === "mine" && myHandle) || (instant.author != null ? handleFromNumber(instant.author) : "");
  const retakeLab = instant.retakes > 0
    ? instant.retakes + " retake" + (instant.retakes === 1 ? "" : "s")
    : "first take";
  const hint = !burn
    ? "Strangers can open this once. You can revisit it anytime today."
    : mode === "timed" ? "Disappears when the timer runs out."
    : mode === "hold" ? "Let go and it's gone."
    : "Closing this ends it. Instants play once.";

  const openReport = () => { pausedRef.current = true; setReporting(true); };
  const closeReport = () => { pausedRef.current = false; setReporting(false); };

  const photoNode = instant.photo
    ? <img className="iv-img" src={instant.photo} alt="" draggable="false" />
    : <InstantPH hue={instant.hue} hue2={instant.hue2} />;

  return (
    <div className="iv-overlay" data-screen-label="Instant viewer">
      <div className="iv-top">
        <span className="iv-badge">
          <Icon.Shield size={13} /> {burn ? "Plays once · screenshots blocked" : "Your instant"}
        </span>
        <div className="iv-top-actions">
          {burn && revealed && (
            <button className="iv-x" aria-label="Report" title="Report" onClick={openReport}>
              <Icon.Flag size={15} />
            </button>
          )}
          <button
            className="iv-x"
            aria-label="Close"
            onClick={() => {
              if (!burn) { onCancel(); return; }
              if (needHold && !revealed) { onCancel(); return; } // never opened — not consumed
              finish();
            }}>
            <Icon.X size={18} />
          </button>
        </div>
      </div>

      <div
        className="iv-stage"
        onPointerDown={needHold && !revealed ? () => setRevealed(true) : undefined}
        onPointerUp={needHold && revealed ? finish : undefined}
        onPointerLeave={needHold && revealed ? finish : undefined}>
        {!revealed ? (
          <div className="iv-cover">
            <Icon.Eye size={30} />
            <span className="lab">Hold to view</span>
            <small>Plays once, then it's gone</small>
          </div>
        ) : (
          <React.Fragment>
            {photoNode}
            <div className="iv-info-top">
              <div className="iv-left">
                {overlay === "chips" && (
                  <React.Fragment>
                    <span className="iv-chip">{handle + " · @" + instant.author}</span>
                    <span className="iv-chip"><Icon.Clock size={12} /> {instant.time + (instant.retakes != null ? " · " + retakeLab : "")}</span>
                  </React.Fragment>
                )}
              </div>
              <div className="iv-right">
                <span className="iv-chip flame"><Icon.Flame size={13} /> {instant.streak + " day streak"}</span>
                {burn && mode === "timed" && <span className="iv-chip">{left}s</span>}
                {overlay === "minimal" && <span className="iv-chip"><Icon.Clock size={12} /> {instant.time}</span>}
              </div>
            </div>
            {overlay === "chips" && instant.win && (
              <div className="iv-caption"><span className="iv-chip">{instant.win}</span></div>
            )}
            {overlay === "paper" && (
              <div className="iv-paper">
                {instant.win && <span className="cap">{instant.win}</span>}
                <span className="meta">{handle} · {instant.time}{instant.retakes != null ? " · " + retakeLab : ""}</span>
              </div>
            )}
          </React.Fragment>
        )}
      </div>

      <div className="iv-hint">{hint}</div>

      {/* Report sheet */}
      {reporting && (
        <div className="iv-report" onClick={closeReport}>
          <div className="iv-report-card" onClick={(e) => e.stopPropagation()}>
            <h4>Report this instant</h4>
            <p>Reports are anonymous. Someone kind takes a look at every one.</p>
            {["Not a real photo", "Hurtful or unkind", "Sensitive content", "Spam or ads"].map((r) => (
              <button key={r} className="iv-report-opt" onClick={() => { closeReport(); if (onReport) onReport(r); }}>
                {r}
              </button>
            ))}
            <button className="iv-report-cancel" onClick={closeReport}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────── Reusable camera stage (viewfinder → shot → accept) ─────────────
// Used camera-first in the Add-a-win flow; posting/attachment logic stays with the caller.
export function CameraCapture({ onDone, acceptLabel = "Use photo", full = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [sim, setSim] = useState(false);
  const [shot, setShot] = useState(null);
  const [retakes, setRetakes] = useState(0);

  useEffect(() => {
    let dead = false;
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 } },
          audio: false
        });
        if (dead) { s.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
        if (!dead) setSim(true);
      }
    }
    start();
    return () => {
      dead = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const snap = () => {
    if (sim) { setShot(genSimPhoto()); return; }
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = 720; c.height = 960;
    const ctx = c.getContext("2d");
    const scale = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
    const dw = v.videoWidth * scale, dh = v.videoHeight * scale;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1); // mirror, like the preview
    ctx.drawImage(v, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    setShot(c.toDataURL("image/jpeg", 0.85));
  };
  const retry = () => {
    if (retakes >= MAX_RETAKES) return;
    setShot(null);
    setRetakes((r) => r + 1);
  };
  const accept = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    onDone({ photo: shot, retakes });
  };

  return (
    <React.Fragment>
      <div className={"cap-stage" + (full ? " full" : "")}>
        <div className="cap-frame">
          <video ref={videoRef} autoPlay playsInline muted className={shot || sim ? "hide" : ""}></video>
          {sim && !shot && (
            <div className="cap-sim">
              <span className="instant-ph-tag">camera unavailable · simulated viewfinder</span>
            </div>
          )}
          {shot && <img className="cap-shot" src={shot} alt="Captured photo" />}
          {shot && (
            <span className="cap-badge">
              <Icon.Retry size={12} /> {retakes > 0 ? retakes + " retake" + (retakes === 1 ? "" : "s") : "first take"}
            </span>
          )}
        </div>
      </div>
      <div className={"cap-controls" + (full ? " overlay" : "")}>
        {!shot ? (
          <button className="shutter" onClick={snap} aria-label="Take photo"><span></span></button>
        ) : (
          <React.Fragment>
            <button className="ghost-btn cap-retry" disabled={retakes >= MAX_RETAKES} onClick={retry}>
              <Icon.Retry size={15} /> {retakes >= MAX_RETAKES ? "No retakes left" : "Retry · " + (MAX_RETAKES - retakes) + " left"}
            </button>
            <button className="primary-btn cap-post" onClick={accept}>
              <Icon.Check size={15} /> {acceptLabel}
            </button>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}

// ───────────── Capture screen (owner) ─────────────
export function CaptureInstantScreen({ winToday, frame = "clean", onBack, onPost }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [sim, setSim] = useState(false);
  const [shot, setShot] = useState(null);
  const [retakes, setRetakes] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let dead = false;
    async function start() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 720 } },
          audio: false
        });
        if (dead) { s.getTracks().forEach((tr) => tr.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
        if (!dead) setSim(true);
      }
    }
    start();
    return () => {
      dead = true;
      if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const snap = () => {
    if (sim) { setShot(genSimPhoto()); return; }
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = 720; c.height = 960;
    const ctx = c.getContext("2d");
    const scale = Math.max(c.width / v.videoWidth, c.height / v.videoHeight);
    const dw = v.videoWidth * scale, dh = v.videoHeight * scale;
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1); // mirror, like the preview
    ctx.drawImage(v, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
    setShot(c.toDataURL("image/jpeg", 0.85));
  };

  const retry = () => {
    if (retakes >= MAX_RETAKES) return;
    setShot(null);
    setRetakes((r) => r + 1);
  };

  const post = () => {
    setSending(true);
    if (streamRef.current) streamRef.current.getTracks().forEach((tr) => tr.stop());
    const photo = shot;
    const r = retakes;
    setTimeout(() => onPost({ photo, retakes: r }), 1600);
  };

  return (
    <div className="screen screen-enter capture-screen" data-screen-label="Capture instant">
      <TopBar
        title="Today's instant"
        subtitle="One photo a day — plays once"
        left={
          <button className="icon-btn left" onClick={onBack} aria-label="Back">
            <Icon.ArrowLeft />
          </button>
        } />

      <div className={"cap-stage" + (frame === "polaroid" ? " polaroid" : "")}>
        <div className="cap-frame">
          <video ref={videoRef} autoPlay playsInline muted className={shot || sim ? "hide" : ""}></video>
          {sim && !shot && (
            <div className="cap-sim">
              <span className="instant-ph-tag">camera unavailable · simulated viewfinder</span>
            </div>
          )}
          {shot && <img className="cap-shot" src={shot} alt="Your instant" />}
          {shot && (
            <span className="cap-badge">
              <Icon.Retry size={12} /> {retakes > 0 ? retakes + " retake" + (retakes === 1 ? "" : "s") : "first take"}
            </span>
          )}
        </div>
        {frame === "polaroid" && (
          <div className="cap-polaroid-cap">{winToday ? winToday.text : "…"}</div>
        )}
      </div>

      {winToday && frame !== "polaroid" && (
        <div className="cap-win">
          <span className="lab">Posts with today's win</span>
          <span className="txt">{winToday.text}</span>
        </div>
      )}

      <div className="cap-controls">
        {!shot ? (
          <button className="shutter" onClick={snap} aria-label="Take photo"><span></span></button>
        ) : (
          <React.Fragment>
            <button className="ghost-btn cap-retry" disabled={retakes >= MAX_RETAKES} onClick={retry}>
              <Icon.Retry size={15} /> {retakes >= MAX_RETAKES ? "No retakes left" : "Retry · " + (MAX_RETAKES - retakes) + " left"}
            </button>
            <button className="primary-btn cap-post" onClick={post}>
              <Icon.Sparkle4 size={14} /> Post instant
            </button>
          </React.Fragment>
        )}
      </div>

      {sending && (
        <div className="cap-sending">
          <div className="pulse"><Icon.Camera size={30} /></div>
          <div className="label">Sending your instant…</div>
        </div>
      )}
    </div>
  );
}

// ───────────── Today's instant card (Wins screen, owner) ─────────────
export function TodayInstantCard({ todayWin, myInstant, perspective, viewedMine, streak, onAddWin, onCapture, onView }) {
  return (
    <div className="today-instant">
      <div className="ti-head">
        <span className="ti-title"><Icon.Camera size={15} /> Today's instant</span>
        <span className="ti-flame"><Icon.Flame size={13} /> {streak}</span>
      </div>

      {!myInstant && !todayWin && (
        <div className="ti-empty featured">
          <div className="ti-polaroid">
            <div className="ti-polaroid-ph"><Icon.Camera size={24} /></div>
            <span className="ti-polaroid-cap">one photo · one view</span>
          </div>
          <h3 className="ti-headline">Capture today's moment</h3>
          <p>Log today's win to unlock your instant — one real photo, posted with your streak. Strangers can watch it once.</p>
          <button className="primary-btn sm" onClick={onAddWin}>
            <Icon.PlusBare size={13} /> Add today's win
          </button>
        </div>
      )}

      {!myInstant && todayWin && (
        <div className="ti-empty featured">
          <div className="ti-polaroid ready">
            <div className="ti-polaroid-ph"><Icon.Camera size={24} /></div>
            <span className="ti-polaroid-cap">win logged — ready</span>
          </div>
          <h3 className="ti-headline">Your instant is unlocked</h3>
          <p>Take one photo of this moment. It posts with your win and streak — each stranger gets a single view.</p>
          <button className="primary-btn sm" onClick={onCapture}>
            <Icon.Camera size={15} /> Capture today's instant
          </button>
        </div>
      )}

      {myInstant && perspective === "owner" && (
        <div className="ti-posted">
          <button className="ti-thumb" onClick={onView} aria-label="View your instant">
            <img src={myInstant.photo} alt="Today's instant" />
          </button>
          <div className="ti-meta">
            <span className="txt">{todayWin ? todayWin.text : "Your instant"}</span>
            <span className="sub">
              {fmtClock(myInstant.takenAt)}
              {myInstant.retakes > 0 ? " · " + myInstant.retakes + " retake" + (myInstant.retakes === 1 ? "" : "s") : " · first take"}
              {" · gone tomorrow"}
            </span>
          </div>
          <Icon.ArrowRight size={16} />
        </div>
      )}

      {myInstant && perspective === "stranger" && !viewedMine && (
        <button className="instant-seal" onClick={onView}>
          <span className="seal-ic"><Icon.Eye size={18} /></span>
          <span className="seal-lab">Tap to view — plays once</span>
          <small>This is how strangers see your post</small>
        </button>
      )}

      {myInstant && perspective === "stranger" && viewedMine && (
        <div className="instant-ghost">
          <span className="ghost-ic"><Icon.EyeOff size={16} /></span>
          <div className="ghost-txt">
            <span>Opened · photo expired</span>
            <small>The streak stays. The photo doesn't.</small>
          </div>
          <span className="ti-flame"><Icon.Flame size={13} /> {streak}</span>
        </div>
      )}
    </div>
  );
}

// ───────────── Stranger's win page ─────────────
export function StrangerWinsScreen({ author, instant, viewed, onBack, onOpen }) {
  const handle = handleFromNumber(author);
  const creature = handle.split(" ").slice(-1)[0] || "S";
  return (
    <div className="screen screen-enter stranger-screen" data-screen-label="Stranger wins">
      <TopBar
        title="Their wins"
        subtitle="Shared once a day"
        left={
          <button className="icon-btn left" onClick={onBack} aria-label="Back">
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="stranger-head">
        <div className="stranger-ava">{creature[0]}</div>
        <div className="stranger-id">
          <span className="nm">{handle}</span>
          <span className="author-token">@{author}</span>
        </div>
        {instant && <span className="ti-flame big"><Icon.Flame size={13} /> {instant.streak} day streak</span>}
      </div>

      {!instant && (
        <div className="empty-state">
          <div className="icon"><Icon.Camera size={24} /></div>
          <h4>No instant today</h4>
          <p>They haven't posted their daily photo yet.<br />Check back later.</p>
        </div>
      )}

      {instant && !viewed && (
        <div className="stranger-post">
          <div className="sp-lab">Today's instant · {instant.time}</div>
          <button className="instant-seal tall" onClick={onOpen}>
            <span className="seal-ic"><Icon.Eye size={20} /></span>
            <span className="seal-lab">Tap to view</span>
            <small>It plays once. Then it's gone for good.</small>
          </button>
        </div>
      )}

      {instant && viewed && (
        <div className="stranger-post">
          <div className="sp-lab">Today's instant · {instant.time}</div>
          <div className="instant-ghost tall">
            <span className="ghost-ic"><Icon.EyeOff size={18} /></span>
            <div className="ghost-txt">
              <span>You've seen this one</span>
              <small>Instants play once — this photo can't be reopened.</small>
            </div>
            <span className="ti-flame big"><Icon.Flame size={13} /> {instant.streak} day streak</span>
          </div>
        </div>
      )}

      <p className="stranger-note">Wins are private. Strangers share only one instant a day.</p>
    </div>
  );
}

// ───────────── Instants stack (Explore) — swipeable card stack ─────────────
export function InstantStack({ instants, viewedIds, onOpen, onSeen, onOpenStranger, onLike, onReport }) {
  const [drag, setDrag] = useState(0);
  const [flyOff, setFlyOff] = useState(0); // -1 / +1 while a card animates away
  const [liked, setLiked] = useState([]); // ids hearted this session
  const [reporting, setReporting] = useState(false);
  const startX = useRef(null);
  // Viewed instants vanish from the stack entirely — the top card is always live[0]
  const live = instants.filter((it) => !viewedIds.includes(it.id));
  const n = live.length;

  const advance = (dir) => {
    const top = live[0];
    setFlyOff(dir);
    setTimeout(() => {
      if (top) onSeen(top); // swiping past a shown photo consumes its one view
      setFlyOff(0);
      setDrag(0);
    }, 260);
  };
  const down = (e) => { if (flyOff) return; startX.current = e.clientX; };
  const move = (e) => { if (startX.current == null) return; setDrag(e.clientX - startX.current); };
  const up = (e) => {
    if (startX.current == null) return;
    const d = drag; startX.current = null;
    if (d < -70) advance(-1);
    else if (d > 70) advance(1);
    else {
      setDrag(0);
      // a still tap opens the fullscreen viewer (comment / report live there)
      if (e.type === "pointerup" && Math.abs(d) < 8 && !e.target.closest(".stack-id")) onOpen(live[0]);
    }
  };

  if (n === 0) return (
    <div className="instant-stack" data-screen-label="Instants stack">
      <div className="empty-state">
        <div className="icon"><Icon.Check size={24} /></div>
        <h4>All caught up</h4>
        <p>You've seen today's instants.<br />New ones arrive tomorrow.</p>
      </div>
    </div>
  );

  // Render up to 3 cards, front-most last so it sits on top
  const cards = [];
  for (let depth = Math.min(2, n - 1); depth >= 0; depth--) {
    const it = live[depth];
    const isTop = depth === 0;
    const dragging = isTop && startX.current != null;
    let tx = 0, rot = 0, scale = 1 - depth * 0.05, ty = depth * 14, op = 1 - depth * 0.12;
    if (isTop) {
      tx = flyOff ? flyOff * 520 : drag;
      rot = flyOff ? flyOff * 18 : drag * 0.04;
      op = flyOff ? 0 : 1;
    }
    const creature = handleFromNumber(it.author).split(" ").slice(-1)[0] || "?";
    cards.push(
      <div
        key={it.id + "-" + depth}
        className={"stack-card" + (isTop ? " top" : "")}
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)`,
          opacity: op,
          zIndex: 10 - depth,
          transition: dragging ? "none" : "transform 300ms cubic-bezier(.22,.61,.36,1), opacity 260ms"
        }}
        onPointerDown={isTop ? down : undefined}
        onPointerMove={isTop ? move : undefined}
        onPointerUp={isTop ? up : undefined}
        onPointerLeave={isTop ? up : undefined}>
        <div
          className="stack-cover"
          style={{
            background:
              `radial-gradient(120% 80% at 20% 12%, oklch(0.62 0.10 ${it.hue} / 0.9), transparent 55%),` +
              `radial-gradient(110% 90% at 84% 90%, oklch(0.42 0.10 ${it.hue2} / 0.9), transparent 60%),` +
              `oklch(0.26 0.05 ${it.hue2})`
          }}>
          <div className="stack-top">
            <span className="stack-flame"><Icon.Flame size={13} /> {it.streak + " day streak"}</span>
            <span className="stack-time"><Icon.Clock size={12} /> {it.time}</span>
          </div>

          <div className="stack-bottom">
            {it.win && <span className="stack-cap">{it.win}</span>}
            <button
              className="stack-id"
              onClick={(e) => { e.stopPropagation(); onOpenStranger(it.author); }}
              aria-label="See their wins">
              <span className="stack-ava">{creature[0]}</span>
              <span className="stack-nm">{handleFromNumber(it.author)}</span>
              <span className="author-token">@{it.author}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instant-stack" data-screen-label="Instants stack">
      <div className="stack-arena">
        {cards}

        {/* Report sheet — covers the card area */}
        {reporting && (
          <div className="stack-report" onClick={() => setReporting(false)}>
            <div className="iv-report-card" onClick={(e) => e.stopPropagation()}>
              <h4>Report this instant</h4>
              <p>Reports are anonymous. Someone kind takes a look at every one.</p>
              {["Not a real photo", "Hurtful or unkind", "Sensitive content", "Spam or ads"].map((r) => (
                <button key={r} className="iv-report-opt" onClick={() => { setReporting(false); if (onReport) onReport(live[0], r); }}>
                  {r}
                </button>
              ))}
              <button className="iv-report-cancel" onClick={() => setReporting(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div className="stack-actions">
        <button
          className={"stack-act" + (liked.includes(live[0].id) ? " on" : "")}
          aria-label="Like"
          onClick={() => {
            if (liked.includes(live[0].id)) return;
            setLiked((l) => [...l, live[0].id]);
            if (onLike) onLike(live[0]);
          }}>
          <Icon.Heart size={20} filled={liked.includes(live[0].id)} />
        </button>
        <button className="stack-act" aria-label="Report" onClick={() => setReporting(true)}>
          <Icon.Flag size={18} />
        </button>
      </div>
    </div>
  );
}

// ───────────── Instants rail (Home) ─────────────
// Built and exported but not currently mounted — the stack on Explore is the
// chosen discovery pattern (see the handoff notes).
export function InstantsRail({ instants, viewedIds, myInstant, onMine, onOpenStranger }) {
  return (
    <div className="instants-rail" data-screen-label="Instants rail">
      <button className="rail-item" onClick={onMine}>
        <span className={"rail-ava mine" + (myInstant ? " live" : " empty")}>
          {myInstant ? <img src={myInstant.photo} alt="" /> : <Icon.Camera size={18} />}
        </span>
        <span className="rail-lab">You</span>
      </button>
      {instants.map((it) => {
        const seen = viewedIds.includes(it.id);
        const creature = handleFromNumber(it.author).split(" ").slice(-1)[0] || "?";
        return (
          <button key={it.id} className="rail-item" onClick={() => onOpenStranger(it.author)}>
            <span className={"rail-ava" + (seen ? " seen" : " live")}>{creature[0]}</span>
            <span className="rail-lab">{seen ? "seen" : creature}</span>
          </button>
        );
      })}
    </div>
  );
}
