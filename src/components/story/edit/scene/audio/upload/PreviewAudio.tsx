import type { FC } from "react";
import { useTranslation } from "react-i18next";
import BarLoader from "react-spinners/BarLoader";

import styles from "./PreviewAudio.module.css";

type PreviewAudioProps = Readonly<{
  audio: File;
  upload: (audio: File) => void;
  cancel: (audio: File) => void;
  isUploading: boolean;
}>;

const PreviewAudio: FC<PreviewAudioProps> = ({
  audio,
  upload,
  cancel,
  isUploading = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.previewAudioContainer}>
      <audio
        src={URL.createObjectURL(audio)}
        controls
        controlsList="nodownload"
      >
        <div>{audio.name}</div>
      </audio>

      <div className={styles.actionBar}>
        {!isUploading && (
          <>
            <button
              type="button"
              onClick={() => cancel(audio)}
              className={styles.cancelUpload}
            >
              {t("scene.action.cancel-audio.label")}
            </button>

            <button
              type="button"
              onClick={() => upload(audio)}
              className={styles.uploadAudio}
              disabled={isUploading}
            >
              <img
                src="/images/upload-white.svg"
                alt={t("scene.action.upload-audio.label")}
                title={t("scene.action.upload-audio.label")}
              />
            </button>
          </>
        )}

        {isUploading && (
          <div className={styles.uploadingIndicator}>
            <BarLoader width="100%" height="0.5rem" color="green" />
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewAudio;
