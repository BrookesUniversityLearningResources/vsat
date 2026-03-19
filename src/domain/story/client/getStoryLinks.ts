"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";
import type { StoryLinkSummary } from "../../index";

const GetStoryLinksResponseModel = z.object({
  links: z.array(z.unknown()),
});

const GetStoryLinksResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type GetStoryLinksResponseError = z.infer<
  typeof GetStoryLinksResponseErrorModel
>;

export type StoryLinksGotten = {
  kind: "gotStoryLinks";
  links: StoryLinkSummary[];
};

export type GetStoryLinksError = {
  kind: "error";
  error: GetStoryLinksResponseError;
};

export type GetStoryLinksResult = StoryLinksGotten | GetStoryLinksError;

export type GetStoryLinks = (storyId: number) => Promise<GetStoryLinksResult>;

async function getStoryLinks(storyId: number): Promise<GetStoryLinksResult> {
  try {
    const response = await fetch(`/api/story/${storyId}/links`);

    if (!response.ok || response.status !== 200) {
      return errorResult(response);
    }

    const body = await response.json();
    const parsed = GetStoryLinksResponseModel.safeParse(body);

    if (!parsed.success) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
        },
      };
    }

    return {
      kind: "gotStoryLinks",
      links: parsed.data.links as StoryLinkSummary[],
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

export default getStoryLinks;

async function errorResult(response: Response): Promise<GetStoryLinksError> {
  const body = await response.json();
  const error = GetStoryLinksResponseErrorModel.safeParse(body);

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
