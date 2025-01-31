import type { ChangeEventHandler, FC } from "react";
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

  const acceptExtensions = toAcceptExtensions(
    accept ?? ACCEPT_EXTENSIONS_DEFAULT,
  );

  return (
    <div className={styles.chooseImageContainer}>
      <img
        src="/images/scene-image-placeholder.svg"
        alt={t("scene.image.placeholder")}
      />
      <input
        type="file"
        accept={acceptExtensions}
        multiple={false}
        onChange={onFileChange}
      />
    </div>
  );
};

export default ChooseImage;
