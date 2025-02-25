import type { Logger } from "pino";

import type { PublishStoryInDatabase } from "../../../database/schema.js";
import { ErrorCodes } from "../../error/errorCode.js";
import type { GetStory, PublishStory } from "../../index.js";
import parseStory from "../publish/parseStory.js";
import imageUrlFor from "./imageUrlFor.js";

export default function publishStory(
  log: Logger,
  getStory: GetStory,
  publishStoryInDB: PublishStoryInDatabase,
  now: () => Date = () => new Date(),
): PublishStory {
  return async (storyId) => {
    const story = await getStory({ id: storyId });

    if (!story) {
      return {
        kind: "publishingFailed",
        errorCode: ErrorCodes.StoryNotFound,
        reason: `Cannot publish non-existent story with ID "${storyId}"`,
      };
    }

    const result = parseStory(story);

    switch (result.kind) {
      case "storyParsed": {
        const publishedStory = {
          ...result.story,
          createdAt: now(),
          imageUrl: imageUrlFor(story),
        };

        log.info({ publishedStory, errors: result.errors }, "Publishing story");

        await publishStoryInDB({
          story: publishedStory,
        });

        return {
          kind: "published",
          story: {
            ...story,
            publishedOn: publishedStory.createdAt,
          },
        };
      }

      case "storyFailedToParse": {
        return {
          kind: "publishingFailed",
          errorCode: result.errorCode,
          reason: result.reason,
        };
      }

      default: {
        return ((_: never) => ({
          kind: "publishingFailed",
          errorCode: ErrorCodes.Absurd,
          reason: `Failed to publish story with ID "${storyId}"`,
        }))(result);
      }
    }
  };
}
