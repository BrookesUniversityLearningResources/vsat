import type { FC } from "react";
import { useTranslation } from "react-i18next";
import BarLoader from "react-spinners/BarLoader";

import styles from "./PreviewImage.module.css";

type PreviewImageProps = Readonly<{
  image: File;
  upload: (image: File) => void;
  cancel: (image: File) => void;
  isUploading: boolean;
}>;

const PreviewImage: FC<PreviewImageProps> = ({
  image,
  upload,
  cancel,
  isUploading = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className={styles.previewImageContainer}>
      <img src={URL.createObjectURL(image)} alt={t("scene.image.preview")} />

      <div className={styles.actionBar}>
        {!isUploading && (
          <>
            <button
              type="button"
              onClick={() => cancel(image)}
              className={styles.cancelUpload}
            >
              {t("scene.action.cancel-image.label")}
            </button>

            <button
              type="button"
              onClick={() => upload(image)}
              className={styles.uploadImage}
              disabled={isUploading}
            >
              <img
                src="/images/upload-white.svg"
                alt={t("scene.action.upload-image.label")}
                title={t("scene.action.upload-image.label")}
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

export default PreviewImage;
