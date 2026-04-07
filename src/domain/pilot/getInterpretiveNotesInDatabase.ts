import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { GetInterpretiveNotes } from "./interpretiveNotes.js";

export default function getInterpretiveNotesInDatabase(
  log: Logger,
  db: GetDatabase,
): GetInterpretiveNotes {
  return async (pilotId) => {
    log.debug({ pilotId }, "Getting interpretive notes");

    const rows = await db()
      .selectFrom("interpretiveNote")
      .innerJoin("author", "author.id", "interpretiveNote.authorId")
      .innerJoin("story", "story.id", "interpretiveNote.storyId")
      .select([
        "interpretiveNote.id as id",
        "interpretiveNote.note as note",
        "interpretiveNote.createdAt as createdAt",
        "author.id as authorId",
        "author.name as authorName",
        "story.id as storyId",
        "story.title as storyTitle",
      ])
      .where("interpretiveNote.pilotId", "=", pilotId)
      .orderBy("interpretiveNote.createdAt", "desc")
      .execute();

    return rows.map((row) => ({
      id: row.id,
      note: row.note,
      createdAt: row.createdAt,
      author: {
        id: row.authorId,
        name: row.authorName,
      },
      story: {
        id: row.storyId,
        title: row.storyTitle,
      },
    }));
  };
}
