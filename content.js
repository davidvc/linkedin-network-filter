// Watches the LinkedIn feed and hides posts that aren't from your network.
// Runs entirely in your browser; it makes no requests of its own.

(function () {
  const { classifyPost, shouldShow, LABELS } = self.LNF;

  const DEFAULTS = { enabled: true };

  // Feed post containers. Newer LinkedIn (2026) renders each post as a direct
  // child of the "mainFeed" list; the other selectors cover the older design.
  // We keep only the outermost match so nested posts aren't processed twice.
  const POST_SELECTORS = [
    "[data-testid='mainFeed'] > div",
    "[data-id^='urn:li:activity']",
    "[data-id^='urn:li:aggregate']",
    "[data-urn^='urn:li:activity']",
    "div.feed-shared-update-v2",
  ].join(",");

  let settings = { ...DEFAULTS };
  const counts = {};

  function isFeedPage() {
    return location.pathname === "/feed/" || location.pathname === "/feed";
  }

  function findPosts() {
    const all = document.querySelectorAll(POST_SELECTORS);
    return [...all].filter((el) => !el.parentElement?.closest(POST_SELECTORS));
  }

  // Identifies what a container currently holds. The feed loads posts lazily
  // and may reuse containers, so we reclassify whenever this changes.
  function contentKey(post) {
    const children = post.querySelectorAll(":scope > :not(.lnf-bar)").length;
    return (post.getAttribute("data-lazy-mount-id") || "") + ":" + children;
  }

  function readLines(post) {
    // innerText needs the post rendered; un-hide it for this synchronous read.
    const hidden = post.classList.contains("lnf-hidden");
    if (hidden) post.classList.remove("lnf-hidden");
    const text = post.innerText;
    if (hidden) post.classList.add("lnf-hidden");
    return text.split("\n");
  }

  function classify(post) {
    const key = contentKey(post);
    // "unknown" means the post hadn't finished loading; keep checking it.
    if (post.dataset.lnfKey === key && post.dataset.lnfCategory !== "unknown") return;

    const { category, detail } = classifyPost(readLines(post));
    post.dataset.lnfKey = key;
    post.dataset.lnfCategory = category;
    post.dataset.lnfDetail = detail;
  }

  function apply(post) {
    const category = post.dataset.lnfCategory;
    if (!category) return;

    const hide =
      settings.enabled &&
      isFeedPage() &&
      !post.dataset.lnfRevealed &&
      !shouldShow(category);

    post.classList.toggle("lnf-hidden", hide);
    // The bar lives inside the post (the feed list itself is managed by
    // LinkedIn's code, so we don't add siblings to it).
    let bar = post.querySelector(":scope > .lnf-bar");

    if (hide) {
      if (!bar) {
        bar = document.createElement("div");
        bar.className = "lnf-bar";
        bar.addEventListener("click", () => {
          post.dataset.lnfRevealed = "1";
          apply(post);
        });
        post.append(bar);
      }
      const detail = post.dataset.lnfDetail;
      const text =
        `Hidden: ${LABELS[category] || category}` +
        (detail && !["other", "promoted", "suggested"].includes(category) ? ` (${detail})` : "") +
        " · click to show";
      if (bar.textContent !== text) bar.textContent = text;
    } else if (bar) {
      bar.remove();
    }
  }

  function tally() {
    for (const k of Object.keys(counts)) delete counts[k];
    for (const post of findPosts()) {
      const c = post.dataset.lnfCategory;
      if (!c) continue;
      const bucket = post.classList.contains("lnf-hidden") ? "hidden" : "shown";
      counts[bucket] = (counts[bucket] || 0) + 1;
      if (bucket === "hidden") counts[c] = (counts[c] || 0) + 1;
    }
  }

  let scheduled = null;
  function run() {
    scheduled = null;
    if (!isFeedPage()) {
      // Undo any hiding if we navigated away within the single-page app.
      document.querySelectorAll(".lnf-hidden").forEach((p) => p.classList.remove("lnf-hidden"));
      document.querySelectorAll("[data-lnf-key]").forEach((p) => delete p.dataset.lnfKey);
      document.querySelectorAll(".lnf-bar").forEach((b) => b.remove());
      return;
    }
    for (const post of findPosts()) {
      classify(post);
      apply(post);
    }
  }

  function schedule(delay = 150) {
    if (scheduled) return;
    scheduled = setTimeout(run, delay);
  }

  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    run();
    new MutationObserver(() => schedule()).observe(document.body, {
      childList: true,
      subtree: true,
    });
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [k, { newValue }] of Object.entries(changes)) settings[k] = newValue;
    document.querySelectorAll("[data-lnf-revealed]").forEach((p) => delete p.dataset.lnfRevealed);
    findPosts().forEach(apply);
  });

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg?.type === "lnf-stats") {
      tally();
      reply({ onFeed: isFeedPage(), counts: { ...counts } });
    }
  });
})();
