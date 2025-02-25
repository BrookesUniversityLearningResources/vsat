import type { PublishedScene, PublishedStory } from "../types.js";

export default function findSceneById(
  scenes: PublishedStory["scenes"],
  id: PublishedScene["id"],
): PublishedScene | undefined {
  return scenes.find((scene) => scene.id === id);
}
