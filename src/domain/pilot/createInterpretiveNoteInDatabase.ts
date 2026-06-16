import type { Logger } from "pino";

import type { GetDatabase } from "../../database/schema.js";
import type { CreateInterpretiveNote } from "./interpretiveNotes.js";

export default function createInterpretiveNoteInDatabase(
  log: Logger,
  db: GetDatabase,
): CreateInterpretiveNote {
  return async (request) => {
    log.debug({ request }, "Creating interpretive note");

    return db()
      .insertInto("interpretiveNote")
      .values({
        pilotId: request.pilotId,
        storyId: request.storyId,
        authorId: request.authorId,
        note: request.note,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}
