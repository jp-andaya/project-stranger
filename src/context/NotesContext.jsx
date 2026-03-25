/**
 * NotesContext — wired to FastAPI backend.
 *
 * Replaces the previous local-state-only version.
 * All data now comes from /api/* endpoints.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchTodayPrompt,
  fetchArchivePrompts,
  fetchNotesByPrompt,
  fetchRandomNote,
  submitNote,
  likeNote as apiLikeNote,
  flagNote as apiFlagNote,
} from '../services/api';
import { getSessionToken } from '../utils/session';

const NotesContext = createContext();

export const useNotes = () => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
};

export const NotesProvider = ({ children }) => {
  // ── State ──────────────────────────
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [prompts, setPrompts] = useState([]);           // archive
  const [notes, setNotes] = useState([]);                // notes for current prompt
  const [likedNotes, setLikedNotes] = useState([]);      // locally tracked liked IDs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionToken = getSessionToken();

  // ── Load today's prompt + notes on mount ──
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Fetch today's prompt
        const prompt = await fetchTodayPrompt();
        setCurrentPrompt(prompt);

        // Fetch notes for today's prompt
        const promptNotes = await fetchNotesByPrompt(prompt.id);
        setNotes(promptNotes);

        // Fetch archive
        const archive = await fetchArchivePrompts();
        setPrompts(archive);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  // ── Get notes for a specific prompt ──
  const getNotesByPrompt = useCallback(
    (promptId) => {
      if (currentPrompt && promptId === currentPrompt.id) {
        return notes;
      }
      // For archive prompts, return empty (notes load on demand)
      return [];
    },
    [currentPrompt, notes]
  );

  // ── Get notes count for a prompt (from archive data) ──
  const getNoteCount = useCallback(
    (promptId) => {
      if (currentPrompt && promptId === currentPrompt.id) {
        return notes.length;
      }
      const prompt = prompts.find((p) => p.id === promptId);
      return prompt ? prompt.note_count : 0;
    },
    [currentPrompt, notes, prompts]
  );

  // ── Pick a random note ──
  const getRandomNote = useCallback(
    async (promptId) => {
      try {
        const note = await fetchRandomNote(promptId);
        return note;
      } catch (err) {
        console.error('Failed to pick random note:', err);
        return null;
      }
    },
    []
  );

  // ── Submit a new note ──
  const addNote = useCallback(
    async (content, promptId) => {
      try {
        const newNote = await submitNote(content, promptId);
        // Add to local state so it appears immediately
        setNotes((prev) => [newNote, ...prev]);
        // Update archive note count
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === promptId ? { ...p, note_count: p.note_count + 1 } : p
          )
        );
        return newNote;
      } catch (err) {
        console.error('Failed to submit note:', err);
        throw err;
      }
    },
    []
  );

  // ── Like a note ──
  const likeNote = useCallback(
    async (noteId) => {
      if (likedNotes.includes(noteId)) return;

      try {
        const result = await apiLikeNote(noteId, sessionToken);

        if (!result.already_liked) {
          // Update local state for immediate UI feedback
          setNotes((prev) =>
            prev.map((note) =>
              note.id === noteId ? { ...note, likes: result.likes } : note
            )
          );
          setLikedNotes((prev) => [...prev, noteId]);
        }

        return result;
      } catch (err) {
        console.error('Failed to like note:', err);
      }
    },
    [likedNotes, sessionToken]
  );

  // ── Check if liked ──
  const hasLiked = useCallback(
    (noteId) => likedNotes.includes(noteId),
    [likedNotes]
  );

  // ── Flag a note ──
  const flagNoteForReview = useCallback(async (noteId) => {
    try {
      await apiFlagNote(noteId);
      return true;
    } catch (err) {
      console.error('Failed to flag note:', err);
      return false;
    }
  }, []);

  // ── Refresh notes for current prompt ──
  const refreshNotes = useCallback(async () => {
    if (!currentPrompt) return;
    try {
      const freshNotes = await fetchNotesByPrompt(currentPrompt.id);
      setNotes(freshNotes);
    } catch (err) {
      console.error('Failed to refresh notes:', err);
    }
  }, [currentPrompt]);

  return (
    <NotesContext.Provider
      value={{
        notes,
        prompts,
        currentPrompt,
        loading,
        error,
        getNotesByPrompt,
        getNoteCount,
        getRandomNote,
        likeNote,
        hasLiked,
        addNote,
        flagNoteForReview,
        refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;
