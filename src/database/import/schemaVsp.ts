import type { Generated } from "kysely";

/** The **VSP** schema. */
export interface DatabaseVSP {
  story: TableStoryVSP;
  scene: TableSceneVSP;
  image: TableImageVSP;
  audio: TableAudioVSP;
  author: TableAuthorVSP;
  authorToStory: TableAuthorToStoryVSP;
}

// #region Author

export interface TableAuthorVSP {
  id: Generated<number>;
  name: string;
  email: string;
}

export interface TableAuthorToStoryVSP {
  authorId: number;
  storyId: number;
}

// #endregion Author

// #region Story

export interface TableStoryVSP {
  id: Generated<number>;
  title: string;
  published: boolean;
}

// #endregion Story

// #region Image

export interface TableImageVSP {
  id: Generated<number>;
  url: string;
  thumbnailUrl: string;
}

// #endregion Image

// #region Audio

export interface TableAudioVSP {
  id: Generated<number>;
  url: string;
}

// #endregion Audio

// #region Scene

export interface TableSceneVSP {
  id: Generated<number>;
  title: string;
  content: string;
  isOpeningScene: boolean;
  storyId: number;
  imageId: number | null;
  audioId: number | null;
}

// #endregion Scene
