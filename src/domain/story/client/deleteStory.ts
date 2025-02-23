"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

const DeleteStoryResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type DeleteStoryResponseError = z.infer<
  typeof DeleteStoryResponseErrorModel
>;

export type StoryDeleted = {
  kind: "storyDeleted";
};

export type DeleteStoryError = {
  kind: "error";
  error: DeleteStoryResponseError;
};

export type DeleteStoryResult = StoryDeleted | DeleteStoryError;

export type DeleteStoryRequest = {
  storyId: number;
};

export type DeleteStory = (
  request: DeleteStoryRequest,
) => Promise<DeleteStoryResult>;

async function deleteStory({
  storyId,
}: DeleteStoryRequest): Promise<DeleteStoryResult> {
  try {
    const response = await fetch(`/api/story/${storyId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 204) {
      return errorResult(response);
    }

    return {
      kind: "storyDeleted",
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

export default deleteStory;

async function errorResult(response: Response): Promise<DeleteStoryError> {
  const body = await response.json();

  const error = DeleteStoryResponseErrorModel.safeParse(body);

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
