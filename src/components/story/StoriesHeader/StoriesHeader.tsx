import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput";
import type { PersistentStory } from "@domain/index.js";
import unsupported from "@domain/story/client/unsupportedResult.js";
import type { StoryMode } from "@domain/story/publish/types.js";
import { useMutation } from "@tanstack/react-query";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

import CreateStory from "../create/CreateStory";
import {
  useEnvironment,
  type WithFeedback,
  type WithSaveAuthorDefaultStoryMode,
  type WithSaveAuthorName,
} from "../edit/context/ClientContext";

import styles from "./StoriesHeader.module.css";

type AuthorName = PersistentStory["author"]["name"];

type StoriesHeaderProps = {
  author: PersistentStory["author"];
  defaultStoryMode: StoryMode;
  showCreateStory?: boolean;
};

const STORY_MODES: StoryMode[] = ["360", "2d"];

const StoriesHeader: FC<StoriesHeaderProps> = ({
  author,
  defaultStoryMode: initialDefaultStoryMode,
  showCreateStory = false,
}) => {
  const { t } = useTranslation();

  const [authorName, setAuthorName] = useState<AuthorName>(author.name);

  const [defaultStoryMode, setDefaultStoryMode] = useState<StoryMode>(
    initialDefaultStoryMode,
  );

  const { saveAuthorName, saveAuthorDefaultStoryMode, feedback } =
    useEnvironment<
      WithSaveAuthorName & WithSaveAuthorDefaultStoryMode & WithFeedback
    >();

  const saveTheAuthorName = useMutation<AuthorName, Error, AuthorName>({
    mutationFn: (newName) =>
      saveAuthorName(author.id, newName).then((result) => {
        switch (result.kind) {
          case "authorNameSaved":
            return result.name;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (newName) => {
      setAuthorName(newName);
    },
  });

  const saveTheDefaultStoryMode = useMutation<StoryMode, Error, StoryMode>({
    mutationFn: (newMode) =>
      saveAuthorDefaultStoryMode(author.id, newMode).then((result) => {
        switch (result.kind) {
          case "authorDefaultStoryModeSaved":
            return result.defaultStoryMode;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (newMode) => {
      setDefaultStoryMode(newMode);
    },
  });

  const onAuthorNameChanged: OnChanged = ({ value }) => {
    saveTheAuthorName.mutate(value);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChanged={onAuthorNameChanged}
        initialValue={authorName}
        i18n={{
          editing: {
            labelName: t("author-name.field.label"),
            labelSave: t("author-name.action.save-name"),
            labelClose: t("common.close"),
          },
          notEditing: { labelEdit: t("author-name.action.edit-name") },
        }}
        inputAttributes={{
          required: true,
          minLength: 3,
          maxLength: 50,
        }}
      >
        <h1>{t("heading", { authorName })}</h1>
      </InlineTextInput>

      <div className={styles.actionBar}>
        <fieldset
          className={styles.defaultStoryMode}
          title={t("default-story-mode.hint")}
          disabled={saveTheDefaultStoryMode.isPending}
        >
          <legend>{t("default-story-mode.label")}</legend>
          {STORY_MODES.map((mode) => (
            <label key={mode} data-checked={mode === defaultStoryMode}>
              <input
                type="radio"
                name="default-story-mode"
                value={mode}
                checked={mode === defaultStoryMode}
                onChange={() => saveTheDefaultStoryMode.mutate(mode)}
              />
              {t(`default-story-mode.option.${mode}`)}
            </label>
          ))}
        </fieldset>

        {showCreateStory && <CreateStory />}

        <a href="/logout">{t("common.logout.label")}</a>
      </div>
    </div>
  );
};

export default StoriesHeader;
