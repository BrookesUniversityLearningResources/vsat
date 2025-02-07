import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./StoryHeader.module.css";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput.js";
import unsupported from "@domain/story/client/unsupportedResult.js";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../../domain/index.js";
import {
  type WithCreateScene,
  type WithFeedback,
  type WithPublishStory,
  useEnvironment,
} from "../context/ClientContext.js";
import type { OnSceneChanged } from "../scene/types.js";

export type StoryHeaderProps = {
  story: PersistentStory;
  onSceneChanged: OnSceneChanged;
  onStoryTitleChanged: (title: string) => void;
};

const StoryHeader: FC<StoryHeaderProps> = ({
  story,
  onSceneChanged,
  onStoryTitleChanged,
}) => {
  const { t } = useTranslation();

  const { createScene, publishStory, feedback } = useEnvironment<
    WithCreateScene & WithPublishStory & WithFeedback
  >();

  const onSceneTitleChanged: OnChanged = ({ value }) => {
    onStoryTitleChanged(value);
  };

  const publishTheStory = useMutation<
    PersistentStory,
    Error,
    PersistentStory["id"]
  >({
    mutationFn: () =>
      publishStory(story.id).then((result) => {
        switch (result.kind) {
          case "storyPublished":
            return result.story;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () => {
      feedback.notify.info("story.published");
    },
  });

  const onPublishStory = () => {
    publishTheStory.mutate(story.id);
  };

  const createTheScene = useMutation<
    PersistentScene,
    Error,
    PersistentStory["id"]
  >({
    mutationFn: (storyId) =>
      createScene(storyId).then((result) => {
        switch (result.kind) {
          case "sceneCreated":
            return result.scene;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (createdScene) =>
      onSceneChanged({
        kind: "sceneCreated",
        scene: createdScene,
      }),
  });

  const onCreateScene = () => {
    createTheScene.mutate(story.id);
  };

  return (
    <div className={styles.header}>
      <InlineTextInput
        onChanged={onSceneTitleChanged}
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

      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={onPublishStory}
          disabled={publishTheStory.isPending}
        >
          <img
            src="/images/publish-24.png"
            alt={t("scene.action.publish-story.label")}
            title={t("scene.action.publish-story.label")}
          />
        </button>
        <button
          type="button"
          onClick={onCreateScene}
          disabled={createTheScene.isPending}
        >
          <img
            src="/images/message-square-add-solid-24.png"
            alt={t("scene.action.create-scene.label")}
            title={t("scene.action.create-scene.label")}
          />
        </button>
      </div>
    </div>
  );
};

export default StoryHeader;
