import type {
  AudioDto,
  AuthorDto,
  AuthorInsert,
  ImageDto,
  SaveSceneContentInDatabase,
  SaveSceneTitleInDatabase,
  SaveStoryTitleInDatabase,
  StoryDto,
} from "../database/schema.js";
import type { AudioName } from "./audio/types.js";
import type { ErrorCode } from "./error/errorCode.js";
import type { ImageName } from "./image/types.js";
import type { PublishedStory } from "./story/published/types.js";

type WithId = { id?: number };

type Persistent<T extends WithId> = Omit<T, "id"> & { id: number };

export type Author = {
  id: number;
  name: string;
  email: string;
};

export type GetAuthorByEmail = (
  email: AuthorDto["email"],
) => Promise<AuthorDto | undefined>;

export type CreateAuthor = (author: AuthorInsert) => Promise<AuthorDto>;

export type RepositoryAuthor = Readonly<{
  getAuthorByEmail: GetAuthorByEmail;
  createAuthor: CreateAuthor;
}>;

export type Audio = WithId & {
  url: string;
};

export type PersistentAudio = Persistent<Audio>;

export type Image = WithId & {
  url: string;
  thumbnailUrl: string;
};

export type PersistentImage = Persistent<Image>;

export type Scene = WithId & {
  title: string;
  content: string;
  isOpeningScene: boolean;
  image?: Image | null;
  audio?: Audio | null;
};

export type Story = WithId & {
  title: string;
  scenes: Scene[];
  author: Omit<Author, "email">;
};

export type PersistentScene = Persistent<Scene>;

export type PersistentStory = Omit<Persistent<Story>, "scenes"> & {
  scenes: PersistentScene[];
  publishedOn: Date | null;
};

export type SaveStory = (story: Story) => Promise<PersistentStory>;

type DeleteStoryRequest = {
  storyId: PersistentStory["id"];
};
export type DeleteStory = (request: DeleteStoryRequest) => Promise<unknown>;

type DeletePublishedStoryRequest = {
  storyId: PersistentStory["id"];
};

export type DeletePublishedStory = (
  request: DeletePublishedStoryRequest,
) => Promise<unknown>;

export type CreateSceneRequest = {
  /**
   * Identifies the `Story` that the created `Scene` is to be added to.
   */
  storyId: PersistentStory["id"];

  /**
   * Can be used to localize the initial (example) text for the `Scene`.
   */
  locale?: string | undefined;

  /**
   * Optional values for the created `Scene` that will override any defaults.
   */
  source?: Partial<{
    title: string | undefined;
    content: string | undefined;
    isOpeningScene: boolean | undefined;
  }>;
};

/**
 * Create a `Scene` and add it to the `Story` mentioned in the `request`.
 *
 * @param request deets about the `Scene` to be created.
 */
export type CreateSceneInStory = (
  request: CreateSceneRequest,
) => Promise<PersistentScene>;

type DeleteSceneRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
};

export type DeleteScene = (request: DeleteSceneRequest) => Promise<unknown>;

export type DeleteImageRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  imageId: PersistentImage["id"];
};

export type DeleteSceneImage = (
  request: DeleteImageRequest,
) => Promise<unknown>;

export type DeleteAudioRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  audioId: PersistentAudio["id"];
};

export type DeleteSceneAudio = (
  request: DeleteAudioRequest,
) => Promise<unknown>;

export type StorySummary = Omit<
  PersistentStory,
  "scenes" | "author" | "publishedOn"
> & {
  imageUrl: Image["thumbnailUrl"] | null;
};

export type StorySummariesByAuthor = {
  author: Omit<AuthorDto, "email">;
  stories: StorySummary[];
};

export type GetStorySummariesByAuthor = (
  id: AuthorDto["id"],
) => Promise<StorySummariesByAuthor | null>;

