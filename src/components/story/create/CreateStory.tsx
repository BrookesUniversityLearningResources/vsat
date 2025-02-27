import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";

import styles from "./CreateStory.module.css";

import { ErrorCodedError } from "../../../domain/error/ErrorCodedError.js";
import type { StoryCreated } from "../../../domain/story/client/createStory.js";
import unsupported from "../../../domain/story/client/unsupportedResult.js";
import useI18N from "../../../i18n/client/useI18N.js";
import {
  ClientContext,
  type WithCreateStory,
  type WithFeedback,
  createClientEnvironment,
  useEnvironment,
} from "../edit/context/ClientContext.js";

const StoryCreator: FC = () => {
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

type CreateStoryProps = {
  translations: Record<string, ResourceKey>;
};

const CreateStory: FC<CreateStoryProps> = ({ translations }) => {
  const i18n = useI18N(translations, navigator.language);

  const queryClient = new QueryClient();

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ClientContext.Provider value={createClientEnvironment(i18n)}>
          <StoryCreator />
        </ClientContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default CreateStory;
