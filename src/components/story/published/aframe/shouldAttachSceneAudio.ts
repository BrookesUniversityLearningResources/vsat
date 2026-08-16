import type { PersistentAudio } from "@domain/index";
import type { PublishedScene } from "@domain/story/publish/types";

/**
 * The scene-level non-positional bed is replaced when the scene's own audio
 * is already represented by a positional hotspot on any of its pages.
 */
export default function shouldAttachSceneAudio(
  scene: PublishedScene,
): scene is PublishedScene & { audio: PersistentAudio } {
  if (!scene.audio) {
    return false;
  }

  const sceneAudioIsPositioned = Object.values(scene.pages).some((page) =>
    page.content.some(
      (block) =>
        block.kind === "blockAudioHotspot" && block.src === scene.audio?.url,
    ),
  );

  return !sceneAudioIsPositioned;
}
