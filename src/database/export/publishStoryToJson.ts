import imageUrlFor from "../../domain/story/publish/imageUrlFor.js";
import parse from "../../domain/story/publish/parseStory.js";
import getEnvironment from "../../environment/getEnvironment.js";

const storyId = Number(process.argv[2]);

if (!storyId) {
  throw new Error("Usage: publishStoryToJson <storyId>");
}

/**
 * Export the _published form_ of a single story to JSON.
 *
 * This is a command-line script that you can use to view the published form
 * of an existing story. This is occasionally useful for diagnosing publishing
 * issues.
 *
 * > Note that the story will not be published after running this script:
 * > this is just to see what the published form would look like.
 *
 * ```bash
 * npm run export:story:publish -- 1257 > published-1257.json
 * ```
 *
 * The output is what you'd find in the `content` field of the `published_story`
 * table: an array of the published scenes for that story.
 */
async function main() {
  const {
    database: { db },
    repositoryStory,
  } = getEnvironment<App.WithDatabase & App.WithStoryRepository>();

  try {
    const story = await repositoryStory.getStory({ id: storyId });

    if (!story) {
      throw new Error(`Story with ID=${storyId} not found`);
    }

    const result = parse(story);

    if (result.kind !== "storyParsed") {
      throw new Error(`Failed to parse story ID=${storyId}: ${result.reason}`);
    }

    const publishedStory = {
      ...result.story,
      createdAt: new Date(),
      imageUrl: imageUrlFor(story),
    };

    console.log(JSON.stringify(publishedStory.scenes, null, 2));
  } finally {
    db.destroy();
  }
}

main();
