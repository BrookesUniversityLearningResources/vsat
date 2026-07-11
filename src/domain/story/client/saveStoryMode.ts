"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentStory } from "../../index";
import type { StoryMode } from "../publish/types";

const SaveStoryModeResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveStoryModeResponseError = z.infer<
  typeof SaveStoryModeResponseErrorModel
>;

export type StoryModeSaved = {
  kind: "storyModeSaved";
  story: PersistentStory;
};

export type SaveStoryModeError = {
  kind: "error";
  error: SaveStoryModeResponseError;
};

export type SaveStoryModeResult = StoryModeSaved | SaveStoryModeError;

export type SaveStoryMode = (
  storyId: number,
  mode: StoryMode,
) => Promise<SaveStoryModeResult>;

const saveStoryMode: SaveStoryMode = async (storyId, mode) => {
  try {
    const response = await fetch(`/api/story/${storyId}/mode`, {
      method: "PUT",
      body: mode,
    });

    if (!response.ok || response.status !== 200) {
      return errorResult(response);
    }

    const story = await response.json();

    return {
      kind: "storyModeSaved",
      story,
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

export default saveStoryMode;

async function errorResult(response: Response): Promise<SaveStoryModeError> {
  const body = await response.json();

  const error = SaveStoryModeResponseErrorModel.safeParse(body);

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
