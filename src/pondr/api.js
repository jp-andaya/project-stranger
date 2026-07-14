// api.js — Pondr API client. Same-origin "/api" (vite dev proxy + nginx in
// Docker both forward to the FastAPI backend). Bearer token lives in
// localStorage("pondr.token"); a 401 anywhere logs the user out via onUnauthorized.

const TOKEN_KEY = "pondr.token";

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
export const setToken = (t) => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } };
export const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

let onUnauthorized = null;
export const setOnUnauthorized = (fn) => { onUnauthorized = fn; };

export class ApiError extends Error {
  constructor(status, detail) {
    // FastAPI's detail can be a string or an object (e.g. cooldown payloads).
    super(typeof detail === "string" ? detail : (detail && detail.message) || "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch("/api" + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    if (onUnauthorized) onUnauthorized();
  }
  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) throw new ApiError(res.status, data ? data.detail : res.statusText);
  return data;
}

// ── Auth / account ──
export const signup = (email, password) => apiFetch("/auth/signup", { method: "POST", body: { email, password } });
export const login = (email, password) => apiFetch("/auth/login", { method: "POST", body: { email, password } });
export const getMe = () => apiFetch("/auth/me");
export const completeOnboarding = (handle, winsNamePublic, profilePrivate) =>
  apiFetch("/auth/onboarding", { method: "POST", body: { handle, wins_name_public: winsNamePublic, profile_private: profilePrivate } });
export const updateMe = (patch) => apiFetch("/auth/me", { method: "PATCH", body: patch });
export const deleteMe = () => apiFetch("/auth/me", { method: "DELETE" });
export const handleCheck = (handle) => apiFetch("/auth/handle-check?handle=" + encodeURIComponent(handle));

// ── Prompts + suggestions ──
export const getPromptArchive = (limit = 50) => apiFetch("/prompts/archive?limit=" + limit);
export const suggestPrompt = (text) => apiFetch("/prompts/suggestions", { method: "POST", body: { text } });
export const getMySuggestions = () => apiFetch("/prompts/suggestions/mine");

// ── Notes ──
export const createNote = ({ promptId, title, content, category, anonymous = true }) =>
  apiFetch("/notes/", { method: "POST", body: { prompt_id: promptId, title, content, category, is_anonymous: anonymous } });
export const getNotesFeed = (promptId, category) =>
  apiFetch("/notes/prompt/" + promptId + (category ? "?category=" + encodeURIComponent(category) : ""));
export const getMyNotes = () => apiFetch("/notes/mine");
export const getRandomNote = (promptId) => apiFetch("/notes/random/" + promptId);
export const likeNote = (id) => apiFetch("/notes/" + id + "/like", { method: "POST" });
export const unlikeNote = (id) => apiFetch("/notes/" + id + "/like", { method: "DELETE" });

// ── Wins ──
export const getMyWins = () => apiFetch("/wins/mine");
export const getWinsSummary = () => apiFetch("/wins/summary");
export const createWin = ({ icon, text, photo, isPrivate = false, retakes = 0 }) =>
  apiFetch("/wins/", { method: "POST", body: { icon, text, photo, is_private: isPrivate, retakes } });
export const updateWin = (id, patch) => apiFetch("/wins/" + id, { method: "PATCH", body: patch });
export const deleteWin = (id) => apiFetch("/wins/" + id, { method: "DELETE" });
export const likeWin = (id) => apiFetch("/wins/" + id + "/like", { method: "POST" });
export const unlikeWin = (id) => apiFetch("/wins/" + id + "/like", { method: "DELETE" });
export const commentOnWin = (id, text) => apiFetch("/wins/" + id + "/comments", { method: "POST", body: { text } });

// ── Instants ──
export const captureInstant = ({ photo, retakes = 0 }) =>
  apiFetch("/instants/", { method: "POST", body: { photo, retakes } });
export const getMyInstantToday = () => apiFetch("/instants/mine/today");
export const getExplore = () => apiFetch("/instants/explore");
export const viewInstant = (id) => apiFetch("/instants/" + id + "/view", { method: "POST" });
export const likeInstant = (id) => apiFetch("/instants/" + id + "/like", { method: "POST" });
export const getStrangerProfile = (number) => apiFetch("/instants/users/" + number);

// ── Reports + donations ──
// Only instants have a report UI today; the backend also accepts note_id if
// a report-a-note flow gets built later (POST /api/reports/ with note_id).
export const reportInstant = (instantId, reason) =>
  apiFetch("/reports/", { method: "POST", body: { instant_id: instantId, reason } });
export const recordDonation = (amountPence, frequency = "once") =>
  apiFetch("/donations/", { method: "POST", body: { amount_pence: amountPence, frequency } });
