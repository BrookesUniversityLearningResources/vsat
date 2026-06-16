import type { Logger } from "pino";

import type { GetDatabase } from "../../../database/schema.js";
import type { GetAllStoryLinks, StoryLinkSummary } from "../../index.js";
import { mapStoryLinkSummary } from "./mapStoryLinkSummary.js";

export default function getAllStoryLinksInDatabase(
  log: Logger,
  db: GetDatabase,
): GetAllStoryLinks {
  return async () => {
    log.debug("Getting all story links");

    const rows = await db()
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
      .orderBy("storyLink.createdAt", "desc")
      .execute();

    const links: StoryLinkSummary[] = rows.map(mapStoryLinkSummary);

    log.debug("Got %d story links", links.length);

    return links;
  };
}
