import type { FC } from "react";

import styles from "./SceneAudio.module.css";

import { isPersistentAudio } from "../../../../../domain/audio/types.js";
import type {
  PersistentScene,
  PersistentStory,
} from "../../../../../domain/index.js";
import type { OnSceneChanged } from "../types.js";
import ExistingAudio from "./ExistingAudio.js";
import UploadAudio from "./upload/UploadAudio.js";

type SceneAudioProps = {
  scene: PersistentScene;
  storyId: PersistentStory["id"];
  onSceneChanged: OnSceneChanged;
};

const SceneAudio: FC<SceneAudioProps> = ({
  scene,
  storyId,
  onSceneChanged,
}) => {
  if (isPersistentAudio(scene.audio)) {
    return (
      <div className={styles.sceneAudio}>
        <ExistingAudio
          storyId={storyId}
          sceneId={scene.id}
          audio={scene.audio}
          onSceneChanged={onSceneChanged}
        />
      </div>
    );
  }

  return (
    <div className={styles.sceneAudio}>
      <UploadAudio
        storyId={storyId}
        sceneId={scene.id}
        onSceneChanged={onSceneChanged}
      />
    </div>
  );
};

export default SceneAudio;
