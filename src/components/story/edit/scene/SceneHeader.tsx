import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./SceneHeader.module.css";

import InlineTextInput, {
  type OnChange,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type { PersistentScene } from "../../../../domain/index.js";

export type SceneHeaderProps = {
  title: PersistentScene["title"];
  onTitleChange: (title: string) => void;
};

const SceneHeader: FC<SceneHeaderProps> = ({ title, onTitleChange }) => {
  const { t } = useTranslation();

  const onChange: OnChange = ({ value }) => {
    onTitleChange(value);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChange={onChange}
        initialValue={title}
        i18n={{
          editing: {
            labelName: t("scene.title.field.label"),
            labelSave: t("scene.title.action.save-title"),
          },
          notEditing: { labelEdit: t("scene.title.action.edit-title") },
        }}
        inputAttributes={{
          required: true,
          minLength: 3,
          maxLength: 50,
        }}
      >
        <h2>{t("scene.title.label", { title })}</h2>
      </InlineTextInput>
    </div>
  );
};

export default SceneHeader;
