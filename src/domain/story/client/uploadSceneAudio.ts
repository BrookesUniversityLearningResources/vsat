"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentAudio } from "../../index";

const UploadSceneAudioResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type UploadSceneAudioResponseError = z.infer<
  typeof UploadSceneAudioResponseErrorModel
>;

export type SceneAudioUploaded = {
  kind: "sceneAudioUploaded";
  audio: PersistentAudio;
};

export type UploadSceneAudioError = {
  kind: "error";
  error: UploadSceneAudioResponseError;
};

export type UploadSceneAudioResult = SceneAudioUploaded | UploadSceneAudioError;

export type UploadSceneAudio = (
  request: UploadSceneAudioRequest,
) => Promise<UploadSceneAudioResult>;

export type UploadSceneAudioRequest = {
  storyId: number;
  sceneId: number;
  audioData: File;
};

async function uploadSceneAudio({
  storyId,
  sceneId,
  audioData,
}: UploadSceneAudioRequest): Promise<UploadSceneAudioResult> {
  try {
    const body = new FormData();
    body.append("scene-audio", audioData);

    const response = await fetch(
      `/api/story/${storyId}/scene/${sceneId}/audio`,
      {
        method: "POST",
        body,
      },
    );

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 200) {
      return errorResult(response);
    }

    const audio = await response.json();

    return {
      kind: "sceneAudioUploaded",
      audio,
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

export default uploadSceneAudio;

async function errorResult(response: Response): Promise<UploadSceneAudioError> {
  const body = await response.json();

  const error = UploadSceneAudioResponseErrorModel.safeParse(body);

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
