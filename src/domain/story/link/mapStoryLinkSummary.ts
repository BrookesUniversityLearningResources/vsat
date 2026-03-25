import type { StoryLinkSummary } from "../../index.js";

type StoryLinkRow = {
  id: number;
  linkType: string;
  rationale: string;
  status: string;
  createdAt: Date;
  fromStoryId: number;
  fromStoryTitle: string;
  toStoryId: number;
  toStoryTitle: string;
  toSceneId: number | null;
  toSceneTitle: string | null;
  toPageNumber: number | null;
  createdById: number;
  createdByName: string;
};

export function mapStoryLinkSummary(row: StoryLinkRow): StoryLinkSummary {
  return {
    id: row.id,
    linkType: row.linkType as StoryLinkSummary["linkType"],
    rationale: row.rationale,
    status: row.status as StoryLinkSummary["status"],
    createdAt: row.createdAt,
    fromStory: {
      id: row.fromStoryId,
      title: row.fromStoryTitle,
    },
    toStory: {
      id: row.toStoryId,
      title: row.toStoryTitle,
    },
    toScene: row.toSceneId
      ? {
          id: row.toSceneId,
          title: row.toSceneTitle,
        }
      : null,
    toPageNumber: row.toPageNumber ?? null,
    createdBy: {
      id: row.createdById,
      name: row.createdByName,
    },
  };
}
