import type { PersistentStory } from "../../../domain";

export type StoryPublished = Readonly<{
  kind: "storyPublished";
  story: PersistentStory;
}>;

export type StoryUnpublished = Readonly<{
  kind: "storyUnpublished";
  story: PersistentStory;
}>;

export type StoryDeleted = Readonly<{
  kind: "storyDeleted";
}>;

export type StoryTitleChanged = Readonly<{
  kind: "storyTitleChanged";
  title: PersistentStory["title"];
}>;

export type StoryModeChanged = Readonly<{
  kind: "storyModeChanged";
  story: PersistentStory;
}>;

export type StoryChanged =
  | StoryModeChanged
  | StoryPublished
  | StoryUnpublished
  | StoryDeleted
  | StoryTitleChanged;

export type OnStoryChanged = (change: StoryChanged) => void;
