/**
 * Date Formatting Utility
 *
 * Converts ISO date strings (e.g. "2026-03-24") into
 * human-readable format (e.g. "Monday, March 24").
 */

/**
 * Format an ISO date string into a readable date.
 * @param {string} isoDate - e.g. "2026-03-24"
 * @returns {string} e.g. "Monday, March 24"
 */
export function formatDate(isoDate) {
  if (!isoDate) return '';

  try {
    // Parse the date — add T12:00 to avoid timezone offset issues
    const date = new Date(isoDate + 'T12:00:00');

    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate; // Fallback to raw string
  }
}

/**
 * Format a date to a short form for archive cards.
 * @param {string} isoDate - e.g. "2026-03-24"
 * @returns {string} e.g. "Tue, Mar 24"
 */
export function formatDateShort(isoDate) {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate + 'T12:00:00');

    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}
