"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentScene } from "../../index";

const SaveSceneTitleResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveSceneTitleResponseError = z.infer<
  typeof SaveSceneTitleResponseErrorModel
>;

export type SceneTitleSaved = {
  kind: "sceneTitleSaved";
  scene: PersistentScene;
};

export type SaveSceneTitleError = {
  kind: "error";
  error: SaveSceneTitleResponseError;
};

export type SaveSceneTitleResult = SceneTitleSaved | SaveSceneTitleError;

export type SaveSceneTitle = (
  storyId: number,
  sceneId: number,
  title: string,
) => Promise<SaveSceneTitleResult>;

const saveSceneTitle: SaveSceneTitle = async (storyId, sceneId, title) => {
  try {
    const response = await fetch(
      `/api/story/${storyId}/scene/${sceneId}/title`,
      {
        method: "PUT",
        body: title,
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
      kind: "sceneTitleSaved",
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

export default saveSceneTitle;

async function errorResult(response: Response): Promise<SaveSceneTitleError> {
  const body = await response.json();

  const error = SaveSceneTitleResponseErrorModel.safeParse(body);

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
