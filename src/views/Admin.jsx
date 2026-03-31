import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/date';
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
      console.error('Failed to load admin data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showMessage = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const handleHide = async (noteId) => {
    try {
      await moderateNote(noteId, true);
      showMessage('Note hidden successfully');
      loadData();
    } catch (err) {
      showMessage('Failed to hide note');
    }
  };

  const handleUnhide = async (noteId) => {
    try {
      await moderateNote(noteId, false);
      showMessage('Note restored successfully');
      loadData();
    } catch (err) {
      showMessage('Failed to restore note');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Permanently delete this note? This cannot be undone.')) {
      return;
    }
    try {
      await deleteNote(noteId);
      showMessage('Note deleted permanently');
      loadData();
    } catch (err) {
      showMessage('Failed to delete note');
    }
  };

  if (loading) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title} style={{ color: theme.text }}>
          Admin Panel
        </h1>
        <p style={{ color: theme.textMuted, fontStyle: 'italic' }}>
          Loading moderation dashboard...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.main}>
        <h1 className={styles.title} style={{ color: theme.text }}>
          Admin Panel
        </h1>
        <p style={{ color: theme.accent }}>{error}</p>
        <p style={{ color: theme.textMuted, marginTop: '8px', fontSize: '14px' }}>
          Make sure the backend is running.
        </p>
      </main>
    );
  }

  const currentNotes = activeTab === 'flagged' ? flaggedNotes : allNotes;

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.title} style={{ color: theme.text }}>
          Admin Panel
        </h1>
        <button
          className={styles.backButton}
          onClick={() => onNavigate('home')}
          style={{ color: theme.textMuted }}
        >
          ← Back to app
        </button>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div
          className={styles.actionMsg}
          style={{ backgroundColor: theme.accent, color: '#0a0a0b' }}
        >
          {actionMsg}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className={styles.statsGrid}>
          <div
            className={styles.statCard}
            style={{ backgroundColor: theme.cardBg }}
          >
            <div className={styles.statValue} style={{ color: theme.text }}>
              {stats.total_notes}
            </div>
            <div className={styles.statLabel} style={{ color: theme.textMuted }}>
              Total Notes
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{ backgroundColor: theme.cardBg }}
          >
            <div className={styles.statValue} style={{ color: theme.text }}>
              {stats.total_prompts}
            </div>
            <div className={styles.statLabel} style={{ color: theme.textMuted }}>
              Prompts
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{ backgroundColor: theme.cardBg }}
          >
            <div className={styles.statValue} style={{ color: theme.text }}>
              {stats.total_likes}
            </div>
            <div className={styles.statLabel} style={{ color: theme.textMuted }}>
              Total Warmth
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{
              backgroundColor: stats.flagged_count > 0
                ? 'rgba(201, 100, 80, 0.15)'
                : theme.cardBg,
            }}
          >
            <div
              className={styles.statValue}
              style={{
                color: stats.flagged_count > 0 ? '#e07060' : theme.text,
              }}
            >
              {stats.flagged_count}
            </div>
            <div className={styles.statLabel} style={{ color: theme.textMuted }}>
              Flagged
            </div>
          </div>
          <div
            className={styles.statCard}
            style={{ backgroundColor: theme.cardBg }}
          >
            <div className={styles.statValue} style={{ color: theme.textMuted }}>
              {stats.hidden_count}
            </div>
            <div className={styles.statLabel} style={{ color: theme.textMuted }}>
              Hidden
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'flagged' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('flagged')}
          style={{
            color: activeTab === 'flagged' ? theme.text : theme.textMuted,
            borderBottomColor: activeTab === 'flagged' ? theme.accent : 'transparent',
          }}
        >
          Flagged ({flaggedNotes.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
          style={{
            color: activeTab === 'all' ? theme.text : theme.textMuted,
            borderBottomColor: activeTab === 'all' ? theme.accent : 'transparent',
          }}
        >
          All Notes ({allNotes.length})
        </button>
      </div>

      {/* Notes List */}
      <div className={styles.notesList}>
        {currentNotes.length === 0 ? (
          <p
            className={styles.emptyState}
            style={{ color: theme.textMuted }}
          >
            {activeTab === 'flagged'
              ? 'No flagged notes — all clear!'
              : 'No notes found.'}
          </p>
        ) : (
          currentNotes.map((note) => (
            <div
              key={note.id}
              className={styles.noteCard}
              style={{
                backgroundColor: theme.cardBg,
                borderLeftColor: note.is_flagged
                  ? '#e07060'
                  : note.is_hidden
                  ? theme.textMuted
                  : theme.accent,
                opacity: note.is_hidden ? 0.5 : 1,
              }}
            >
              <div className={styles.noteHeader}>
                <div className={styles.noteMeta}>
                  <span
                    className={styles.noteId}
                    style={{ color: theme.textMuted }}
                  >
                    #{note.id}
                  </span>
                  {note.is_flagged && (
                    <span className={styles.badge} style={{ backgroundColor: 'rgba(224, 112, 96, 0.15)', color: '#e07060' }}>
                      ⚑ Flagged
                    </span>
                  )}
                  {note.is_hidden && (
                    <span className={styles.badge} style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: theme.textMuted }}>
                      Hidden
                    </span>
                  )}
                  <span style={{ color: theme.textMuted, fontSize: '12px' }}>
                    {note.time_ago} · ♥ {note.likes}
                  </span>
                </div>
              </div>

              <p
                className={styles.noteContent}
                style={{ color: theme.textWhite }}
              >
                {note.content}
              </p>

              <div className={styles.noteActions}>
                {!note.is_hidden ? (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleHide(note.id)}
                    style={{
                      borderColor: theme.border,
                      color: theme.textMuted,
                    }}
                  >
                    Hide
                  </button>
                ) : (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleUnhide(note.id)}
                    style={{
                      borderColor: theme.accent,
                      color: theme.accent,
                    }}
                  >
                    Restore
                  </button>
                )}
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDelete(note.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Refresh button */}
      <div className={styles.refreshRow}>
        <button
          className={styles.refreshButton}
          onClick={loadData}
          style={{ borderColor: theme.border, color: theme.textMuted }}
        >
          Refresh Data
        </button>
      </div>
    </main>
  );
};

export default Admin;
