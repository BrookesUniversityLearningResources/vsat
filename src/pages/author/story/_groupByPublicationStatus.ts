import type { StorySummary } from "@domain/index.js";

export default function groupByPublicationStatus(
  stories: StorySummary[],
): [publishedStories: StorySummary[], unpublishedStories: StorySummary[]] {
  const isPublished = { published: true };
  const isUnpublished = { published: false };

  const groupedStories = Map.groupBy(stories, (story) =>
    story.publishedOn === null ? isUnpublished : isPublished,
  );

  return [
    groupedStories.get(isPublished) || [],
    groupedStories.get(isUnpublished) || [],
  ];
}
