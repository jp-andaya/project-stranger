import { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/cn';
import {
  fetchAdminStats, fetchFlaggedNotes, fetchAllNotes,
  moderateNote, deleteNote,
} from '../api/client';

export default function AdminPage({ go }) {
  const [stats, setStats] = useState(null);
  const [flagged, setFlagged] = useState([]);
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('flagged');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [s, f, a] = await Promise.all([fetchAdminStats(), fetchFlaggedNotes(), fetchAllNotes(50, 0, true)]);
      setStats(s); setFlagged(f); setAll(a);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const hide = async (id) => { await moderateNote(id, true); flash('Note hidden'); load(); };
  const unhide = async (id) => { await moderateNote(id, false); flash('Note restored'); load(); };
  const del = async (id) => { if (!window.confirm('Permanently delete?')) return; await deleteNote(id); flash('Deleted'); load(); };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <h1 className="font-serif text-3xl text-[#2E1A6E] mb-4">Admin Panel</h1>
      <p className="text-[#2E1A6E]/35 italic">Loading...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <h1 className="font-serif text-3xl text-[#2E1A6E] mb-4">Admin Panel</h1>
      <div className="p-5 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] border-l-[3px] border-l-[#ff6b5a] rounded-xl">
        <p className="text-[#2E1A6E]">{error}</p>
        <p className="text-sm text-[#2E1A6E]/35 mt-1">Make sure the backend is running.</p>
      </div>
    </div>
  );

  const notes = tab === 'flagged' ? flagged : all;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
      <div className="flex justify-between items-center mb-7">
        <h1 className="font-serif text-3xl text-[#2E1A6E]">Admin Panel</h1>
        <button onClick={() => go('home')} className="text-[0.6875rem] text-[#2E1A6E]/35 hover:text-[#2E1A6E]/60 transition-colors cursor-pointer">Back to app</button>
      </div>

      {msg && <div className="px-5 py-2.5 mb-5 rounded-full bg-[#2E1A6E] text-[#F2EDE4] text-sm font-medium text-center animate-[fadeIn_0.3s]">{msg}</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-2.5 mb-7">
          {[
            { l: 'Total Notes', v: stats.total_notes },
            { l: 'Prompts', v: stats.total_prompts },
            { l: 'Flagged', v: stats.flagged_count, d: stats.flagged_count > 0 },
            { l: 'Hidden', v: stats.hidden_count },
          ].map((s) => (
            <div key={s.l} className={cn(
              'p-4 text-center rounded-xl bg-[#EAE2F8] border border-[#2E1A6E]/[0.08]',
              s.d && 'border-[#ff6b5a]/30 bg-[#ff6b5a]/[0.08]'
            )}>
              <div className={cn('font-serif text-xl mb-1', s.d ? 'text-[#ff6b5a]' : 'text-[#2E1A6E]')}>{s.v}</div>
              <div className="font-mono text-[0.6875rem] text-[#2E1A6E]/35 tracking-widest uppercase">{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 mb-5 border-b border-[#2E1A6E]/[0.06]">
        {['flagged', 'all'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2.5 text-sm border-b-2 transition-colors cursor-pointer',
              tab === t ? 'text-[#2E1A6E] border-[#2E1A6E]' : 'text-[#2E1A6E]/35 border-transparent hover:text-[#2E1A6E]/60'
            )}
          >
            {t === 'flagged' ? `Flagged (${flagged.length})` : `All Notes (${all.length})`}
          </button>
        ))}
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-2.5">
        {notes.length === 0 ? (
          <p className="text-center text-[#2E1A6E]/35 italic py-10">
            {tab === 'flagged' ? 'No flagged notes — all clear' : 'No notes found.'}
          </p>
        ) : notes.map((n) => (
          <div
            key={n.id}
            className={cn(
              'p-5 bg-[#EAE2F8] border border-[#2E1A6E]/[0.08] rounded-xl',
              n.is_flagged && 'border-l-[3px] border-l-[#ff6b5a]',
              n.is_hidden && 'opacity-50'
            )}
          >
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35">#{n.id}</span>
              {n.is_flagged && <span className="px-2.5 py-0.5 rounded-full bg-[#ff6b5a]/[0.12] text-[#ff6b5a] font-mono text-[0.6875rem]">Flagged</span>}
              {n.is_hidden && <span className="px-2.5 py-0.5 rounded-full bg-[#2E1A6E]/[0.08] text-[#2E1A6E]/35 font-mono text-[0.6875rem]">Hidden</span>}
              <span className="font-mono text-[0.6875rem] text-[#2E1A6E]/35">{n.time_ago}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#2E1A6E]/60 mb-3.5">{n.content}</p>
            <div className="flex gap-2">
              {!n.is_hidden ? (
                <button onClick={() => hide(n.id)} className="px-4 py-1.5 border border-[#2E1A6E]/[0.08] rounded-full text-[0.6875rem] text-[#2E1A6E]/35 hover:bg-[#E2D8F5] transition-all cursor-pointer">Hide</button>
              ) : (
                <button onClick={() => unhide(n.id)} className="px-4 py-1.5 border border-[#2E1A6E]/30 rounded-full text-[0.6875rem] text-[#2E1A6E] hover:bg-[#EAE2F8] transition-all cursor-pointer">Restore</button>
              )}
              <button onClick={() => del(n.id)} className="px-4 py-1.5 border border-[#ff6b5a]/30 rounded-full text-[0.6875rem] text-[#ff6b5a] hover:bg-[#ff6b5a]/[0.08] transition-all cursor-pointer">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-7">
        <button onClick={load} className="px-6 py-2.5 border border-[#2E1A6E]/[0.08] rounded-full text-[0.6875rem] text-[#2E1A6E]/35 hover:bg-[#EAE2F8] transition-all cursor-pointer">
          Refresh Data
        </button>
      </div>
    </div>
  );
}
