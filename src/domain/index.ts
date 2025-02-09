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
import type { ErrorCode } from "./error/errorCode.js";
import type { PublishedStory } from "./story/published/types.js";

type WithId = { id?: number };

type Persistent<T extends WithId> = Omit<T, "id"> & { id: number };

export type Author = {
  id: number;
  name: string;
  email: string;
};

export type RepositoryAuthor = Readonly<{
  getAuthorByEmail: (
    email: AuthorDto["email"],
  ) => Promise<AuthorDto | undefined>;
  createAuthor: (author: AuthorInsert) => Promise<AuthorDto>;
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
  publishedOn: Date | null;
  scenes: Scene[];
  author: Omit<Author, "email">;
};

export type PersistentScene = Persistent<Scene>;

export type PersistentStory = Omit<Persistent<Story>, "scenes"> & {
  scenes: PersistentScene[];
};

export type SaveStory = (story: Story) => Promise<PersistentStory>;

type DeleteStoryRequest = {
  storyId: PersistentStory["id"];
  authorId: Author["id"];
};
export type DeleteStory = (request: DeleteStoryRequest) => Promise<unknown>;

export type CreateSceneRequest = {
  storyId: PersistentStory["id"];
  locale?: string | undefined;
  source?:
    | Partial<{
        title: string | undefined;
        content: string | undefined;
        isOpeningScene: boolean | undefined;
      }>
    | undefined;
};
export type CreateSceneInStory = (
  request: CreateSceneRequest,
) => Promise<PersistentScene>;

type DeleteSceneRequest = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
};
export type DeleteScene = (request: DeleteSceneRequest) => Promise<unknown>;

export type DeleteImageRequest = {
  sceneId: PersistentScene["id"];
  imageId: PersistentImage["id"];
};
export type DeleteSceneImage = (
  request: DeleteImageRequest,
) => Promise<unknown>;

export type DeleteAudioRequest = {
  sceneId: PersistentScene["id"];
  audioId: PersistentAudio["id"];
};
export type DeleteSceneAudio = (
  request: DeleteAudioRequest,
) => Promise<unknown>;

export type StorySummary = Omit<PersistentStory, "scenes" | "author"> & {
  imageUrl: Image["thumbnailUrl"] | null;
};

export type StorySummariesByAuthor = {
  author: Omit<AuthorDto, "email">;
  stories: StorySummary[];
};

export type GetStorySummariesByAuthor = (
  id: AuthorDto["id"],
) => Promise<StorySummariesByAuthor | null>;

export type GetPublishedStories = () => Promise<ReadonlyArray<PublishedStory>>;

export type GetPublishedStory = (
  storyId: PublishedStory["id"],
) => Promise<PublishedStory | null>;

export type GetStoriesRequest = Readonly<{
  published?: boolean;
}>;

export type GetStories = (
  request: GetStoriesRequest,
) => Promise<PersistentStory[]>;

export type GetStoryRequest = Readonly<{
  id: StoryDto["id"];
  published?: boolean;
}>;

export type GetStory = (
  request: GetStoryRequest,
) => Promise<PersistentStory | null>;

export type StoryPublished = {
  kind: "published";
  story: PublishedStory;
};

export type PublishingFailed = {
  kind: "publishingFailed";
  errorCode: ErrorCode;
  reason: string;
};

export type PublishStoryResult = StoryPublished | PublishingFailed;

export type PublishStory = (id: StoryDto["id"]) => Promise<PublishStoryResult>;
export type UnpublishStory = (id: StoryDto["id"]) => Promise<void>;

export type RepositoryStory = Readonly<{
  saveStory: SaveStory;
  getStorySummariesByAuthor: GetStorySummariesByAuthor;
  getStory: GetStory;
  publishStory: PublishStory;
  unpublishStory: UnpublishStory;
  deleteStory: DeleteStory;
  getPublishedStory: GetPublishedStory;
  getPublishedStories: GetPublishedStories;
  saveStoryTitle: SaveStoryTitleInDatabase;
}>;

export type RepositoryImage = Readonly<{
  getImageById: (id: ImageDto["id"]) => Promise<Image | undefined>;
}>;

export type RepositoryAudio = Readonly<{
  getAudioById: (id: AudioDto["id"]) => Promise<Audio | undefined>;
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
