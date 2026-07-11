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

  const sceneRes = await fetch(`/api/story/${storyId}/scene/${sceneId}`);
  if (!sceneRes.ok) {
    throw new Error(`couldn't load the draft scene (${sceneRes.status})`);
  }
  const draft = await sceneRes.json();
  const content = insertHotspotLine(draft.content ?? "", pageNumber, line);

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
