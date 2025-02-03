"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentStory } from "../../index";

const SaveStoryTitleResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveStoryTitleResponseError = z.infer<
  typeof SaveStoryTitleResponseErrorModel
>;

export type StoryTitleSaved = {
  kind: "storyTitleSaved";
  story: PersistentStory;
};

export type SaveStoryTitleError = {
  kind: "error";
  error: SaveStoryTitleResponseError;
};

export type SaveStoryTitleResult = StoryTitleSaved | SaveStoryTitleError;

export type SaveStoryTitle = (
  storyId: number,
  title: string,
) => Promise<SaveStoryTitleResult>;

const saveStoryTitle: SaveStoryTitle = async (storyId, title) => {
  try {
    const response = await fetch(`/api/story/${storyId}/title`, {
      method: "PUT",
      body: title,
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 200) {
      return errorResult(response);
    }

    const story = await response.json();

    return {
      kind: "storyTitleSaved",
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

export default saveStoryTitle;

async function errorResult(response: Response): Promise<SaveStoryTitleError> {
  const body = await response.json();

  const error = SaveStoryTitleResponseErrorModel.safeParse(body);

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
