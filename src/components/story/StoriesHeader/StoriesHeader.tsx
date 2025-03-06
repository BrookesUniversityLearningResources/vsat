import { useMutation } from "@tanstack/react-query";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput";
import type { PersistentStory } from "@domain/index.js";
import unsupported from "@domain/story/client/unsupportedResult.js";

import CreateStory from "../create/CreateStory";
import {
  type WithFeedback,
  type WithSaveAuthorName,
  useEnvironment,
} from "../edit/context/ClientContext";

import styles from "./StoriesHeader.module.css";

type AuthorName = PersistentStory["author"]["name"];

type StoriesHeaderProps = {
  author: PersistentStory["author"];
  showCreateStory?: boolean;
};

const StoriesHeader: FC<StoriesHeaderProps> = ({
  author,
  showCreateStory = false,
}) => {
  const { t } = useTranslation();

  const [authorName, setAuthorName] = useState<AuthorName>(author.name);

  const { saveAuthorName, feedback } = useEnvironment<
    WithSaveAuthorName & WithFeedback
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

      {showCreateStory && <CreateStory />}
    </div>
  );
};

export default StoriesHeader;
