import type { Audio, Image, PersistentScene } from "../../index.js";
import type { StoryMode } from "../publish/types.js";

export type SceneWithAudioAndImageRow = {
  sceneId: number;
  sceneTitle: string;
  sceneContent: string;
  isOpeningScene: boolean;
  sceneMode: StoryMode | null;
  audioId: number | null;
  audioUrl: string | null;
  imageId: number | null;
  imageUrl: string | null;
  imageThumbnailUrl: string | null;
};

export function mapScene(row: SceneWithAudioAndImageRow): PersistentScene {
  return {
    id: row.sceneId,
    title: row.sceneTitle,
    content: row.sceneContent,
    isOpeningScene: row.isOpeningScene,
    mode: row.sceneMode,
    image: toImage(row),
    audio: toAudio(row),
  };
}

function toAudio(row: SceneWithAudioAndImageRow): Audio | null {
  if (row.audioId === null || row.audioUrl === null) {
    return null;
  }

  return {
    id: row.audioId,
    url: row.audioUrl,
  };
}

function toImage(row: SceneWithAudioAndImageRow): Image | null {
  if (
    row.imageId === null ||
    row.imageUrl === null ||
    row.imageThumbnailUrl === null
  ) {
    return null;
  }

  return {
    id: row.imageId,
    url: row.imageUrl,
    thumbnailUrl: row.imageThumbnailUrl,
  };
}
