import type { PublishedScene, PublishedStory } from "../types.js";

export default function openingSceneFor(story: PublishedStory): PublishedScene {
  return story.scenes.find(isOpeningScene) ?? story.scenes[0];
}

function isOpeningScene(scene: PublishedScene): boolean {
  return scene.isOpeningScene;
}
