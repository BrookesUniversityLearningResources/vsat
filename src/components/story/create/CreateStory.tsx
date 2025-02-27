import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./CreateStory.module.css";

import { ErrorCodedError } from "../../../domain/error/ErrorCodedError.js";
import type { StoryCreated } from "../../../domain/story/client/createStory.js";
import unsupported from "../../../domain/story/client/unsupportedResult.js";
import {
  type WithCreateStory,
  type WithFeedback,
  useEnvironment,
} from "../edit/context/ClientContext.js";

const CreateStory: FC = () => {
  const { t } = useTranslation();

  const { createStory, feedback } = useEnvironment<
    WithCreateStory & WithFeedback
  >();

  const createTheStory = useMutation<StoryCreated["url"], Error>({
    mutationFn: () =>
      createStory().then((result) => {
        switch (result.kind) {
          case "storyCreated":
            return result.url;
          case "error":
            return Promise.reject(
              new ErrorCodedError(
                result.error.errorCode,
                "Error creating story",
                { cause: result.error.context },
              ),
            );
          default:
            return unsupported(result);
        }
      }),
    onError: (err) => {
      feedback.notify.error(err);
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
  });

  const onCreateStory = () => {
    createTheStory.mutate();
  };

  const label = t("action.create-story.label");

  return (
    <button
      type="button"
      className={styles.createStory}
      onClick={onCreateStory}
      disabled={createTheStory.isPending}
    >
      {label}
      <img src="/images/add-white.svg" alt={label} title={label} />
    </button>
  );
};

export default CreateStory;
