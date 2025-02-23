import type { Logger } from "pino";

import type { DeleteStoryInDatabase } from "../../database/schema.js";
import type {
  DeletePublishedStory,
  DeleteScene,
  DeleteStory,
  GetScenesForStory,
} from "../index.js";

export default function deleteStory(
  log: Logger,
  getScenesForStory: GetScenesForStory,
  deleteStoryInDatabase: DeleteStoryInDatabase,
  deleteScene: DeleteScene,
  deletePublishedStory: DeletePublishedStory,
): DeleteStory {
  return async ({ storyId }) => {
    log.debug({ storyId }, "Deleting story");

    const scenes = await getScenesForStory(storyId);
    await Promise.all(
      scenes.map((scene) => deleteScene({ storyId, sceneId: scene.id })),
    );

    await deletePublishedStory({ storyId });

    await deleteStoryInDatabase({ storyId });
  };
}
