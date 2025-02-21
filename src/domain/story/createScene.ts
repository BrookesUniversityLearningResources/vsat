import type { Logger } from "pino";

import type { CreateSceneInDatabase } from "../../database/schema.js";
import type { CreateSceneInStory } from "../index.js";

export default function createScene(
  log: Logger,
  createSceneInDatabase: CreateSceneInDatabase,
): CreateSceneInStory {
  return async (request) => {
    log.debug({ request }, "Creating scene");

    const scene = await createSceneInDatabase({
      storyId: request.storyId,
      title: request.source?.title ?? "A Scene",
      content: request.source?.content ?? "# A Heading\n\nSome content...\n",
      isOpeningScene: request.source?.isOpeningScene ?? false,
    });

    log.debug({ request, scene }, "Created scene");

    return scene;
  };
}
