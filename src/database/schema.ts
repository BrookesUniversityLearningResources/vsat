import type { Generated, Insertable, Kysely, Selectable } from "kysely";

import type { PersistentScene, PersistentStory } from "../domain/index.js";

// https://kysely.dev/docs/getting-started#types
export interface Database {
  story: TableStory;
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
  publishedOn: Date | null;
}

export type StoryDto = Selectable<TableStory>;

type DeleteStoryInDatabaseRequest = {
  storyId: StoryDto["id"];
  authorId: AuthorDto["id"];
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

type PublishStoryInDatabaseRequest = {
  storyId: StoryDto["id"];
  publishedOn: Date;
};

export type PublishStoryInDatabase = (
  request: PublishStoryInDatabaseRequest,
) => Promise<StoryDto>;

// #endregion Story

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
