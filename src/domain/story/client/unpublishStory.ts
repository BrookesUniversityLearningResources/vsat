"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentStory } from "../../index";

const UnpublishStoryResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type UnpublishStoryResponseError = z.infer<
  typeof UnpublishStoryResponseErrorModel
>;

export type StoryUnpublished = {
  kind: "storyUnpublished";
  story: PersistentStory;
};

export type UnpublishStoryError = {
  kind: "error";
  error: UnpublishStoryResponseError;
};

export type UnpublishStoryResult = StoryUnpublished | UnpublishStoryError;

export type UnpublishStory = (
  storyId: PersistentStory["id"],
) => Promise<UnpublishStoryResult>;

const unpublishStory: UnpublishStory = async (storyId) => {
  try {
    const response = await fetch(`/api/story/${storyId}/publish`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 200) {
      return errorResult(response);
    }

    const story = await response.json();

    return {
      kind: "storyUnpublished",
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

export default unpublishStory;

async function errorResult(response: Response): Promise<UnpublishStoryError> {
  const body = await response.json();

  const error = UnpublishStoryResponseErrorModel.safeParse(body);

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
