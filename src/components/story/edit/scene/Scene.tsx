import { useMutation, useQuery } from "@tanstack/react-query";
import type { FC } from "react";

import styles from "./Scene.module.css";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../../domain/index.js";
import unsupported from "../../../../domain/story/client/unsupportedResult.js";
import {
  type WithFeedback,
  type WithGetScene,
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
  onSceneChanged: OnSceneChanged;
};

const Scene: FC<SceneProps> = ({
  storyId,
  scene: initialScene,
  onSceneChanged,
}) => {
  const { getScene, saveSceneTitle, feedback } = useEnvironment<
    WithGetScene & WithSaveSceneTitle & WithFeedback
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
    mutationFn: ({ title }) =>
      saveSceneTitle(storyId, scene.id, title).then((result) => {
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
    onSuccess: () => {
      feedback.notify.info("scene.title.saved");
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

      default: {
        // we may want to check whether the scene (fiction) is dirty: i.e. it
        // has some existing (unsaved) changes; if so, we may not want to
        // refetch so coarsely 'cos we'll lose those changes.
        refetch();
      }
    }
  };

  return (
    <div className={styles.scene} id={htmlIdForScene(scene.id)}>
      <SceneHeader
        title={scene.title}
        onTitleChanged={(title) => {
          internalOnSceneChanged({
            kind: "sceneTitleChanged",
            title,
          });
        }}
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
