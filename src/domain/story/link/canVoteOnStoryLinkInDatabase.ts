import type {
  AuthorDto,
  GetDatabase,
  StoryDto,
} from "../../../database/schema.js";

export type CanVoteOnStoryLinkRequest = {
  linkId: number;
  userId: AuthorDto["id"];
  isSteward: boolean;
};

export type CanVoteOnStoryLink = (
  request: CanVoteOnStoryLinkRequest,
) => Promise<boolean>;

export default function canVoteOnStoryLinkInDatabase(
  db: GetDatabase,
): CanVoteOnStoryLink {
  return async ({ linkId, userId, isSteward }) => {
    if (isSteward) {
      return true;
    }

    const link = await db()
      .selectFrom("storyLink")
      .select(["fromStoryId", "toStoryId"])
      .where("storyLink.id", "=", linkId)
      .executeTakeFirst();

    if (!link) {
      return false;
    }

    const storyIds: StoryDto["id"][] = [link.fromStoryId, link.toStoryId];
    const authoredStory = await db()
      .selectFrom("authorToStory")
      .select("storyId")
      .where("authorToStory.authorId", "=", userId)
      .where("authorToStory.storyId", "in", storyIds)
      .executeTakeFirst();

    return authoredStory !== undefined;
  };
}
