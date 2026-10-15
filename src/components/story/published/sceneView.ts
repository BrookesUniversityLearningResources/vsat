import type {
  PublishedScene,
  PublishedStory,
  StoryMode,
} from "@domain/story/publish/types.js";

/**
 * The renderer a scene asks for. The author decides, never the reader: a
 * scene's own pin wins, else the story's mode (which new stories take from
 * the author's default). Title-card and preview scenes carry no mode of
 * their own, so they follow the story.
 */
export function modeForScene(
  story: Pick<PublishedStory, "mode">,
  scene: Pick<PublishedScene, "mode">,
): StoryMode {
  return scene.mode ?? story.mode ?? "360";
}

/**
 * A story can mix 360° and 2D scenes, but each viewer renders only one of
 * them. When navigation lands on a scene the current viewer can't show,
 * reload into the other viewer at the same scene/page, keeping any other
 * params (e.g. ?room= for remote control). An explicit ?view= in the URL is
 * an author/demo override and turns this off.
 *
 * Returns true when it has started navigating away.
 */
export function hopToSceneView(
  current: "360" | "flat",
  story: Pick<PublishedStory, "mode">,
  scene: Pick<PublishedScene, "mode" | "id">,
  pageNumber: number,
): boolean {
  const params = new URLSearchParams(location.search);
  if (params.has("view")) return false;

  const wanted = modeForScene(story, scene) === "2d" ? "flat" : "360";
  if (wanted === current) return false;

  params.set("scene", String(scene.id));
  params.set("page", String(pageNumber));
  location.href = `${location.pathname}?${params.toString()}`;
  return true;
}
