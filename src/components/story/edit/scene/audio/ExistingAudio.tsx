import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import BarLoader from "react-spinners/BarLoader.js";
import type {
  PersistentAudio,
  PersistentScene,
  PersistentStory,
} from "../../../../../domain/index.js";
import unsupported from "../../../../../domain/story/client/unsupportedResult.js";
import {
  useEnvironment,
  type WithDeleteSceneAudio,
  type WithFeedback,
} from "../../context/ClientContext.js";
import type { OnSceneChanged } from "../types.js";
import AudioPlayer from "./AudioPlayer.js";
import styles from "./ExistingAudio.module.css";

type ExistingAudioProps = {
  audio: PersistentAudio;
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  onSceneChanged: OnSceneChanged;
};

const ExistingAudio: FC<ExistingAudioProps> = ({
  audio,
  storyId,
  sceneId,
  onSceneChanged,
}) => {
  const { deleteSceneAudio, feedback } = useEnvironment<
    WithDeleteSceneAudio & WithFeedback
  >();

  const deletion = useMutation<null, Error, PersistentAudio>({
    mutationFn: (audio) =>
      deleteSceneAudio({ storyId, sceneId, audioId: audio.id }).then(
        (result) => {
          switch (result.kind) {
            case "sceneAudioDeleted":
              return null;
            case "error":
              return Promise.reject(result.error);
            default:
              return unsupported(result);
          }
        },
      ),
    onError: feedback.notify.error,
    onSuccess: () =>
      onSceneChanged({
        kind: "audioChanged",
        id: sceneId,
        audio: null,
      }),
  });

  const { t } = useTranslation();

  return (
    <div className={styles.existingAudio}>
      <AudioPlayer src={audio.url} />

      <div className={styles.actionBar}>
        <div className={styles.loadingContainer}>
          {deletion.isPending && (
            <BarLoader width="100%" height="0.5rem" color="green" />
          )}
        </div>

        {!deletion.isPending && (
          <button
            type="button"
            disabled={deletion.isPending}
            onClick={() => deletion.mutate(audio)}
          >
            <img
              src="/images/bin-white.svg"
              alt={t("scene.action.delete-audio.label")}
              title={t("scene.action.delete-audio.label")}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExistingAudio;
