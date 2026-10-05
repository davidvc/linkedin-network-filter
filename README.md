# LinkedIn Network Filter

A small Chrome extension that turns your LinkedIn home feed back into a feed about **your network**.

It keeps a post only if one of your 1st-degree connections:

- **wrote it**, or
- **liked / reacted to it** ("Jane Doe likes this", "…finds this insightful"), or
- **commented on it** or **reposted it**.

Everything else — Promoted posts, "Suggested" posts, company pages, and people you follow but aren't connected to — is collapsed into a thin bar:

```
Hidden: Not from your network · click to show
```

Click a bar to reveal that post. Your own posts are always shown.

## Install

The extension isn't in the Chrome Web Store; you load it directly from this folder.

1. Clone or download this repo:
   ```bash
   git clone https://github.com/davidvc/linkedin-network-filter.git
   ```
2. In Chrome, open `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `linkedin-network-filter` folder.
5. Open (or reload) [linkedin.com/feed](https://www.linkedin.com/feed/).

Pin the extension from Chrome's puzzle-piece menu to get quick access to its popup.

To update after pulling new changes, click the **↻** reload icon on the extension's card in `chrome://extensions`, then reload your LinkedIn tab.

Works in Chrome and other Chromium browsers (Edge, Brave, Arc). It only affects the desktop web feed, not the LinkedIn mobile app.

## Using it

Click the extension's toolbar icon to:

- turn filtering **on or off**, and
- see how many posts have been shown and hidden on the current feed, broken down by reason.

## How it works

- Runs only on `linkedin.com`, and only filters the home feed (`/feed/`).
- **Makes no network requests** and collects no data. It only reads posts already on your screen and hides the ones that don't match. The single setting (on/off) is stored with `chrome.storage.sync`.
- Classifies each post by its visible header text, not by LinkedIn's CSS classes (which are obfuscated and change often):

  | Header contains | Result |
  |---|---|
  | `Promoted` or `Suggested` | hidden |
  | A banner above the author like `… likes this`, `… commented`, `… reposted` | shown |
  | `• 1st` or `You` next to the author | shown |
  | anything else (e.g. `• 2nd`, `• 3rd+`, company pages) | hidden |
  | not yet loaded / unreadable | shown (never hides what it can't read) |

The classification rules live in [`classify.js`](classify.js), which has no DOM dependencies; [`content.js`](content.js) finds posts in the page and applies the result.

## When LinkedIn changes its layout

LinkedIn redesigns its feed periodically. If the extension stops hiding anything, the post selector in `content.js` (`POST_SELECTORS`) most likely needs updating; if specific posts are misclassified, adjust the patterns in `classify.js` and add a case to the tests.

## Tests

```bash
node test/classify.test.js
```

No dependencies required.

## Disclaimer

Not affiliated with or endorsed by LinkedIn. This extension only changes how the feed is displayed in your own browser.
