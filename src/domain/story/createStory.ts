import type { Logger } from "pino";

import type { CreateStory, SaveStory } from "../index.js";

export default function createStory(
  log: Logger,
  saveStory: SaveStory,
): CreateStory {
  return async (request) => {
    log.debug({ request }, "Creating story");

    const story = await saveStory({
      title: request.source?.title ?? "My story",
      author: request.author,
      ...(request.author.defaultStoryMode
        ? { mode: request.author.defaultStoryMode }
        : {}),
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
