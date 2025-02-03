import type { Logger } from "pino";

import type { GetStory } from "@domain/index.js";
import type {
  GetDatabase,
  SaveStoryTitleInDatabase,
} from "../../database/schema.js";

function saveStoryTitleInDatabase(
  log: Logger,
  db: GetDatabase,
  getStory: GetStory,
): SaveStoryTitleInDatabase {
  return async ({ storyId, title }) => {
    log.debug({ storyId, title }, "Saving story title");

    await db()
      .updateTable("story")
      .set({
        title,
      })
      .where("story.id", "=", storyId)
      .executeTakeFirstOrThrow();

    log.debug({ storyId, title }, "Saved story title");

    const story = await getStory({ id: storyId });

    if (story === null) {
      throw new Error(
        `Story with ID "${storyId}" not found after saving title`,
      );
    }

    return story;
  };
}

export default saveStoryTitleInDatabase;
