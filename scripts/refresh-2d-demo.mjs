// Replace load-test material on vsat-dev with a small, reproducible 2D demo.
//
// Run from the repository root with:
//   node scripts/refresh-2d-demo.mjs --apply
//
// The six files in .demo-media/ are downloaded from the source pages listed
// below. Every source is public domain or dedicated to the public domain.

import { readFile } from "node:fs/promises";

const HOST = "https://vsat-dev-a59e8b7d8397.herokuapp.com";
const APPLY = process.argv.includes("--apply");
const AUTHOR1 = "vsat_demo_author=1; vsat_steward=0";
const AUTHOR2 = "vsat_demo_author=2; vsat_steward=0";

const stories = [
  {
    id: 1241,
    title: "Along the Thames",
    openingScene: 1482,
    cookie: AUTHOR2,
    scenes: [
      {
        slug: "oxford",
        heading: "The river in Oxford",
        text: "At Christ Church Meadow, the Thames passes quietly beneath the trees. Follow it downstream, and the city begins to give way to open country.",
        image: ".demo-media/oxford-thames.jpg",
        source: "https://commons.wikimedia.org/wiki/File:Oxford_Thames.jpg",
        credit: "Daniel Michael Perry, CC0",
      },
      {
        slug: "kelmscott",
        heading: "Morning at Kelmscott",
        text: "Near Kelmscott, the same river widens into a mirror of reeds, clouds, and willow. It is one journey seen at two different speeds.",
        image: ".demo-media/kelmscott-thames.jpg",
        source:
          "https://commons.wikimedia.org/wiki/File:River_Thames_-_Kelmscott,_Oxfordshire,_England_-_DSC00188.jpg",
        credit: "Daderot, CC0",
      },
    ],
  },
  {
    id: 1242,
    title: "Pages from Nature",
    openingScene: 1487,
    cookie: AUTHOR2,
    scenes: [
      {
        slug: "bird",
        heading: "A bird among the flowers",
        text: "A small printed bird pauses among curling stems. More than a century later, the page still feels like a moment caught between song and flight.",
        image: ".demo-media/bird-and-flowers.jpg",
        source:
          "https://commons.wikimedia.org/wiki/File:Bird_and_Flowers_Drawing.jpg",
        credit: "Seeley, Jackson & Halliday, 1875; public domain",
      },
      {
        slug: "wildflowers",
        heading: "Wildflowers in watercolour",
        text: "Anna Frances Walker gathered many species onto one sheet. The careful differences in leaf, stem, and bloom turn observation into a kind of storytelling.",
        image: ".demo-media/botanical-drawings.jpg",
        source:
          "https://commons.wikimedia.org/wiki/File:Botanical_drawings,_ca._1879_by_A._F._Walker_a5072001h.jpg",
        credit: "Anna Frances Walker, c. 1879; public domain",
      },
    ],
  },
  {
    id: 1243,
    title: "Ponies of the New Forest",
    openingScene: 1489,
    cookie: AUTHOR2,
    scenes: [
      {
        slug: "herd",
        heading: "Across the open heath",
        text: "New Forest ponies roam the heath in loose herds. The landscape looks empty at first, until ears and moving tails begin to stand out against the grass.",
        image: ".demo-media/new-forest-ponies.jpg",
        source: "https://commons.wikimedia.org/wiki/File:New_Forest_ponies.jpg",
        credit: "Paste, public-domain dedication",
      },
      {
        slug: "portrait",
        heading: "A closer look",
        text: "Seen close up, the pony's winter coat holds the colours of bracken and sand. The breed is shaped by a life outdoors on rough ground.",
        image: ".demo-media/buckskin-pony.jpg",
        source:
          "https://commons.wikimedia.org/wiki/File:Buckskin_New_Forest_pony.JPG",
        credit: "Paula Jantunen, public-domain dedication",
      },
    ],
  },
];

const keep = new Set([1264, ...stories.map(({ id }) => id)]);
const author2Ids = new Set([1241, 1242, 1243, 1245, 1246, 1247]);
const author1TestIds = Array.from({ length: 92 }, (_, n) => 1165 + n).filter(
  (id) => !keep.has(id) && !author2Ids.has(id),
);
const author2UnusedIds = [1245, 1246, 1247];

