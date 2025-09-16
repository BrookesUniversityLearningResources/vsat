"use client";

import { type ErrorCodedContext, ErrorCodes } from "@domain/error/errorCode";

import type { PersistentScene } from "../../index.js";

export type SceneCreated = {
  kind: "sceneCreated";
  scene: PersistentScene;
};

export type CreateSceneError = {
  kind: "error";
  error: ErrorCodedContext<unknown>;
};

export type CreateSceneResult = SceneCreated | CreateSceneError;

export type CreateScene = (storyId: number) => Promise<CreateSceneResult>;

const createScene: CreateScene = async (storyId) => {
  try {
    const response = await fetch(`/api/story/${storyId}/scene`, {
      method: "POST",
    });

    if (!response.ok) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
          context: `Error creating scene: "${response.statusText}"`,
        },
      };
    }

    if (response.status !== 200) {
      return {
        kind: "error",
        error: {
          errorCode: ErrorCodes.Error,
          context: `Error creating scene: expecting 200, got ${response.status}`,
        },
      };
    }

    const scene = await response.json();

    return {
      kind: "sceneCreated",
      scene,
    };
  } catch {
    return {
      kind: "error",
      error: {
        errorCode: ErrorCodes.Error,
        context: "Error creating scene",
      },
    };
  }
};

export default createScene;
