/**
 * Session Token Utility
 *
 * Generates and persists an anonymous session token in sessionStorage.
 * Used to prevent duplicate likes without requiring user accounts.
 *
 * - Token is a random 32-char hex string
 * - Persists for the browser session only (cleared on tab close)
 * - No personal information is stored or transmitted
 */

const SESSION_KEY = 'stranger_session_token';

/**
 * Generate a cryptographically random hex string.
 * @param {number} length - Number of hex characters
 * @returns {string}
 */
function generateToken(length = 32) {
  const array = new Uint8Array(length / 2);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the current session token, creating one if it doesn't exist.
 * @returns {string} 32-character hex token
 */
export function getSessionToken() {
  let token = sessionStorage.getItem(SESSION_KEY);
  if (!token) {
    token = generateToken();
    sessionStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

/**
 * Clear the session token (e.g. for testing).
 */
export function clearSessionToken() {
  sessionStorage.removeItem(SESSION_KEY);
}
