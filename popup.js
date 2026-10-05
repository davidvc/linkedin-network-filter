const LABELS = {
  promoted: "Promoted",
  suggested: "Suggested",
  company: "Company pages",
  other: "Not from your network",
};

const $ = (id) => document.getElementById(id);

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  $("enabled").checked = enabled;
  $("enabled").addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: $("enabled").checked });
    setTimeout(loadStats, 200);
  });
});

function loadStats() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.url?.startsWith("https://www.linkedin.com/")) return;
    chrome.tabs.sendMessage(tab.id, { type: "lnf-stats" }, (res) => {
      if (chrome.runtime.lastError || !res) {
        $("stats").textContent = "Reload the LinkedIn tab to activate the filter.";
        return;
      }
      if (!res.onFeed) {
        $("stats").textContent = "Filtering applies on the home feed only.";
        return;
      }
      const c = res.counts;
      const rows = Object.keys(LABELS)
        .filter((k) => c[k])
        .map((k) => `<li>${LABELS[k]}: ${c[k]}</li>`)
        .join("");
      $("stats").innerHTML =
        `<b>${c.shown || 0}</b> shown, <b>${c.hidden || 0}</b> hidden so far` +
        (rows ? `<ul>${rows}</ul>` : "");
    });
  });
}

loadStats();
