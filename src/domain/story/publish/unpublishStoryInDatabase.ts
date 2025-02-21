import type { Logger } from "pino";

import type { GetDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import type { GetStory, UnpublishStory } from "../../index.js";

export default function unpublishStoryInDatabase(
  log: Logger,
  db: GetDatabase,
  getStory: GetStory,
): UnpublishStory {
  return async (storyId) => {
    try {
      log.debug({ storyId }, "Unpublishing story");

      const result = await db()
        .deleteFrom("storyPublished")
        .where("id", "=", storyId)
        .execute();

      if (result.length === 1) {
        const story = await getStory({ id: storyId });

        if (!story) {
          // this shouldn't ever happen but ¯\_(ツ)_/¯
          return {
            kind: "unpublishingFailed",
            errorCode: ErrorCodes.ErrorUnpublishingStory,
            reason:
              "Unpublished story but failed to subsequently get the (unpublished) story",
          };
        }

        return {
          kind: "unpublished",
          story,
        };
      }

      log.warn({ storyId }, "Cannot unpublish a story that isn't published");

      return {
        kind: "unpublishingFailed",
        errorCode: ErrorCodes.UnableToUnpublishStoryThatIsNotPublished,
        reason: "Cannot unpublish a story that isn't published",
      };
    } catch (err) {
      log.warn({ err });

      return {
        kind: "unpublishingFailed",
        errorCode: ErrorCodes.ErrorUnpublishingStory,
        reason: "Error unpublishing story",
      };
    }
  };
}
