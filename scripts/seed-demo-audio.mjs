// Seeds story 1264 ("This weekend") with positional audio hotspots so the
// audio work has something to demo — the dev DB had no audio content at all.
// Goes through the app's own save+publish API, so it exercises the real parse
// path. Dry run by default; --apply writes.
//
// TO REVERSE (dev, 2026-09-03) — restore these and re-publish:
//   scene 1530: "# This weekend I was at a Tai Chi retreat | weekend\nWe were in the New Forest.\n[meanwhile...](meanwhile)"
//   scene 1531: "# Meanwhile | meanwhile\nMy main teacher was in China."
//
// Syntax is  ![Label](URL @ x,y)  with x,y percentages 0-100 of the
// photosphere. WebAudio drops cross-origin audio SILENTLY without CORS, so any
// replacement URL needs Access-Control-Allow-Origin (metameso.org has it).
const HOST = "https://vsat-dev-a59e8b7d8397.herokuapp.com";
const AS_AUTHOR1 = "vsat_demo_author=1; vsat_steward=0";
const APPLY = process.argv.includes("--apply");

const A1 = "https://metameso.org/~joe/docs/to-live-without-fear2.mp3";
const A2 = "https://metameso.org/~joe/docs/the-sadist.mp3";

// Two emitters in the opening scene, roughly opposite each other, so turning
// your head crossfades between them — that is the positional-audio point.
const SCENES = {
  1530: [
    "# This weekend I was at a Tai Chi retreat | weekend",
    "We were in the New Forest.",
    `![To live without fear](${A1} @ 25,50)`,
    `![The sadist](${A2} @ 75,50)`,
    "[meanwhile...](meanwhile)",
  ].join("\n"),
  1531: [
    "# Meanwhile | meanwhile",
    "My main teacher was in China.",
    `![To live without fear](${A1} @ 50,42)`,
  ].join("\n"),
};

const get = (p) => fetch(`${HOST}${p}`, { headers: { Cookie: AS_AUTHOR1 } });

// Record the current content so this is reversible.
for (const id of Object.keys(SCENES)) {
  const r = await get(`/api/story/1264/scene/${id}`);
  const j = await r.json();
  console.log(`BEFORE scene ${id} (${r.status}):`, JSON.stringify(j?.content ?? j));
}

if (!APPLY) { console.log("\n(dry run — pass --apply)"); process.exit(0); }

for (const [id, content] of Object.entries(SCENES)) {
  const r = await fetch(`${HOST}/api/story/1264/scene/${id}/content`, {
    method: "PUT",
    headers: { Cookie: AS_AUTHOR1, "Content-Type": "text/plain" },
    body: content,
  });
  console.log(`PUT scene ${id} -> ${r.status}`);
  if (!r.ok) { console.error(await r.text()); process.exit(1); }
}

const pub = await fetch(`${HOST}/api/story/1264/publish`, {
  method: "POST", headers: { Cookie: AS_AUTHOR1 },
});
console.log(`PUBLISH -> ${pub.status}`);
if (!pub.ok) { console.error(await pub.text()); process.exit(1); }
