"use client";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";
import { z } from "zod";

import type { PersistentScene } from "../../index";
import type { StoryMode } from "../publish/types";

const SaveSceneModeResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveSceneModeResponseError = z.infer<
  typeof SaveSceneModeResponseErrorModel
>;

export type SceneModeSaved = {
  kind: "sceneModeSaved";
  scene: PersistentScene;
};

export type SaveSceneModeError = {
  kind: "error";
  error: SaveSceneModeResponseError;
};

export type SaveSceneModeResult = SceneModeSaved | SaveSceneModeError;

export type SaveSceneMode = (
  storyId: number,
  sceneId: number,
  mode: StoryMode | null,
) => Promise<SaveSceneModeResult>;

const saveSceneMode: SaveSceneMode = async (storyId, sceneId, mode) => {
  try {
    const response = await fetch(
      `/api/story/${storyId}/scene/${sceneId}/mode`,
      {
        method: "PUT",
        body: mode ?? "inherit",
      },
    );

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 200) {
      return errorResult(response);
    }

    const scene = await response.json();

    return {
      kind: "sceneModeSaved",
      scene,
    };
  } catch (err) {
    return {
      kind: "error",
      error: {
        errorCode: ErrorCodes.Error,
        context: {
          error: err,
        },
      },
    };
  }
};

export default saveSceneMode;

async function errorResult(response: Response): Promise<SaveSceneModeError> {
  const body = await response.json();

  const error = SaveSceneModeResponseErrorModel.safeParse(body);

  if (error.success) {
    return {
      kind: "error",
      error: error.data,
    };
  }

  return {
    kind: "error",
    error: {
      errorCode: ErrorCodes.Error,
    },
  };
}
