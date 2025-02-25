"use client";

import type { PersistentStory } from "@domain/index.js";

export type PreviewStory = (storyId: PersistentStory["id"]) => void;

const previewStory: PreviewStory = (storyId) => {
  window.open(`/author/story/${storyId}/preview`);
};

export default previewStory;
