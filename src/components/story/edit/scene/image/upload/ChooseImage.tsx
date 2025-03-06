import { type ChangeEventHandler, type FC, useId } from "react";
import { useTranslation } from "react-i18next";

import type { NonEmptyArray } from "../../../../../../util/nonEmptyArray";
import toAcceptExtensions from "../../toAcceptExtensions";

import styles from "./ChooseImage.module.css";

const ACCEPT_EXTENSIONS_DEFAULT: NonEmptyArray<string> = [
  ".jpg",
  ".jpeg",
  ".png",
];

type ChooseImageProps = {
  accept?: NonEmptyArray<string>;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
};

const ChooseImage: FC<ChooseImageProps> = ({ accept, onFileChange }) => {
  const { t } = useTranslation();

  const idImageUpload = useId();

  const acceptExtensions = toAcceptExtensions(
    accept ?? ACCEPT_EXTENSIONS_DEFAULT,
  );

  return (
    <div className={styles.chooseImageContainer}>
      <img
        src="/images/placeholder.svg"
        alt={t("scene.image.placeholder")}
        title={t("scene.image.placeholder")}
      />
      <div className={styles.controls}>
        <label htmlFor={idImageUpload}>{t("scene.image.prompt")}</label>
        <input
          id={idImageUpload}
          style={{ display: "none" }}
          type="file"
          accept={acceptExtensions}
          multiple={false}
          onChange={onFileChange}
        />
      </div>
    </div>
  );
};

export default ChooseImage;
