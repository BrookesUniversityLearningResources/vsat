"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

const DeleteSceneAudioResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type DeleteSceneAudioResponseError = z.infer<
  typeof DeleteSceneAudioResponseErrorModel
>;

export type SceneAudioDeleted = {
  kind: "sceneAudioDeleted";
};

export type DeleteSceneAudioError = {
  kind: "error";
  error: DeleteSceneAudioResponseError;
};

export type DeleteSceneAudioResult = SceneAudioDeleted | DeleteSceneAudioError;

export type DeleteSceneAudioRequest = {
  storyId: number;
  sceneId: number;
  audioId: number;
};

export type DeleteSceneAudio = (
  request: DeleteSceneAudioRequest,
) => Promise<DeleteSceneAudioResult>;

async function DeleteSceneAudio({
  storyId,
  sceneId,
  audioId,
}: DeleteSceneAudioRequest): Promise<DeleteSceneAudioResult> {
  try {
    const response = await fetch(
      `/api/story/${storyId}/scene/${sceneId}/audio/${audioId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 204) {
      return errorResult(response);
    }

    return {
      kind: "sceneAudioDeleted",
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
}

export default DeleteSceneAudio;

async function errorResult(response: Response): Promise<DeleteSceneAudioError> {
  const body = await response.json();

  const error = DeleteSceneAudioResponseErrorModel.safeParse(body);

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
