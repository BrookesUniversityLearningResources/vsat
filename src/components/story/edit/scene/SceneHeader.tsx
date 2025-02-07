import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./SceneHeader.module.css";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type { PersistentScene } from "../../../../domain/index.js";

export type SceneHeaderProps = {
  title: PersistentScene["title"];
  onTitleChanged: (title: string) => void;
};

const SceneHeader: FC<SceneHeaderProps> = ({ title, onTitleChanged }) => {
  const { t } = useTranslation();

  const onChanged: OnChanged = ({ value }) => {
    onTitleChanged(value);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChanged={onChanged}
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
