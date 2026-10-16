import { useMutation, useQuery } from "@tanstack/react-query";
import type { FC } from "react";

import styles from "./Scene.module.css";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../../domain/index.js";
import unsupported from "../../../../domain/story/client/unsupportedResult.js";
import type { StoryMode } from "../../../../domain/story/publish/types.js";
import {
  type WithFeedback,
  type WithGetScene,
  type WithSaveSceneMode,
  type WithSaveSceneTitle,
  useEnvironment,
} from "../context/ClientContext.js";
import SceneHeader from "./SceneHeader.js";
import SceneAudio from "./audio/SceneAudio.js";
import SceneFiction from "./fiction/SceneFiction.js";
import htmlIdForScene from "./htmlIdForScene.js";
import SceneImage from "./image/SceneImage.js";
import type { OnSceneChanged, SceneTitleChanged } from "./types.js";

export type SceneTitleChangeEvent = {
  sceneId: PersistentScene["id"];
  title: string;
};

export type SceneProps = {
  scene: PersistentScene;
  storyId: PersistentStory["id"];
  storyMode: StoryMode;
  onSceneChanged: OnSceneChanged;
  linkInfo?: {
    count: number;
    pages: number[];
  };
  // false on a 2D-only deployment: no per-scene 360°/2D pin
  photospheres?: boolean;
};

const Scene: FC<SceneProps> = ({
  storyId,
  storyMode,
  scene: initialScene,
  onSceneChanged,
  linkInfo,
  photospheres = true,
}) => {
  const { getScene, saveSceneTitle, saveSceneMode, feedback } =
    useEnvironment<
      WithGetScene & WithSaveSceneTitle & WithSaveSceneMode & WithFeedback
    >();

  const { data: scene, refetch } = useQuery<PersistentScene, Error>({
    enabled: false,
    queryKey: [`scene-${initialScene.id}`],
    initialData: initialScene,
    queryFn: () =>
      getScene(storyId, initialScene.id).then((result) => {
        switch (result.kind) {
          case "gotScene":
            return result.scene;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
  });

  const saveTheSceneTitle = useMutation<
    PersistentScene,
    Error,
    SceneTitleChanged
  >({
    mutationFn: ({ title, sceneId }) =>
      saveSceneTitle(storyId, sceneId, title).then((result) => {
        switch (result.kind) {
          case "sceneTitleSaved":
            return result.scene;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (_, variables) => {
      refetch();
      onSceneChanged({
        kind: "sceneTitleChanged",
        sceneId: variables.sceneId,
        title: variables.title,
      });
    },
  });

  // null = follow the story's mode
  const saveTheSceneMode = useMutation<
    PersistentScene,
    Error,
    StoryMode | null
  >({
    mutationFn: (mode) =>
      saveSceneMode(storyId, scene.id, mode).then((result) => {
        switch (result.kind) {
          case "sceneModeSaved":
            return result.scene;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () => {
      refetch();
    },
  });

  const internalOnSceneChanged: OnSceneChanged = (e) => {
    switch (e.kind) {
      case "sceneTitleChanged": {
        saveTheSceneTitle.mutate(e);
        break;
      }

      case "sceneDeleted": {
        onSceneChanged(e);
        break;
      }

      case "contentChanged":
      case "imageChanged":
      case "audioChanged": {
        refetch();
        onSceneChanged(e);
        break;
      }

      default: {
        // we may want to check whether the scene (fiction) is dirty: i.e. it
        // has some existing (unsaved) changes; if so, we may not want to
        // refetch so coarsely 'cos we'll lose those changes.
        refetch();
      }
    }
  };

  const proposeLinkFromHere = () => {
    const location =
      "location" in globalThis ? (globalThis.location as Location) : undefined;
    if (!location) {
      return;
    }
    const parts = location.pathname.split("/");
    const storyIndex = parts.indexOf("story");
    const resolvedStoryId =
      storyIndex >= 0 ? Number(parts[storyIndex + 1]) : storyId;
    const url = new URL(`/author/story/${resolvedStoryId}/links`, location.origin);
    url.searchParams.set("contextSceneId", String(scene.id));
    location.href = url.toString();
  };

  return (
    <div className={styles.scene} id={htmlIdForScene(scene.id)}>
      <SceneHeader
        title={scene.title}
        onTitleChanged={(title) => {
          internalOnSceneChanged({
            kind: "sceneTitleChanged",
            sceneId: scene.id,
            title,
          });
        }}
        linkInfo={linkInfo}
        onProposeLink={proposeLinkFromHere}
        mode={scene.mode ?? null}
        storyMode={storyMode}
        onModeChanged={
          photospheres ? (mode) => saveTheSceneMode.mutate(mode) : undefined
        }
        modeSaving={saveTheSceneMode.isPending}
      />

      <div className={styles.sceneContent}>
        <div className={styles.sceneMedia}>
          <SceneImage
            scene={scene}
            storyId={storyId}
            onSceneChanged={internalOnSceneChanged}
          />
          <SceneAudio
            scene={scene}
            storyId={storyId}
            onSceneChanged={internalOnSceneChanged}
          />
        </div>
        <SceneFiction
          storyId={storyId}
          scene={scene}
          onSceneChanged={internalOnSceneChanged}
        />
      </div>
    </div>
  );
};

export default Scene;
