"use client";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";
import type { StoryMode } from "@domain/story/publish/types";
import { z } from "zod";

const SaveAuthorDefaultStoryModeResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveAuthorDefaultStoryModeResponseError = z.infer<
  typeof SaveAuthorDefaultStoryModeResponseErrorModel
>;

export type AuthorDefaultStoryModeSaved = {
  kind: "authorDefaultStoryModeSaved";
  defaultStoryMode: StoryMode;
};

export type SaveAuthorDefaultStoryModeError = {
  kind: "error";
  error: SaveAuthorDefaultStoryModeResponseError;
};

export type SaveAuthorDefaultStoryModeResult =
  | AuthorDefaultStoryModeSaved
  | SaveAuthorDefaultStoryModeError;

export type SaveAuthorDefaultStoryMode = (
  authorId: number,
  defaultStoryMode: StoryMode,
) => Promise<SaveAuthorDefaultStoryModeResult>;

const saveAuthorDefaultStoryMode: SaveAuthorDefaultStoryMode = async (
  authorId,
  defaultStoryMode,
) => {
  try {
    const response = await fetch(`/api/author/${authorId}/default-story-mode`, {
      method: "PUT",
      body: defaultStoryMode,
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 204) {
      return errorResult(response);
    }

    return {
      kind: "authorDefaultStoryModeSaved",
      defaultStoryMode,
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

export default saveAuthorDefaultStoryMode;

async function errorResult(
  response: Response,
): Promise<SaveAuthorDefaultStoryModeError> {
  const body = await response.json();

  const error = SaveAuthorDefaultStoryModeResponseErrorModel.safeParse(body);

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
