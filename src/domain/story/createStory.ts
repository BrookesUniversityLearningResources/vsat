import type { Logger } from "pino";

import type { GetAuthorDefaultStoryModeInDatabase } from "../../database/schema.js";
import type { CreateStory, SaveStory } from "../index.js";

export default function createStory(
  log: Logger,
  saveStory: SaveStory,
  getAuthorDefaultStoryMode: GetAuthorDefaultStoryModeInDatabase,
): CreateStory {
  return async (request) => {
    log.debug({ request }, "Creating story");

    const story = await saveStory({
      title: request.source?.title ?? "My story",
      author: request.author,
      mode: await getAuthorDefaultStoryMode(request.author.id),
      scenes: [
        {
          title: "Introduction",
          content: "# Introduction\n\n…",
          isOpeningScene: true,
        },
      ],
    });

    log.info({ request, story }, "Created story");

    return story;
  };
}
