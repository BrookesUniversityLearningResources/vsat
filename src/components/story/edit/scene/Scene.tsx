import { useQuery } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./Scene.module.css";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../../domain/index.js";
import unsupported from "../../../../domain/story/client/unsupportedResult.js";
import { type WithGetScene, useEnvironment } from "../context/ClientContext.js";
import SceneFiction from "./fiction/SceneFiction.js";
import SceneImage from "./image/SceneImage.js";
import type { OnSceneChanged } from "./types.js";
import SceneAudio from "./audio/SceneAudio.js";

type SceneProps = {
  scene: PersistentScene;
  storyId: PersistentStory["id"];
};

const Scene: FC<SceneProps> = ({ scene: initialScene, storyId }) => {
  const { t } = useTranslation();

  const { getScene } = useEnvironment<WithGetScene>();

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

  const onSceneChanged: OnSceneChanged = (change) => {
    console.log(change);

    // later we can check to see if scene fiction is dirty, etc.
    refetch();
  };

  return (
    <div className={styles.scene}>
      <h2>{t("scene.heading", { title: scene.title })}</h2>
      <div className={styles.sceneContent}>
        <div className={styles.sceneMedia}>
          <SceneImage
            scene={scene}
            storyId={storyId}
            onSceneChanged={onSceneChanged}
          />
          <SceneAudio
            scene={scene}
            storyId={storyId}
            onSceneChanged={onSceneChanged}
          />
        </div>
        <SceneFiction
          storyId={storyId}
          scene={scene}
          onSceneChanged={onSceneChanged}
        />
      </div>
    </div>
  );
};

export default Scene;
