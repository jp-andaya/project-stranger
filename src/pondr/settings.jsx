// settings.jsx — account settings: update details, privacy, delete account.
// Ported from the design handoff (pondr-settings.jsx); the Gear icon lives in
// icons.jsx alongside the rest of the set.

import React, { useEffect, useState } from 'react';
import { Icon } from './icons.jsx';
import { TopBar } from './screens.jsx';

export function SettingsScreen({ handle, number, email, winsNamePublic, onToggleWinsName, profilePrivate, onToggleProfilePrivate, onBack, onSave, onDelete, checkHandle }) {
  const [name, setName] = useState(handle || "");
  const [mail, setMail] = useState(email || "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [taken, setTaken] = useState(false);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const dirty = name.trim() !== (handle || "") || mail.trim() !== (email || "");

  // Debounced live availability check; the user's current handle is always ok.
  useEffect(() => {
    setErr(null);
    const trimmed = name.trim();
    const isOwn = trimmed.toLowerCase() === (handle || "").trim().toLowerCase();
    if (trimmed.length < 3 || isOwn || !checkHandle) { setTaken(false); return; }
    let stale = false;
    const id = setTimeout(async () => {
      try {
        const available = await checkHandle(trimmed);
        if (!stale) setTaken(!available);
      } catch { /* offline — server re-checks on save */ }
    }, 300);
    return () => { stale = true; clearTimeout(id); };
  }, [name, handle, checkHandle]);

  const save = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onSave({ handle: name.trim(), email: mail.trim() });
    } catch (e) {
      if (e.status === 409) setErr(e.message || "That name or email is already in use");
      else setErr(e.message || "Couldn't save — try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen screen-enter" data-screen-label="Settings">
      <TopBar
        title="Settings"
        left={
        <button className="icon-btn left" onClick={onBack} aria-label="Back">
            <Icon.ArrowLeft />
          </button>
        } />

      <div className="profile-section">Your details</div>
      <div className="settings-card">
        <label className="settings-field">
          <span className="lab">Username</span>
          <input
            value={name}
            maxLength={24}
            placeholder="Your username"
            onChange={(e) => setName(e.target.value)} />
          {taken && <span className="sub" style={{ color: "oklch(0.5 0.14 25)" }}>That username is taken — try another.</span>}
        </label>
        <label className="settings-field">
          <span className="lab">Email</span>
          <input
            type="email"
            value={mail}
            maxLength={64}
            placeholder="you@somewhere.com"
            onChange={(e) => setMail(e.target.value)} />
        </label>
        <div className="settings-token">
          <span className="lab">Your number</span>
          <span className="author-token mine">@{number}</span>
          <span className="sub">Numbers can't be changed — they keep Pondr anonymous.</span>
        </div>
        {err && <span className="sub" style={{ color: "oklch(0.5 0.14 25)" }} role="alert">{err}</span>}
        <button
          className="primary-btn sm"
          disabled={!dirty || taken || busy || name.trim().length < 3}
          onClick={save}>
          <Icon.Check size={14} /> {busy ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="profile-section">Privacy</div>
      <div className="profile-list">
        <div className="profile-row">
          <span className="profile-row-ic"><Icon.Camera size={18} /></span>
          <div className="profile-row-text">
            <span className="lab">Show username on win captures</span>
            <span className="sub">{winsNamePublic ? "Strangers see your username on your wins" : "Your wins post as “Anonymous”"}</span>
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
            <span className="sub">No username is shown on notes. Your ID tag is stored privately for safety.</span>
          </div>
        </div>
      </div>

      <div className="profile-section">Danger zone</div>
      <div className="settings-card danger">
        <p>Deleting your account removes your notes, wins, instants and streak for good. There's no way back.</p>
        <button className="settings-delete" onClick={() => setConfirmDelete(true)}>
          Delete my account
        </button>
      </div>

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="settings-confirm-title">Delete your account?</h3>
            <p className="settings-confirm-body">This wipes everything — your notes, wins, instants and streak. It cannot be undone.</p>
            <button className="settings-delete solid" onClick={onDelete}>
              Yes, delete everything
            </button>
            <button className="ghost-btn" onClick={() => setConfirmDelete(false)}>
              Keep my account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
