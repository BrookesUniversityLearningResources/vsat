import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./StoryHeader.module.css";

import InlineTextInput, {
  type OnChange,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type { PersistentStory } from "../../../../domain/index.js";

export type StoryHeaderProps = {
  story: PersistentStory;
  onTitleChange: (title: string) => void;
};

const StoryHeader: FC<StoryHeaderProps> = ({ story, onTitleChange }) => {
  const { t } = useTranslation();

  const onChange: OnChange = ({ value }) => {
    onTitleChange(value);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChange={onChange}
        initialValue={story.title}
        i18n={{
          editing: {
            labelName: t("title.field.label"),
            labelSave: t("title.action.save-title"),
          },
          notEditing: { labelEdit: t("title.action.edit-title") },
        }}
        inputAttributes={{
          required: true,
          minLength: 3,
          maxLength: 50,
        }}
      >
        <h1>{t("title.label", { title: story.title })}</h1>
      </InlineTextInput>
    </div>
  );
};

export default StoryHeader;
