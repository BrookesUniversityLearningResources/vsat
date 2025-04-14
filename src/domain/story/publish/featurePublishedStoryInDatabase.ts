import type { Logger } from "pino";

import type {
  FeatureStoryInDatabase,
  GetDatabase,
} from "../../../database/schema.js";

export default function featurePublishedStoryInDatabase(
  log: Logger,
  db: GetDatabase,
  now: () => Date = () => new Date(),
): FeatureStoryInDatabase {
  return async (storyId) => {
    log.debug({ storyId }, "Featuring published story in DB");

    const featuredOn = now();

    await db()
      .updateTable("storyPublished")
      .set({
        featuredActive: true,
        featuredOn,
      })
      .where("id", "=", storyId)
      .executeTakeFirstOrThrow();

    log.debug({ storyId, featuredOn }, "Featured story in DB");
  };
}
