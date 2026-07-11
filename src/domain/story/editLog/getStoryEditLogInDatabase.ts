import type { Logger } from "pino";

import type {
  GetDatabase,
  GetStoryEditLogInDatabase,
} from "../../../database/schema.js";

export default function getStoryEditLogInDatabase(
  log: Logger,
  db: GetDatabase,
): GetStoryEditLogInDatabase {
  return async (storyId) => {
    log.debug({ storyId }, "Getting story edit log");

    // leftJoin, not inner: an audit row must never be dropped just because its
    // editor is missing — that would hide an edit, defeating the log.
    const rows = await db()
      .selectFrom("storyEditLog")
      .leftJoin("author", "author.id", "storyEditLog.editorId")
      .select([
        "storyEditLog.id as id",
        "storyEditLog.storyId as storyId",
        "storyEditLog.sceneId as sceneId",
        "storyEditLog.action as action",
        "storyEditLog.summary as summary",
        "storyEditLog.createdAt as createdAt",
        "storyEditLog.editorId as editorId",
        "author.name as editorName",
      ])
      .where("storyEditLog.storyId", "=", storyId)
      .orderBy("storyEditLog.createdAt", "desc")
      .orderBy("storyEditLog.id", "desc")
      .execute();

    return rows.map((row) => ({
      id: row.id,
      storyId: row.storyId,
      sceneId: row.sceneId,
      action: row.action,
      summary: row.summary,
      createdAt: row.createdAt,
      editorId: row.editorId,
      editorName: row.editorName,
    }));
  };
}
