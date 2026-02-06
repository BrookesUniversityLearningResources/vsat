import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import BarLoader from "react-spinners/BarLoader.js";

import styles from "./ExistingImage.module.css";

import type {
  PersistentImage,
  PersistentScene,
  PersistentStory,
} from "../../../../../domain/index.js";
import unsupported from "../../../../../domain/story/client/unsupportedResult.js";
import {
  type WithDeleteSceneImage,
  type WithFeedback,
  useEnvironment,
} from "../../context/ClientContext.js";
import type { OnSceneChanged } from "../types.js";

type ExistingImageProps = {
  image: PersistentImage;
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  onSceneChanged: OnSceneChanged;
};

const ExistingImage: FC<ExistingImageProps> = ({
  image,
  storyId,
  sceneId,
  onSceneChanged,
}) => {
  const { deleteSceneImage, feedback } = useEnvironment<
    WithDeleteSceneImage & WithFeedback
  >();

  const deletion = useMutation<null, Error, PersistentImage>({
    mutationFn: (image) =>
      deleteSceneImage({ storyId, sceneId, imageId: image.id }).then(
        (result) => {
          switch (result.kind) {
            case "sceneImageDeleted":
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
        kind: "imageChanged",
        id: sceneId,
        image: null,
      }),
  });

  const { t } = useTranslation();

  return (
    <div className={styles.existingImage}>
      <img
        src={image.thumbnailUrl}
        alt={t("scene.image.alt-text")}
        crossOrigin="anonymous"
      />

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
            onClick={() => deletion.mutate(image)}
          >
            <img
              src="/images/bin-white.svg"
              alt={t("scene.action.delete-image.label")}
              title={t("scene.action.delete-image.label")}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExistingImage;
