// Pure classification logic: takes the visible text lines of a feed post and
// decides what kind of post it is. Kept DOM-free so it can be tested in Node.
//
// LinkedIn changes its markup often, so this deliberately keys off visible
// text ("Promoted", "• 1st", "likes this") rather than CSS class names.

(function (root) {
  const MAX_HEADER_LINES = 12;

  // "3h •", "2d • Edited •", "1w", "5mo •" — the timestamp ends the header.
  const TIMESTAMP_RE = /^\d+\s?(s|m|h|d|w|mo|yr|y)\b\s*(•|·|$)/i;

  const PROMOTED_RE = /^promoted( by .*)?$/i;
  const SUGGESTED_RE = /^(suggested|recommended for you)$/i;

  // "Jane Doe likes this", "Jane Doe and 3 others like this",
  // "Jane Doe finds this funny", "Jane Doe commented" (newer feed drops
  // "on this"). Banners end with "this" (optionally one more word) or with
  // the bare comment/reply verb.
  const ACTIVITY_RE =
    /\b((likes?|loves?|celebrates?|supports?|finds?|reacted to)\s+this(\s+\w+)?|(commented|replied)(\s+on|\s+to)?(\s+this)?|contributed to this)$/i;
  const REPOST_RE = /\breposted( this)?$/i;

  // "• 1st", "· 1st", "1st", "1st degree connection"
  const FIRST_DEGREE_RE = /(^|[•·\s])1st\b/i;
  const YOU_RE = /^[•·]?\s*you$/i;
  const OTHER_DEGREE_RE = /(^|[•·\s])(2nd|3rd\+?)\b/i;
  const FOLLOWERS_RE = /^[\d,.]+\s*[KM]?\s+followers$/i;

  function headerLines(lines) {
    const out = [];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      out.push(line);
      if (TIMESTAMP_RE.test(line) || out.length >= MAX_HEADER_LINES) break;
    }
    return out;
  }

  /**
   * @param {string[]} lines  innerText of the post split on newlines
   * @returns {{category: string, detail: string}}
   *   category is one of: promoted, suggested, own, network, activity,
   *   repost, company, other, unknown
   */
  function classifyPost(lines) {
    const header = headerLines(lines);
    if (header.length < 2) return { category: "unknown", detail: "" };

    const find = (re) => header.find((l) => re.test(l));
    // Activity/repost banners sit above the author's name and degree, so only
    // look there; that way a headline mentioning "likes ... this" can't match.
    const degreeAt = header.findIndex(
      (l) => FIRST_DEGREE_RE.test(l) || OTHER_DEGREE_RE.test(l) || YOU_RE.test(l)
    );
    const banner = degreeAt === -1 ? header : header.slice(0, degreeAt);
    const findShort = (re) => banner.find((l) => l.length < 140 && re.test(l));

    let hit;
    if ((hit = find(PROMOTED_RE))) return { category: "promoted", detail: hit };
    if ((hit = find(SUGGESTED_RE))) return { category: "suggested", detail: hit };

    // Check the banner before the author's degree: on a "Jane likes this"
    // post, the degree marker belongs to the original author, not Jane.
    if ((hit = findShort(REPOST_RE))) return { category: "repost", detail: hit };
    if ((hit = findShort(ACTIVITY_RE))) return { category: "activity", detail: hit };

    if (find(YOU_RE)) return { category: "own", detail: "" };
    if (find(FIRST_DEGREE_RE)) return { category: "network", detail: "" };
    if ((hit = find(OTHER_DEGREE_RE))) return { category: "other", detail: hit };
    if ((hit = find(FOLLOWERS_RE))) return { category: "company", detail: hit };

    // A complete header (we reached the timestamp) with no network signal.
    if (TIMESTAMP_RE.test(header[header.length - 1])) {
      return { category: "other", detail: "" };
    }
    return { category: "unknown", detail: "" };
  }

  // Show what your network wrote, liked, commented on or reposted.
  // "unknown" stays visible: never hide something we couldn't read.
  const SHOWN = ["own", "network", "activity", "repost", "unknown"];

  function shouldShow(category) {
    return SHOWN.includes(category);
  }

  const LABELS = {
    promoted: "Promoted",
    suggested: "Suggested",
    company: "Company page",
    other: "Not from your network",
  };

  const api = { classifyPost, shouldShow, headerLines, LABELS };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LNF = api;
})(typeof self !== "undefined" ? self : this);
