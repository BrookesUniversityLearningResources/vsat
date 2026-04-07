import type { Logger } from "pino";

import type { GetDatabase } from "../../../database/schema.js";
import { sql } from "kysely";
import type { VoteOnStoryLink, VoteOnStoryLinkResult } from "../../index.js";
import { mapStoryLinkSummary } from "./mapStoryLinkSummary.js";

const DEFAULT_ACCEPT_THRESHOLD = 1;

export default function voteOnStoryLinkInDatabase(
  log: Logger,
  db: GetDatabase,
  acceptThreshold = DEFAULT_ACCEPT_THRESHOLD,
): VoteOnStoryLink {
  return async (request) => {
    log.debug({ request }, "Voting on story link");

    const existingVote = await db()
      .selectFrom("linkVote")
      .select(["vote"])
      .where("linkVote.linkId", "=", request.linkId)
      .where("linkVote.userId", "=", request.userId)
      .executeTakeFirst();

    if (existingVote?.vote === request.vote) {
      await db()
        .deleteFrom("linkVote")
        .where("linkVote.linkId", "=", request.linkId)
        .where("linkVote.userId", "=", request.userId)
        .execute();
    } else {
      await db()
        .insertInto("linkVote")
        .values({
          linkId: request.linkId,
          userId: request.userId,
          vote: request.vote,
          comment: request.comment ?? null,
        })
        .onConflict((oc) =>
          oc.columns(["linkId", "userId"]).doUpdateSet({
            vote: request.vote,
            comment: request.comment ?? null,
          }),
        )
        .execute();
    }

    const counts = await db()
      .selectFrom("linkVote")
      .select([
        sql<number>`sum(case when "vote" = 'accept' then 1 else 0 end)`.as(
          "acceptCount",
        ),
        sql<number>`sum(case when "vote" = 'reject' then 1 else 0 end)`.as(
          "rejectCount",
        ),
      ])
      .where("linkVote.linkId", "=", request.linkId)
      .executeTakeFirstOrThrow();

    const acceptedVotes = Number(counts.acceptCount ?? 0);
    const rejectedVotes = Number(counts.rejectCount ?? 0);

    let nextStatus: string | null = null;
    if (acceptedVotes >= acceptThreshold) {
      nextStatus = "accepted";
    } else if (rejectedVotes >= acceptThreshold) {
      nextStatus = "rejected";
    }

    const current = await db()
      .selectFrom("storyLink")
      .select(["status"])
      .where("storyLink.id", "=", request.linkId)
      .executeTakeFirstOrThrow();

    if (current.status !== "retired") {
      await db()
        .updateTable("storyLink")
        .set({ status: nextStatus ?? "proposed" })
        .where("storyLink.id", "=", request.linkId)
        .execute();
    }

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

    const result: VoteOnStoryLinkResult = {
      link,
      acceptedVotes,
      rejectedVotes,
    };

    log.debug({ result }, "Voted on story link");

    return result;
  };
}
