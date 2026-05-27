import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSessionToken } from '../lib/session';
import {
  fetchTodayPrompt,
  fetchArchivePrompts,
  fetchNotesByPrompt,
  fetchRandomNote,
  submitNote,
  likeNote as apiLikeNote,
  flagNote as apiFlagNote,
} from '../api/client';

const NotesContext = createContext(null);

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be inside NotesProvider');
  return ctx;
}

export function NotesProvider({ children }) {
  const [currentPrompt, setCurrentPrompt] = useState(null);
  const [notes, setNotes] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [likedNotes, setLikedNotes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sessionToken = getSessionToken();

  // Load initial data
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [prompt, archive] = await Promise.all([
          fetchTodayPrompt(),
          fetchArchivePrompts(),
        ]);
        setCurrentPrompt(prompt);
        setPrompts(archive);

        if (prompt?.id) {
          const notesList = await fetchNotesByPrompt(prompt.id);
          setNotes(notesList);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addNote = useCallback(async (content, promptId) => {
    const newNote = await submitNote(content, promptId);
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  }, []);

  const getRandomNote = useCallback(async (promptId) => {
    return fetchRandomNote(promptId);
  }, []);

  const likeNote = useCallback(async (noteId) => {
    const result = await apiLikeNote(noteId, sessionToken);
    if (result && !result.already_liked) {
      setLikedNotes((prev) => new Set([...prev, noteId]));
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, likes: result.likes } : n))
      );
    }
    return result;
  }, [sessionToken]);

  const hasLiked = useCallback((noteId) => likedNotes.has(noteId), [likedNotes]);

  const flagNote = useCallback(async (noteId) => {
    return apiFlagNote(noteId);
  }, []);

  const getNoteCount = useCallback(
    (promptId) => {
      const p = prompts.find((pr) => pr.id === promptId);
      return p?.note_count ?? 0;
    },
    [prompts]
  );

  const refreshNotes = useCallback(async () => {
    if (!currentPrompt?.id) return;
    const notesList = await fetchNotesByPrompt(currentPrompt.id);
    setNotes(notesList);
  }, [currentPrompt]);

  return (
    <NotesContext.Provider
      value={{
        currentPrompt, notes, prompts, loading, error,
        addNote, getRandomNote, likeNote, hasLiked, flagNote,
        getNoteCount, refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
