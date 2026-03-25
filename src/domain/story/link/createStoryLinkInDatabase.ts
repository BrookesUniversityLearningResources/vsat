import type { Logger } from "pino";

import type { GetDatabase } from "../../../database/schema.js";
import type { CreateStoryLink, StoryLinkSummary } from "../../index.js";
import { mapStoryLinkSummary } from "./mapStoryLinkSummary.js";

export default function createStoryLinkInDatabase(
  log: Logger,
  db: GetDatabase,
): CreateStoryLink {
  return async (request) => {
    log.debug({ request }, "Creating story link");

    const inserted = await db()
      .insertInto("storyLink")
      .values({
        fromStoryId: request.fromStoryId,
        toStoryId: request.toStoryId,
        toSceneId: request.toSceneId ?? null,
        toPageNumber: request.toPageNumber ?? null,
        linkType: request.linkType,
        rationale: request.rationale,
        status: "proposed",
        createdBy: request.createdBy,
      })
      .returning("id")
      .executeTakeFirstOrThrow();

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
      .where("storyLink.id", "=", inserted.id)
      .executeTakeFirstOrThrow();

    const link: StoryLinkSummary = mapStoryLinkSummary(row);

    log.debug({ link }, "Created story link");

    return link;
  };
}
