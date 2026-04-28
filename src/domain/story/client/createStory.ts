"use client";

import { type ErrorCodedContext, ErrorCodes } from "@domain/error/errorCode";
import { z } from "zod";

export const CreateStoryResponseModel = z.object({
  id: z.number().int(),
});

export type StoryCreated = {
  kind: "storyCreated";
  url: string;
};

export type StoryCreationError = {
  kind: "error";
  error: ErrorCodedContext<unknown>;
};

export type CreateStoryResult = StoryCreated | StoryCreationError;

export type CreateStory = () => Promise<CreateStoryResult>;

async function createStory(): Promise<CreateStoryResult> {
  try {
    const response = await fetch("/api/story", {
      method: "POST",
    });

    if (!response.ok) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
          context: `Error creating story: "${response.statusText}"`,
        },
      };
    }

    if (response.status !== 200) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
          context: `Error creating story: expecting 200, got ${response.status}`,
        },
      };
    }

    const result = CreateStoryResponseModel.safeParse(await response.json());

    if (result.error) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
          context: `Error creating story, malformed response: ${result.error.format()}`,
        },
      };
    }

    const story = result.data;

    const url = new URL(
      `/author/story/${story.id}`,
      new URL(window.location.toString()).origin,
    ).href;

    return {
      kind: "storyCreated",
      url,
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

export default createStory;
