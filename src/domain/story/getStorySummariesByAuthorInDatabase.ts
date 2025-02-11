import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import { isNonEmptyArray } from "../../util/nonEmptyArray.js";
import type {
  GetStorySummariesByAuthor,
  StorySummariesByAuthor,
  StorySummary,
} from "../index.js";

type Row = {
  storyId: number;
  title: string;
  publishedOn: Date | null;
  authorId: number;
  authorName: string;
  imageThumbnailUrl: string | null;
};

function getStorySummariesByAuthorInDatabase(
  log: Logger,
  db: GetDatabase,
): GetStorySummariesByAuthor {
  return async (id) => {
    log.debug({ id }, "Getting story summaries by author");

    const data = await db()
      .selectFrom("story")
      .innerJoin("authorToStory", "authorToStory.storyId", "story.id")
      .innerJoin("author", "authorToStory.authorId", "author.id")
      .innerJoin("scene", "scene.storyId", "story.id")
      .leftJoin("image", "scene.imageId", "image.id")
      .select([
        "story.id as storyId",
        "story.title",
        "story.publishedOn",
        "author.id as authorId",
        "author.name as authorName",
        "image.thumbnailUrl as imageThumbnailUrl",
      ])
      .where("authorToStory.authorId", "=", id)
      .where("scene.isOpeningScene", "=", true)
      .orderBy("story.id", "desc")
      .execute();

    return toStorySummariesByAuthor(data);
  };
}

export default getStorySummariesByAuthorInDatabase;

function toStorySummariesByAuthor(rows: Row[]): StorySummariesByAuthor | null {
  if (!isNonEmptyArray(rows)) {
    return null;
  }

  const author = toAuthor(rows[0]);

  return rows.reduce((stories, row) => {
    stories.stories.push(toSummary(row));

    return stories;
  }, authorWithNoStories(author));
}

type Author = StorySummariesByAuthor["author"];

function toAuthor(row: Row): Author {
  return {
    id: row.authorId,
    name: row.authorName,
  };
}

function authorWithNoStories(author: Author): StorySummariesByAuthor {
  return {
    author,
    stories: [],
  };
}

function toSummary(row: Row): StorySummary {
  return {
    id: row.storyId,
    title: row.title,
    publishedOn: row.publishedOn,
    imageUrl: row.imageThumbnailUrl,
  };
}
