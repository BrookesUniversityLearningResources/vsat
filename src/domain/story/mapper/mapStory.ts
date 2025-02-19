import type { PersistentScene, PersistentStory } from "../../index.js";

type StoryAndAuthorRow = {
  storyId: number;
  storyTitle: string;
  authorId: number;
  authorName: string;
  publishedOn: Date | null;
};

export function mapStory(
  row: StoryAndAuthorRow,
  scenes: PersistentScene[],
): PersistentStory {
  return {
    id: row.storyId,
    title: row.storyTitle,
    author: mapAuthor(row),
    scenes,
    publishedOn: row.publishedOn,
  };
}

export function mapAuthor(row: StoryAndAuthorRow): PersistentStory["author"] {
  return {
    id: row.authorId,
    name: row.authorName,
  };
}
