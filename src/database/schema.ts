import type {
  Generated,
  Insertable,
  JSONColumnType,
  Kysely,
  Selectable,
} from "kysely";

import type { NonEmptyArray } from "@util/nonEmptyArray.js";
import type { PersistentScene, PersistentStory } from "../domain/index.js";
import type {
  PublishedScene,
  PublishedStory,
} from "../domain/story/published/types.js";

// https://kysely.dev/docs/getting-started#types
export interface Database {
  story: TableStory;
  storyPublished: TableStoryPublished;
  scene: TableScene;
  image: TableImage;
  audio: TableAudio;
  author: TableAuthor;
  authorToStory: TableAuthorToStory;
}

// #region Author

export interface TableAuthor {
  id: Generated<number>;
  name: string;
  email: string;
}

export type AuthorDto = Selectable<TableAuthor>;
export type AuthorInsert = Insertable<TableAuthor>;

// #endregion Author

// #region Image

export interface TableImage {
  id: Generated<number>;
  url: string;
  thumbnailUrl: string;
  isDeleted?: boolean;
}

export type ImageDto = Selectable<TableImage>;
export type ImageInsert = Insertable<TableImage>;

export type DeleteImageInDatabase = (id: ImageDto["id"]) => Promise<unknown>;

// #endregion Image

// #region Audio

export interface TableAudio {
  id: Generated<number>;
  url: string;
  isDeleted?: boolean;
}

export type AudioDto = Selectable<TableAudio>;
export type AudioInsert = Insertable<TableAudio>;

export type DeleteAudioInDatabase = (id: AudioDto["id"]) => Promise<unknown>;

// #endregion Audio

// #region Story

export interface TableStory {
  id: Generated<number>;
  title: string;
}

export type StoryDto = Selectable<TableStory>;

type DeleteStoryInDatabaseRequest = {
  storyId: StoryDto["id"];
};

export type DeleteStoryInDatabase = (
  request: DeleteStoryInDatabaseRequest,
) => Promise<unknown>;

type SaveStoryTitleInDatabaseRequest = {
  storyId: StoryDto["id"];
  title: StoryDto["title"];
};

export type SaveStoryTitleInDatabase = (
  request: SaveStoryTitleInDatabaseRequest,
) => Promise<PersistentStory>;

type SaveSceneTitleInDatabaseRequest = {
  storyId: StoryDto["id"];
  sceneId: SceneDto["id"];
  title: SceneDto["title"];
};

export type SaveSceneTitleInDatabase = (
  request: SaveSceneTitleInDatabaseRequest,
) => Promise<PersistentScene>;

// #endregion Story

// #region StoryPublished

export interface TableStoryPublished {
  id: number;
  title: string;
  content: JSONColumnType<NonEmptyArray<PublishedScene>>;
  createdAt: Date;
  imageUrl: string | null;
}

export type StoryPublishedDto = Selectable<TableStoryPublished>;

type PublishStoryInDatabaseRequest = {
  story: PublishedStory;
};

export type PublishStoryInDatabase = (
  request: PublishStoryInDatabaseRequest,
) => Promise<StoryPublishedDto>;

export type GetPublishedStoryInDatabase = (
  storyId: number,
) => Promise<StoryPublishedDto | null>;

// #endregion StoryPublished

export interface TableAuthorToStory {
  authorId: number;
  storyId: number;
}

// #region Scene

export interface TableScene {
  id: Generated<number>;
  title: string;
  content: string;
  isOpeningScene: boolean;
  storyId: number;
  imageId: number | null;
  audioId: number | null;
}

export type SceneDto = Selectable<TableScene>;

type DeleteSceneInDatabaseRequest = {
  storyId: StoryDto["id"];
  sceneId: SceneDto["id"];
};

export type DeleteSceneResult = {
  imageId?: ImageDto["id"] | null;
  audioId?: AudioDto["id"] | null;
};

export type DeleteSceneInDatabase = (
  request: DeleteSceneInDatabaseRequest,
) => Promise<DeleteSceneResult>;

type CreateSceneInDatabaseRequest = Omit<
  Insertable<SceneDto>,
  "id" | "imageId" | "audioId"
>;

export type CreateSceneInDatabase = (
  request: CreateSceneInDatabaseRequest,
) => Promise<SceneDto>;

export type SaveSceneContentInDatabase = (
  sceneId: SceneDto["id"],
  content: SceneDto["content"],
) => Promise<unknown>;

// #endregion Scene

export type GetDatabase = () => Kysely<Database>;
