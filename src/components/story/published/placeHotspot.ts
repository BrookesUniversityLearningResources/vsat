/**
 * The shared write path for WYSIWYG hotspot placement, used by both the flat
 * (2D) editor and the in-photosphere (3D) editor: insert the positioned-link
 * markup line into the right page's section of the DRAFT scene content via
 * the ordinary save endpoint, then republish. Requires the browser session
 * to be an author of the story; callers surface the thrown error.
 */

/**
 * The empirically calibrated offset between A-Frame camera yaw and
 * equirect image fraction (see M-gaze-mirror VERIFY): a camera at yaw ψ
 * looks at image fraction u = (EQUIRECT_U0 − ψ/360) mod 1. Measured with a
 * labeled test texture — recalibrate, don't derive.
 */
export const EQUIRECT_U0 = 0.8125;

/** Camera yaw/pitch (degrees) → percent-of-image hotspot coordinates. */
export function gazeToImagePercent(
  yaw: number,
  pitch: number,
): { x: number; y: number } {
  const u = (((EQUIRECT_U0 - yaw / 360) % 1) + 1) % 1;
  const v = Math.min(1, Math.max(0, 0.5 - pitch / 180));
  return {
    x: Math.round(u * 1000) / 10,
    y: Math.round(v * 1000) / 10,
  };
}

/** Percent-of-image hotspot coordinates → yaw/pitch (degrees). */
export function imagePercentToGaze(
  x: number,
  y: number,
): { yaw: number; pitch: number } {
  return {
    yaw: (EQUIRECT_U0 - x / 100) * 360,
    pitch: (0.5 - y / 100) * 180,
  };
}

/**
 * Insert the markup line at the end of this page's section of the draft
 * content; pages are delimited by `#` heading lines. If the draft has
 * drifted so far that the page no longer exists, append at the end.
 */
export function insertHotspotLine(
  content: string,
  pageNumber: number,
  line: string,
): string {
  const lines = content.split("\n");
  const headings: number[] = [];
  lines.forEach((text, index) => {
    if (/^\s*#/.test(text)) headings.push(index);
  });
  const pageHeading = headings[pageNumber];
  if (pageHeading === undefined) {
    return `${content.replace(/\s+$/, "")}\n${line}\n`;
  }
  let at = headings[pageNumber + 1] ?? lines.length;
  while (at > pageHeading + 1 && !(lines[at - 1] ?? "").trim()) at -= 1;
  lines.splice(at, 0, line);
  return lines.join("\n");
}

/**
 * Find the [start, end) line bounds of a page's section of the draft
 * content; pages are delimited by `#` heading lines.
 */
function sectionBounds(
  lines: string[],
  pageNumber: number,
): { start: number; end: number } | null {
  const headings: number[] = [];
  lines.forEach((text, index) => {
    if (/^\s*#/.test(text)) headings.push(index);
  });
  const start = headings[pageNumber];
  if (start === undefined) {
    return null;
  }
  return { start, end: headings[pageNumber + 1] ?? lines.length };
}

/**
 * Set (or move) the page's `@panel x,y` placement directive — removes any
 * existing panel line in the section, then inserts the new one at its end.
 */
export function upsertPanelLine(
  content: string,
  pageNumber: number,
  x: number,
  y: number,
): string {
  const lines = content.split("\n");
  const bounds = sectionBounds(lines, pageNumber);
  const directive = `@panel ${x},${y}`;
  if (!bounds) {
    return `${content.replace(/\s+$/, "")}\n${directive}\n`;
  }
  const kept = lines.filter(
    (line, index) =>
      index < bounds.start ||
      index >= bounds.end ||
      !/^\s*@panel\b/i.test(line),
  );
  return insertHotspotLine(kept.join("\n"), pageNumber, directive);
}

/**
 * Replace the page's heading text and fiction body, preserving everything
 * else: the heading's `| anchor` (so links never break), links, hotspots,
 * and the panel directive. The section is reassembled as
 * heading / body paragraphs / other lines.
 */
export function replaceSectionText(
  content: string,
  pageNumber: number,
  heading: string,
  body: string,
): string {
  const lines = content.split("\n");
  const bounds = sectionBounds(lines, pageNumber);
  if (!bounds) {
    return content;
  }
  const section = lines.slice(bounds.start, bounds.end);
  const headingLine = section[0] ?? "#";
  const anchor = /\|(.*)$/.exec(headingLine)?.[1]?.trim();
  const newHeading = anchor ? `# ${heading} | ${anchor}` : `# ${heading}`;
  const keptLines = section
    .slice(1)
    .filter((line) => /^\s*(!?\[|@panel\b)/i.test(line));
  const bodyLines = body
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line, index, all) => line || all[index - 1]);
  const rebuilt = [
    newHeading,
    "",
    ...bodyLines,
    ...(keptLines.length ? ["", ...keptLines] : []),
    "",
  ];
  return [
    ...lines.slice(0, bounds.start),
    ...rebuilt,
    ...lines.slice(bounds.end),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * GET the draft scene, apply a content transformation, PUT it back, and
 * republish the story. The shared write path for all in-place editing.
 */
export async function mutateDraftContent(
  storyId: number,
  sceneId: number,
  mutate: (content: string) => string,
): Promise<void> {
  const sceneRes = await fetch(`/api/story/${storyId}/scene/${sceneId}`);
  if (!sceneRes.ok) {
    throw new Error(`couldn't load the draft scene (${sceneRes.status})`);
  }
  const draft = await sceneRes.json();
  const content = mutate(draft.content ?? "");

  const saveRes = await fetch(
    `/api/story/${storyId}/scene/${sceneId}/content`,
    {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body: content,
    },
  );
  if (!saveRes.ok) {
    throw new Error(
      saveRes.status === 401 || saveRes.status === 403
        ? "you need to be signed in as this story's author"
        : `couldn't save (${saveRes.status})`,
    );
  }

  const publishRes = await fetch(`/api/story/${storyId}/publish`, {
    method: "POST",
  });
  if (!publishRes.ok) {
    throw new Error(`saved, but couldn't republish (${publishRes.status})`);
  }
}

export type PlaceHotspotRequest = {
  storyId: number;
  sceneId: number;
  pageNumber: number;
  label: string;
  target: string;
  /** percent-of-image coordinates */
  x: number;
  y: number;
};

export async function placeHotspot({
  storyId,
  sceneId,
  pageNumber,
  label,
  target,
  x,
  y,
}: PlaceHotspotRequest): Promise<void> {
  const line = `[${label}](${target} @ ${x},${y})`;
  await mutateDraftContent(storyId, sceneId, (content) =>
    insertHotspotLine(content, pageNumber, line),
  );
}

export type PlaceAudioHotspotRequest = Omit<PlaceHotspotRequest, "target"> & {
  /** Empty means the scene's attached audio asset. */
  url?: string;
};

export async function placeAudioHotspot({
  storyId,
  sceneId,
  pageNumber,
  label,
  url,
  x,
  y,
}: PlaceAudioHotspotRequest): Promise<void> {
  const source = url?.trim() || "audio";
  const line = `![${label}](${source} @ ${x},${y})`;
  await mutateDraftContent(storyId, sceneId, (content) =>
    insertHotspotLine(content, pageNumber, line),
  );
}

/** Every known link target in a published story, for target pickers. */
export function allTargetsIn(story: {
  scenes: Array<{ pages: Record<string, unknown> }>;
}): string[] {
  const targets = new Set<string>();
  for (const scene of story.scenes) {
    for (const key of Object.keys(scene.pages)) {
      targets.add(key);
    }
  }
  return [...targets].sort();
}
