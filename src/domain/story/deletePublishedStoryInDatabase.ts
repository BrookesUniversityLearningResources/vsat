import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { DeletePublishedStory } from "../index.js";

export default function deletePublishedStoryInDatabase(
  log: Logger,
  db: GetDatabase,
): DeletePublishedStory {
  return (request) => {
    log.debug({ request }, "Deleting published story (if any)");

    return db()
      .deleteFrom("storyPublished")
      .where("id", "=", request.storyId)
      .execute();
  };
}
