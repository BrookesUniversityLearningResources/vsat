import type { Logger } from "pino";

import type { GetStory } from "@domain/index.js";
import type {
  GetDatabase,
  SaveStoryModeInDatabase,
} from "../../database/schema.js";

function saveStoryModeInDatabase(
  log: Logger,
  db: GetDatabase,
  getStory: GetStory,
): SaveStoryModeInDatabase {
  return async ({ storyId, mode }) => {
    log.debug({ storyId, mode }, "Saving story mode");

    await db()
      .updateTable("story")
      .set({
        mode,
      })
      .where("story.id", "=", storyId)
      .executeTakeFirstOrThrow();

    log.debug({ storyId, mode }, "Saved story mode");

    const story = await getStory({ id: storyId });

    if (story === null) {
      throw new Error(`Story with ID "${storyId}" not found after saving mode`);
    }

    return story;
  };
}

export default saveStoryModeInDatabase;
