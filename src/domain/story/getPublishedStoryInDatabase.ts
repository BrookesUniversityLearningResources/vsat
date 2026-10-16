import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { Json } from "../../util/json/types.js";
import type { NonEmptyArray } from "../../util/nonEmptyArray.js";
import type { GetPublishedStory } from "../index.js";
import type {
  PublishedScene,
  PublishedStory,
  StoryMode,
} from "./publish/types.js";

/**
 * With photospheres off (features.photospheres=false) every scene and the
 * story itself resolve to "2d", whatever is stored. Forcing it here, not in
 * the page, keeps the viewer's scene-to-scene hop (sceneView.ts) in step:
 * a scene still marked 360 would otherwise bounce the reader forever.
 */
function getPublishedStoryInDatabase(
  log: Logger,
  db: GetDatabase,
  photospheres = true,
): GetPublishedStory {
  return async (storyId) => {
    log.debug({ storyId }, "Getting published story");

    const row = await db()
      .selectFrom("storyPublished")
      .innerJoin("authorToStory", "authorToStory.storyId", "storyPublished.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      // mode is presentation, not content: read it live from the story row
      // so toggling it applies to the published view without a republish
      .innerJoin("story", "story.id", "storyPublished.id")
      .select([
        "storyPublished.id as storyId",
        "storyPublished.title as storyTitle",
        "storyPublished.content as storyContent",
        "storyPublished.imageUrl as storyImageUrl",
        "storyPublished.createdAt",
        "storyPublished.createdAt",
        "story.mode as storyMode",
        "author.id as authorId",
        "author.name as authorName",
      ])
      .where("authorToStory.storyId", "=", storyId)
      .executeTakeFirst();

    if (!row) {
      return null;
    }

    // like story.mode, a scene's pinned mode is read live, not snapshotted
    const sceneModes = await db()
      .selectFrom("scene")
      .select(["scene.id", "scene.mode"])
      .where("scene.storyId", "=", storyId)
      .execute();

    const story = mapPublishedStory(
      row,
      new Map(sceneModes.map((scene) => [scene.id, scene.mode])),
    );
    return photospheres ? story : flattenPublishedStory(story);
  };
}

export default getPublishedStoryInDatabase;

type PublishedStoryAndAuthorRow = {
  storyId: number;
  storyTitle: string;
  storyContent: Json;
  storyImageUrl: string | null;
  createdAt: Date;
  storyMode: StoryMode;
  authorId: number;
  authorName: string;
};

function mapPublishedStory(
  row: PublishedStoryAndAuthorRow,
  sceneModes: Map<number, StoryMode | null>,
): PublishedStory {
  const scenes = row.storyContent as NonEmptyArray<PublishedScene>;

  return {
    id: row.storyId,
    title: row.storyTitle,
    author: {
      id: row.authorId,
      name: row.authorName,
    },
    createdAt: row.createdAt,
    // each scene carries its resolved mode: its own pin, else the story's
    scenes: scenes.map((scene) => ({
      ...scene,
      mode: sceneModes.get(scene.id) ?? row.storyMode,
    })) as NonEmptyArray<PublishedScene>,
    imageUrl: row.storyImageUrl,
    mode: row.storyMode,
  };
}

export function flattenPublishedStory(story: PublishedStory): PublishedStory {
  return {
    ...story,
    scenes: story.scenes.map((scene) => ({
      ...scene,
      mode: "2d",
    })) as NonEmptyArray<PublishedScene>,
    mode: "2d",
  };
}