/**
 * A "lite" model of a published `Story`.
 *
 * This omits "heavier" content such as any multimedia and `Scene` fiction.
 *
 * The intent is that this can be used to display a listing of published stories
 * that a reader might peruse: they can then click into the `Story to read the
 * full fat version.
 */
export type PublishedStorySummary = Pick<PublishedStory, "id" | "title"> & {
  publishedOn: Date;
  author: Omit<AuthorDto, "email">;
  imageUrl: Image["thumbnailUrl"] | null;
};

// biome-ignore lint/complexity/noBannedTypes: see inline TODO below
export type GetPublishedStorySummariesRequest = Readonly<{
  // TODO populate with filtering and pagination fields
}>;

export type GetPublishedStorySummaries = (
  request: GetPublishedStorySummariesRequest,
) => Promise<ReadonlyArray<PublishedStorySummary>>;

export type GetStoryRequest = Readonly<{
  id: StoryDto["id"];
}>;

export type GetStory = (
  request: GetStoryRequest,
) => Promise<PersistentStory | null>;

export type GetPublishedStory = (
  id: PersistentStory["id"],
) => Promise<PublishedStory | null>;

export type StoryPublished = {
  kind: "published";
  story: PersistentStory;
};

export type PublishingFailed = {
  kind: "publishingFailed";
  errorCode: ErrorCode;
  reason: string;
};

export type PublishStoryResult = StoryPublished | PublishingFailed;

export type PublishStory = (
  id: PersistentStory["id"],
) => Promise<PublishStoryResult>;

export type StoryUnpublished = {
  kind: "unpublished";
  story: PersistentStory;
};

export type UnpublishingFailed = {
  kind: "unpublishingFailed";
  errorCode: ErrorCode;
  reason: string;
};

export type UnpublishStoryResult = StoryUnpublished | UnpublishingFailed;

export type UnpublishStory = (
  id: StoryDto["id"],
) => Promise<UnpublishStoryResult>;

export type RepositoryStory = Readonly<{
  saveStory: SaveStory;
  getStorySummariesByAuthor: GetStorySummariesByAuthor;
  getStory: GetStory;
  publishStory: PublishStory;
  unpublishStory: UnpublishStory;
  deleteStory: DeleteStory;
  getPublishedStory: GetPublishedStory;
  getPublishedStorySummaries: GetPublishedStorySummaries;
  saveStoryTitle: SaveStoryTitleInDatabase;
}>;

export type RepositoryImage = Readonly<{
  getImageById: (id: ImageDto["id"]) => Promise<Image | undefined>;
  deleteImage: (name: ImageName) => Promise<unknown>;
}>;

export type RepositoryAudio = Readonly<{
  getAudioById: (id: AudioDto["id"]) => Promise<Audio | undefined>;
  deleteAudio: (name: AudioName) => Promise<unknown>;
}>;

export type GetScenesForStory = (
  id: StoryDto["id"],
) => Promise<PersistentScene[]>;

type SaveSceneImageRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  data: Buffer;
};

export type SaveSceneImage = (
  request: SaveSceneImageRequest,
) => Promise<PersistentImage>;

type SaveSceneAudioRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  data: Buffer;
};

export type SaveSceneAudio = (
  request: SaveSceneAudioRequest,
) => Promise<PersistentAudio>;

type GetSceneRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
};

export type GetScene = (
  request: GetSceneRequest,
) => Promise<PersistentScene | null>;

export type RepositoryScene = Readonly<{
  getScene: GetScene;
  getScenesForStory: GetScenesForStory;
  createScene: CreateSceneInStory;
  saveSceneContent: SaveSceneContentInDatabase;
  deleteScene: DeleteScene;
  saveSceneImage: SaveSceneImage;
  deleteSceneImage: DeleteSceneImage;
  saveSceneAudio: SaveSceneAudio;
  deleteSceneAudio: DeleteSceneAudio;
  saveSceneTitle: SaveSceneTitleInDatabase;
}>;
