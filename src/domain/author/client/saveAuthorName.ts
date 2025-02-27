"use client";

import { z } from "zod";

import { ErrorCodeModel, ErrorCodes } from "@domain/error/errorCode";

const SaveAuthorNameResponseErrorModel = z.object({
  errorCode: ErrorCodeModel,
  context: z.record(z.string(), z.unknown()).optional(),
});

export type SaveAuthorNameResponseError = z.infer<
  typeof SaveAuthorNameResponseErrorModel
>;

export type AuthorNameSaved = {
  kind: "authorNameSaved";
  name: string;
};

export type SaveAuthorNameError = {
  kind: "error";
  error: SaveAuthorNameResponseError;
};

export type SaveAuthorNameResult = AuthorNameSaved | SaveAuthorNameError;

export type SaveAuthorName = (
  authorId: number,
  name: string,
) => Promise<SaveAuthorNameResult>;

const saveAuthorName: SaveAuthorName = async (authorId, name) => {
  try {
    const response = await fetch(`/api/author/${authorId}/name`, {
      method: "PUT",
      body: name,
    });

    if (!response.ok) {
      return errorResult(response);
    }

    if (response.status !== 204) {
      return errorResult(response);
    }

    return {
      kind: "authorNameSaved",
      name,
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

export default saveAuthorName;

async function errorResult(response: Response): Promise<SaveAuthorNameError> {
  const body = await response.json();

  const error = SaveAuthorNameResponseErrorModel.safeParse(body);

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
