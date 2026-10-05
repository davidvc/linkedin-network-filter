const assert = require("node:assert");
const { classifyPost, shouldShow } = require("../classify.js");

const cases = [
  ["network", ["Jane Doe", "Jane Doe", "• 1st", "VP Engineering at Acme", "3h •", "Excited to share that we were Promoted to GA!"]],
  ["network", ["Jane Doe", "1st degree connection", "VP Engineering", "2d • Edited •", "Body"]],
  ["own", ["David V.", "• You", "Engineer", "1w •", "My post"]],
  ["activity", ["Jane Doe likes this", "Random Person", "• 3rd+", "Influencer", "5h •", "Hot take"]],
  ["activity", ["Jane Doe and 4 others like this", "Someone", "• 2nd", "1d •", "Body"]],
  ["activity", ["Jane Doe finds this insightful", "Someone", "• 2nd", "1d •", "Body"]],
  ["activity", ["Jane Doe commented on this", "Someone", "• 3rd+", "1d •", "Body"]],
  ["repost", ["Jane Doe reposted this", "Someone", "• 3rd+", "1d •", "Body"]],
  ["promoted", ["Acme Corp", "12,345 followers", "Promoted", "Buy our thing"]],
  ["suggested", ["Suggested", "Thought Leader", "• 3rd+", "CEO", "6h •", "Body"]],
  ["other", ["Thought Leader", "• 3rd+", "CEO", "6h •", "Body"]],
  ["company", ["Acme Corp", "12,345 followers", "2d •", "News"]],
  ["unknown", ["Loading"]],
  // Long headline mentioning "likes ... this" must not count as an activity banner
  ["network", ["Jane Doe", "• 1st", "Builder who likes to ship things that people love, this is my mission and has been for a long long time, really long time ok", "3h •", "Body"]],
  // Shapes captured from the 2026 feed design (names replaced)
  ["other", ["Feed post", "Acme", "3d •", "Follow", "Body text"]],
  ["promoted", ["Feed post", "Acme Corp", "Some tagline", "Promoted", "Ad body"]],
  ["activity", ["Feed post", "Jane Doe likes this", "Sam Roe", "• 2nd", "Founder at Startup", "1w •", "Follow"]],
  ["activity", ["Feed post", "Jane Q Doe Smith finds this funny", "Sam Roe", "• 2nd", "Headline", "8h •", "Follow"]],
  ["activity", ["Feed post", "Jane Doe commented", "Sam A Roe", "• 2nd", "Headline", "3d • Edited •", "Follow"]],
  ["repost", ["Feed post", "Jane Doe reposted", "Sam Roe", "• 3rd+", "Headline", "2d •", "Follow"]],
  ["other", ["Feed post", "Sam Roe", "• 3rd+", "CEO • Advisor • Speaker", "3d •", "Follow", "Body"]],
  ["network", ["Feed post", "Jane Doe", "• 1st", "Headline", "5h •", "Body"]],
  // A name ending in "commented" below the degree line isn't a banner
  ["other", ["Feed post", "Sam Roe", "• 3rd+", "Everyone commented", "3d •"]],
];

let n = 0;
for (const [want, lines] of cases) {
  const got = classifyPost(lines).category;
  assert.strictEqual(got, want, `${JSON.stringify(lines.slice(0, 3))} → ${got}, want ${want}`);
  n++;
}

for (const c of ["own", "network", "activity", "repost", "unknown"]) assert(shouldShow(c), c);
for (const c of ["promoted", "suggested", "company", "other"]) assert(!shouldShow(c), c);
console.log(`ok: ${n} classification cases + visibility rules`);
