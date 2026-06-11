import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  fetchTodayPrompt,
  fetchArchivePrompts,
  fetchNotesByPrompt,
  fetchRandomNote,
  submitNote,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        addNote, getRandomNote, flagNote,
        getNoteCount, refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