async function request(
  path,
  { cookie, method = "GET", body, headers = {} } = {},
) {
  if (!APPLY && method !== "GET") {
    console.log(`[dry run] ${method} ${path}`);
    return null;
  }
  const response = await fetch(`${HOST}${path}`, {
    method,
    headers: { Cookie: cookie, ...headers },
    body,
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path}: ${response.status} ${await response.text()}`,
    );
  }
  return response;
}

async function putText(path, cookie, body) {
  await request(path, {
    cookie,
    method: "PUT",
    headers: { "Content-Type": "text/plain" },
    body,
  });
}

async function uploadImage(storyId, sceneId, cookie, filename) {
  if (!APPLY) {
    console.log(
      `[dry run] POST /api/story/${storyId}/scene/${sceneId}/image (${filename})`,
    );
    return;
  }
  const data = await readFile(filename);
  const form = new FormData();
  form.append(
    "scene-image",
    new Blob([data], { type: "image/jpeg" }),
    filename,
  );
  await request(`/api/story/${storyId}/scene/${sceneId}/image`, {
    cookie,
    method: "POST",
    body: form,
  });
}

for (const story of stories) {
  await putText(`/api/story/${story.id}/title`, story.cookie, story.title);
  await putText(`/api/story/${story.id}/mode`, story.cookie, "2d");

  const sceneIds = [story.openingScene];
  if (APPLY) {
    const current = await (
      await request(`/api/story/${story.id}`, {
        cookie: story.cookie,
      })
    ).json();
    const existingSecondScene = current.scenes.find(
      ({ id }) => id !== story.openingScene,
    );
    if (existingSecondScene) {
      sceneIds.push(existingSecondScene.id);
    } else {
      const response = await request(`/api/story/${story.id}/scene`, {
        cookie: story.cookie,
        method: "POST",
      });
      const scene = await response.json();
      sceneIds.push(scene.id);
    }
  } else {
    sceneIds.push("NEW");
  }

  for (let index = 0; index < story.scenes.length; index += 1) {
    const scene = story.scenes[index];
    const next = story.scenes[index + 1];
    const previous = story.scenes[index - 1];
    const links = [
      previous ? `[← ${previous.heading}](${previous.slug})` : null,
      next ? `[${next.heading} →](${next.slug})` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const content = [
      `# ${scene.heading} | ${scene.slug}`,
      scene.text,
      links,
      `[Image source: ${scene.credit}](${scene.source})`,
    ]
      .filter(Boolean)
      .join("\n\n");
    const sceneId = sceneIds[index];
    await putText(
      `/api/story/${story.id}/scene/${sceneId}/content`,
      story.cookie,
      content,
    );
    await uploadImage(story.id, sceneId, story.cookie, scene.image);
  }

  await request(`/api/story/${story.id}/publish`, {
    cookie: story.cookie,
    method: "POST",
  });
}

// Story 1264 predates 2D mode. Restore its narrative text without the spatial
// audio markup, retain its two photographs, and republish it as a flat story.
await putText("/api/story/1264/mode", AUTHOR1, "2d");
await putText(
  "/api/story/1264/scene/1530/content",
  AUTHOR1,
  "# This weekend I was at a Tai Chi retreat | weekend\n\nWe were in the New Forest.\n\n[Meanwhile…](meanwhile)",
);
await putText(
  "/api/story/1264/scene/1531/content",
  AUTHOR1,
  "# Meanwhile | meanwhile\n\nMy main teacher was in China.\n\n[← Back to the New Forest](weekend)",
);
await request("/api/story/1264/publish", { cookie: AUTHOR1, method: "POST" });

await putText("/api/author/1066/default-story-mode", AUTHOR1, "2d");
await putText("/api/author/1099/default-story-mode", AUTHOR2, "2d");

for (const id of author1TestIds) {
  await request(`/api/story/${id}`, { cookie: AUTHOR1, method: "DELETE" });
}
for (const id of author2UnusedIds) {
  await request(`/api/story/${id}`, { cookie: AUTHOR2, method: "DELETE" });
}

console.log(
  APPLY ? "2D demo refreshed." : "Dry run complete; pass --apply to write.",
);
