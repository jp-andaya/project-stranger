/**
 * API Service — connects React frontend to FastAPI backend.
 *
 * Base URL defaults to localhost:8000 for development.
 * All functions return parsed JSON or throw on error.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Handle 204 No Content (e.g. DELETE)
    if (response.status === 204) return null;

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    // Re-throw API errors, wrap network errors
    if (error.message.startsWith('API error')) throw error;
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Is the backend running?');
    }
    throw error;
  }
}


// ──────────────────────────────────────
//  PROMPTS
// ──────────────────────────────────────

/**
 * Get today's daily prompt.
 * @returns {Promise<{id, text, category, scheduled_date, note_count}>}
 */
export async function fetchTodayPrompt() {
  return request('/api/prompts/today');
}

/**
 * Get archive of past prompts with note counts.
 * @param {number} limit - Max prompts to return (default 20)
 * @param {number} offset - Pagination offset
 * @returns {Promise<Array>}
 */
export async function fetchArchivePrompts(limit = 20, offset = 0) {
  return request(`/api/prompts/archive?limit=${limit}&offset=${offset}`);
}

/**
 * Get a specific prompt by ID.
 * @param {number} promptId
 * @returns {Promise<Object>}
 */
export async function fetchPrompt(promptId) {
  return request(`/api/prompts/${promptId}`);
}

/**
 * Create a new prompt (admin use).
 * @param {{text: string, category: string, scheduled_date: string}} data
 * @returns {Promise<Object>}
 */
export async function createPrompt(data) {
  return request('/api/prompts/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}


// ──────────────────────────────────────
//  NOTES
// ──────────────────────────────────────

/**
 * Submit an anonymous story.
 * @param {string} content - Story text (20-2000 chars)
 * @param {number} promptId - ID of the prompt
 * @returns {Promise<Object>} Created note
 */
export async function submitNote(content, promptId) {
  return request('/api/notes/', {
    method: 'POST',
    body: JSON.stringify({ content, prompt_id: promptId }),
  });
}

/**
 * Pick a random note from a prompt's bowl.
 * @param {number} promptId
 * @returns {Promise<Object>} Random note
 */
export async function fetchRandomNote(promptId) {
  return request(`/api/notes/random/${promptId}`);
}

/**
 * Get all visible notes for a prompt (paginated).
 * @param {number} promptId
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Array>}
 */
export async function fetchNotesByPrompt(promptId, limit = 20, offset = 0) {
  return request(`/api/notes/prompt/${promptId}?limit=${limit}&offset=${offset}`);
}

/**
 * Send warmth (like) to a note.
 * @param {number} noteId
 * @param {string} sessionToken - Anonymous session identifier
 * @returns {Promise<{note_id, likes, already_liked}>}
 */
export async function likeNote(noteId, sessionToken) {
  return request(`/api/notes/${noteId}/like`, {
    method: 'POST',
    body: JSON.stringify({ session_token: sessionToken }),
  });
}

/**
 * Check if a session has already liked a note.
 * @param {number} noteId
 * @param {string} sessionToken
 * @returns {Promise<{liked: boolean}>}
 */
export async function checkLiked(noteId, sessionToken) {
  return request(`/api/notes/${noteId}/liked?session_token=${sessionToken}`);
}


// ──────────────────────────────────────
//  ADMIN
// ──────────────────────────────────────

/**
 * Get all notes for moderation.
 * @param {number} limit
 * @param {number} offset
 * @param {boolean} showHidden
 * @returns {Promise<Array>}
 */
export async function fetchAllNotes(limit = 50, offset = 0, showHidden = true) {
  return request(`/api/admin/notes?limit=${limit}&offset=${offset}&show_hidden=${showHidden}`);
}

/**
 * Get flagged notes awaiting review.
 * @returns {Promise<Array>}
 */
export async function fetchFlaggedNotes() {
  return request('/api/admin/notes/flagged');
}

/**
 * Hide or unhide a note.
 * @param {number} noteId
 * @param {boolean} isHidden
 * @returns {Promise<Object>}
 */
export async function moderateNote(noteId, isHidden) {
  return request(`/api/admin/notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_hidden: isHidden }),
  });
}

/**
 * Permanently delete a note.
 * @param {number} noteId
 * @returns {Promise<null>}
 */
export async function deleteNote(noteId) {
  return request(`/api/admin/notes/${noteId}`, {
    method: 'DELETE',
  });
}

/**
 * Flag a note for moderator review.
 * @param {number} noteId
 * @returns {Promise<Object>}
 */
export async function flagNote(noteId) {
  return request(`/api/admin/notes/${noteId}/flag`, {
    method: 'POST',
  });
}

/**
 * Get admin dashboard stats.
 * @returns {Promise<{total_notes, total_prompts, total_likes, flagged_count, hidden_count}>}
 */
export async function fetchAdminStats() {
  return request('/api/admin/stats');
}
