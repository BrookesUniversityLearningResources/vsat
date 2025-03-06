import { type ChangeEventHandler, type FC, useId } from "react";
import { useTranslation } from "react-i18next";

import type { NonEmptyArray } from "../../../../../../util/nonEmptyArray";
import toAcceptExtensions from "../../toAcceptExtensions";

import styles from "./ChooseAudio.module.css";

const ACCEPT_EXTENSIONS_DEFAULT: NonEmptyArray<string> = [".mp3", ".mp4"];

type ChooseAudioProps = {
  accept?: NonEmptyArray<string>;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
};

const ChooseAudio: FC<ChooseAudioProps> = ({ accept, onFileChange }) => {
  const { t } = useTranslation();

  const idAudioUpload = useId();

  const acceptExtensions = toAcceptExtensions(
    accept ?? ACCEPT_EXTENSIONS_DEFAULT,
  );

  return (
    <div className={styles.chooseAudioContainer}>
      <label htmlFor={idAudioUpload}>{t("scene.audio.prompt")}</label>
      <input
        id={idAudioUpload}
        style={{ display: "none" }}
        type="file"
        accept={acceptExtensions}
        multiple={false}
        onChange={onFileChange}
      />
    </div>
  );
};

export default ChooseAudio;
