import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  fetchAdminStats,
  fetchFlaggedNotes,
  fetchAllNotes,
  moderateNote,
  deleteNote,
} from '../services/api';
import styles from './Admin.module.css';

const Admin = ({ onNavigate }) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [flaggedNotes, setFlaggedNotes] = useState([]);
  const [allNotes, setAllNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('flagged');
  const [actionMsg, setActionMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, flaggedData, notesData] = await Promise.all([
        fetchAdminStats(),
        fetchFlaggedNotes(),
        fetchAllNotes(50, 0, true),
      ]);
      setStats(statsData);
      setFlaggedNotes(flaggedData);
      setAllNotes(notesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMessage = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleHide = async (noteId) => {
    try { await moderateNote(noteId, true); showMessage('Note hidden'); loadData(); }
    catch { showMessage('Failed to hide note'); }
  };

  const handleUnhide = async (noteId) => {
    try { await moderateNote(noteId, false); showMessage('Note restored'); loadData(); }
    catch { showMessage('Failed to restore note'); }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Permanently delete this note?')) return;
    try { await deleteNote(noteId); showMessage('Note deleted'); loadData(); }
    catch { showMessage('Failed to delete note'); }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Admin Panel</h1>
        <p className={styles.loadingText}>Loading moderation dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title}>Admin Panel</h1>
        <div className={styles.errorCard}>
          <p>{error}</p>
          <p className={styles.errorHint}>Make sure the backend is running.</p>
        </div>
      </main>
    );
  }

  const currentNotes = activeTab === 'flagged' ? flaggedNotes : allNotes;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title}>Admin Panel</h1>
        <button className={styles.backButton} onClick={() => onNavigate('home')}>
          Back to app
        </button>
      </div>

      {actionMsg && <div className={styles.actionMsg}>{actionMsg}</div>}

      {stats && (
        <div className={styles.statsGrid}>
          {[
            { label: 'Total Notes', value: stats.total_notes },
            { label: 'Prompts', value: stats.total_prompts },
            { label: 'Total Warmth', value: stats.total_likes },
            { label: 'Flagged', value: stats.flagged_count, danger: stats.flagged_count > 0 },
            { label: 'Hidden', value: stats.hidden_count },
          ].map((stat) => (
            <div
              key={stat.label}
              className={styles.statCard}
              data-danger={stat.danger ? '' : undefined}
            >
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.tabs}>
        <button
          className={styles.tab}
          data-active={activeTab === 'flagged' ? '' : undefined}
          onClick={() => setActiveTab('flagged')}
        >
          Flagged ({flaggedNotes.length})
        </button>
        <button
          className={styles.tab}
          data-active={activeTab === 'all' ? '' : undefined}
          onClick={() => setActiveTab('all')}
        >
          All Notes ({allNotes.length})
        </button>
      </div>

      <div className={styles.notesList}>
        {currentNotes.length === 0 ? (
          <p className={styles.emptyState}>
            {activeTab === 'flagged' ? 'No flagged notes — all clear' : 'No notes found.'}
          </p>
        ) : (
          currentNotes.map((note) => (
            <div
              key={note.id}
              className={styles.noteCard}
              data-flagged={note.is_flagged ? '' : undefined}
              data-hidden={note.is_hidden ? '' : undefined}
            >
              <div className={styles.noteMeta}>
                <span className={styles.noteId}>#{note.id}</span>
                {note.is_flagged && <span className={styles.badge} data-type="danger">Flagged</span>}
                {note.is_hidden && <span className={styles.badge} data-type="muted">Hidden</span>}
                <span className={styles.noteTime}>{note.time_ago} · {note.likes} warmth</span>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
              <div className={styles.noteActions}>
                {!note.is_hidden ? (
                  <button className={styles.actionButton} onClick={() => handleHide(note.id)}>Hide</button>
                ) : (
                  <button className={styles.actionButton} data-type="restore" onClick={() => handleUnhide(note.id)}>Restore</button>
                )}
                <button className={styles.actionButton} data-type="danger" onClick={() => handleDelete(note.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.refreshRow}>
        <button className={styles.refreshButton} onClick={loadData}>Refresh Data</button>
      </div>
    </main>
  );
};

export default Admin;
