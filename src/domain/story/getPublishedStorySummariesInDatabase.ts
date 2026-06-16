import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type {
  GetPublishedStorySummaries,
  PublishedStorySummary,
} from "../index.js";

export default function getPublishedStorySummariesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetPublishedStorySummaries {
  return async (request) => {
    log.debug({ request }, "Getting published stories");

    const rows = await db()
      .selectFrom("storyPublished")
      .innerJoin("authorToStory", "authorToStory.storyId", "storyPublished.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .leftJoin("scene", (join) =>
        join
          .onRef("scene.storyId", "=", "storyPublished.id")
          .on("scene.isOpeningScene", "=", true),
      )
      .leftJoin("image", "scene.imageId", "image.id")
      .select([
        // storyPublished
        "storyPublished.id as storyId",
        "storyPublished.title as storyTitle",
        "storyPublished.createdAt as storyPublishedOn",
        "storyPublished.imageUrl as storyImageUrl",
        "storyPublished.content as storyContent",
        "image.thumbnailUrl as openingSceneImageUrl",
        // author
        "author.id as authorId",
        "author.name as authorName",
      ])
      .orderBy("storyPublished.createdAt", "desc")
      .execute();

    const summaries: PublishedStorySummary[] = rows.map((row) => {
      const contentImageUrl = getImageFromPublishedContent(row.storyContent);
      const imageUrl =
        row.storyImageUrl ?? row.openingSceneImageUrl ?? contentImageUrl;

      return {
        id: row.storyId,
        title: row.storyTitle,
        publishedOn: row.storyPublishedOn,
        imageUrl,
        author: {
          id: row.authorId,
          name: row.authorName,
        },
      };
    });

    log.debug({ request }, "Got %d published stories", summaries.length);

    return summaries;
  };
}

type PublishedSceneImage = {
  url?: string | null;
  thumbnailUrl?: string | null;
};

type PublishedSceneLike = {
  isOpeningScene?: boolean;
  image?: PublishedSceneImage | null;
};

function getImageFromPublishedContent(content: unknown) {
  if (!content) {
    return null;
  }

  try {
    const scenes =
      typeof content === "string" ? (JSON.parse(content) as unknown) : content;
    if (!Array.isArray(scenes) || scenes.length === 0) {
      return null;
    }

    const opening =
      (scenes.find(
        (scene): scene is PublishedSceneLike =>
          typeof scene === "object" && scene !== null && "isOpeningScene" in scene,
      ) as PublishedSceneLike | undefined) ??
      (scenes[0] as PublishedSceneLike | undefined);

    const image = opening?.image;
    return image?.thumbnailUrl ?? image?.url ?? null;
  } catch {
    return null;
  }
}
