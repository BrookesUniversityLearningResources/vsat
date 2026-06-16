import type { Logger } from "pino";

import type { GetDatabase } from "../../../database/schema.js";
import type { RetireStoryLink } from "../../index.js";
import { mapStoryLinkSummary } from "./mapStoryLinkSummary.js";

export default function retireStoryLinkInDatabase(
  log: Logger,
  db: GetDatabase,
): RetireStoryLink {
  return async (request) => {
    log.debug({ request }, "Retiring story link");

    const current = await db()
      .selectFrom("storyLink")
      .select(["status"])
      .where("storyLink.id", "=", request.linkId)
      .executeTakeFirstOrThrow();

    const nextStatus = current.status === "retired" ? "proposed" : "retired";

    await db()
      .updateTable("storyLink")
      .set({ status: nextStatus })
      .where("storyLink.id", "=", request.linkId)
      .execute();

    const row = await db()
      .selectFrom("storyLink")
      .innerJoin("story as fromStory", "fromStory.id", "storyLink.fromStoryId")
      .innerJoin("story as toStory", "toStory.id", "storyLink.toStoryId")
      .leftJoin("scene as toScene", "toScene.id", "storyLink.toSceneId")
      .innerJoin("author as creator", "creator.id", "storyLink.createdBy")
      .select([
        "storyLink.id as id",
        "storyLink.linkType as linkType",
        "storyLink.rationale as rationale",
        "storyLink.status as status",
        "storyLink.createdAt as createdAt",
        "fromStory.id as fromStoryId",
        "fromStory.title as fromStoryTitle",
        "toStory.id as toStoryId",
        "toStory.title as toStoryTitle",
        "storyLink.toSceneId as toSceneId",
        "toScene.title as toSceneTitle",
        "storyLink.toPageNumber as toPageNumber",
        "creator.id as createdById",
        "creator.name as createdByName",
      ])
      .where("storyLink.id", "=", request.linkId)
      .executeTakeFirstOrThrow();

    const link = mapStoryLinkSummary(row);

    log.debug({ link }, "Retired story link");

    return link;
  };
}
