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
  StoryMode,
} from "../domain/story/publish/types.js";

// https://kysely.dev/docs/getting-started#types
export interface Database {
  story: TableStory;
  storyPublished: TableStoryPublished;
  scene: TableScene;
  image: TableImage;
  audio: TableAudio;
  author: TableAuthor;
  authorToStory: TableAuthorToStory;
  storyLink: TableStoryLink;
  linkVote: TableLinkVote;
  anthology: TableAnthology;
  anthologyStory: TableAnthologyStory;
  interpretiveNote: TableInterpretiveNote;
}

// #region Author

export interface TableAuthor {
  id: Generated<number>;
  name: string;
  email: string;
}

export type AuthorDto = Selectable<TableAuthor>;
export type AuthorInsert = Insertable<TableAuthor>;

type SaveAuthorNameInDatabaseRequest = {
  id: AuthorDto["id"];
  name: AuthorDto["name"];
};

export type SaveAuthorNameInDatabase = (
  request: SaveAuthorNameInDatabaseRequest,
) => Promise<unknown>;

// #endregion Author

// #region Image

export interface TableImage {
  id: Generated<number>;
  url: string;
  thumbnailUrl: string;
}

export type ImageDto = Selectable<TableImage>;
export type ImageInsert = Insertable<TableImage>;

export type DeleteImageInDatabase = (id: ImageDto["id"]) => Promise<unknown>;

// #endregion Image

// #region Audio

export interface TableAudio {
  id: Generated<number>;
  url: string;
}

export type AudioDto = Selectable<TableAudio>;
export type AudioInsert = Insertable<TableAudio>;

export type DeleteAudioInDatabase = (id: AudioDto["id"]) => Promise<unknown>;

// #endregion Audio

// #region Story

export interface TableStory {
  id: Generated<number>;
  title: string;
  mode: Generated<StoryMode>;
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

type SaveStoryModeInDatabaseRequest = {
  storyId: StoryDto["id"];
  mode: StoryMode;
};

export type SaveStoryModeInDatabase = (
  request: SaveStoryModeInDatabaseRequest,
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

export type FeatureStoryInDatabase = (
  id: PublishedStory["id"],
) => Promise<unknown>;

type PublishStoryInDatabaseRequest = {
  // mode is excluded: it lives on the story row (live-read at render), so
  // publishing doesn't snapshot it
  story: Omit<PublishedStory, "mode">;
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

// #region StoryLink

export interface TableStoryLink {
  id: Generated<number>;
  fromStoryId: number;
  toStoryId: number;
  toSceneId: number | null;
  toPageNumber: number | null;
  linkType: string;
  rationale: string;
  status: string;
  createdBy: number;
  createdAt: Generated<Date>;
}

export type StoryLinkDto = Selectable<TableStoryLink>;
export type StoryLinkInsert = Insertable<TableStoryLink>;

export interface TableLinkVote {
  id: Generated<number>;
  linkId: number;
  userId: number;
  vote: string;
  comment: string | null;
  createdAt: Generated<Date>;
}

export type LinkVoteDto = Selectable<TableLinkVote>;
export type LinkVoteInsert = Insertable<TableLinkVote>;

// #endregion StoryLink

// #region Anthology

export interface TableAnthology {
  id: Generated<number>;
  title: string;
  question: string;
  partner: string | null;
  status: string;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Generated<Date>;
}

export type AnthologyDto = Selectable<TableAnthology>;
export type AnthologyInsert = Insertable<TableAnthology>;

export interface TableAnthologyStory {
  anthologyId: number;
  storyId: number;
}

export type AnthologyStoryDto = Selectable<TableAnthologyStory>;
export type AnthologyStoryInsert = Insertable<TableAnthologyStory>;

export interface TableInterpretiveNote {
  id: Generated<number>;
  anthologyId: number;
  storyId: number;
  authorId: number;
  note: string;
  createdAt: Generated<Date>;
}

export type InterpretiveNoteDto = Selectable<TableInterpretiveNote>;
export type InterpretiveNoteInsert = Insertable<TableInterpretiveNote>;

// #endregion Anthology

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

type SaveSceneContentInDatabaseRequest = {
  storyId: StoryDto["id"];
  sceneId: SceneDto["id"];
  content: SceneDto["content"];
};

export type SaveSceneContentInDatabase = (
  request: SaveSceneContentInDatabaseRequest,
) => Promise<unknown>;

// #endregion Scene

export type GetDatabase = () => Kysely<Database>;
