"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

const CreateStoryResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type CreateStoryResponseError = z.infer<
  typeof CreateStoryResponseErrorModel
>;

export type StoryCreated = {
  kind: "storyCreated";
  url: string;
};

export type StoryCreationError = {
  kind: "error";
  error: CreateStoryResponseError;
};

export type CreateStoryResult = StoryCreated | StoryCreationError;

export type CreateStory = () => Promise<CreateStoryResult>;

async function createStory(): Promise<CreateStoryResult> {
  try {
    const response = await fetch("/api/story", {
      method: "POST",
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (!response.headers.has("Location")) {
      console.warn('Response is missing the "Location" header');

      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
        },
      };
    }

    const maybeUrl = response.headers.get("Location");

    if (!maybeUrl) {
      console.warn(
        'The "Location" header with the URL of the created story is blank',
      );

      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
        },
      };
    }

    try {
      const url = new URL(maybeUrl).href;

      return {
        kind: "storyCreated",
        url,
      };
    } catch {
      console.warn(
        'The "Location" header with the URL of the created story is malformed',
      );

      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
        },
      };
    }
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

export default createStory;

async function errorResult(response: Response): Promise<StoryCreationError> {
  const body = await response.json();

  const error = CreateStoryResponseErrorModel.safeParse(body);

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
