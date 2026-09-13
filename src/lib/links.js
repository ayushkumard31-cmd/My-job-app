// Shared plumbing for every built-in (non-Firestore) resource: the search-URL
// builders and the row shape the library screens render.
//
// It lives in its own module so ./starter, ./colleges and ./games can all use
// it while ./starter stays free to import the other two for its id index —
// putting this in ./starter would make that a cycle.

export const STARTER_PREFIX = "starter:";

export const isStarterId = (id) => typeof id === "string" && id.startsWith(STARTER_PREFIX);

// ----------------------------------------------------------------- urls --
// Search endpoints, not deep links. A hand-written direct URL for hundreds of
// colleges and subjects can't be verified from here and dies quietly; a search
// still lands on the right page after the site is redesigned.

export const ytSearch = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const webSearch = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;
export const bookSearch = (q) => `https://openlibrary.org/search?q=${encodeURIComponent(q)}`;
export const gfgSearch = (q) => `https://www.geeksforgeeks.org/?s=${encodeURIComponent(q)}`;
export const siteSearch = (site, q) => webSearch(`site:${site} ${q}`);

export const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------------------------------------------------------------- items --

/**
 * Shapes a built-in row exactly like a Firestore library document, so the same
 * cards, filters and like buttons work on both without knowing the difference.
 */
export function resourceItem(id, fields) {
  return {
    id: STARTER_PREFIX + id,
    scope: "subject",
    branch: null,
    semester: null,
    subject: null,
    unit: null,
    hobby: null,
    kind: "link",
    title: "",
    description: "",
    url: null,
    youtubeId: null,
    channel: null,
    fileName: null,
    storagePath: null,
    published: true,
    // Marks the card in the UI and keeps these sorted below whatever the
    // college's own admin published. See ./library's bySort.
    source: "starter",
    createdMs: 0,
    ...fields,
  };
}
