import { useMutation } from "@tanstack/react-query";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import styles from "./StoryHeader.module.css";

import InlineTextInput, {
  type OnChanged,
} from "@components/input/InlineTextInput/InlineTextInput.js";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../../domain/index.js";
import unsupported from "../../../../domain/story/client/unsupportedResult.js";
import {
  type WithCreateScene,
  type WithDeleteStory,
  type WithFeedback,
  type WithPublishStory,
  type WithUnpublishStory,
  useEnvironment,
} from "../context/ClientContext.js";
import type { OnSceneChanged } from "../scene/types.js";
import type { OnStoryChanged } from "../types.js";

export type StoryHeaderProps = {
  story: PersistentStory;
  onSceneChanged: OnSceneChanged;
  onStoryChanged: OnStoryChanged;
};

const StoryHeader: FC<StoryHeaderProps> = ({
  story,
  onSceneChanged,
  onStoryChanged,
}) => {
  const { t } = useTranslation();

  const { createScene, publishStory, unpublishStory, deleteStory, feedback } =
    useEnvironment<
      WithCreateScene &
        WithPublishStory &
        WithUnpublishStory &
        WithDeleteStory &
        WithFeedback
    >();

  const onSceneTitleChanged: OnChanged = ({ value }) => {
    onStoryChanged({
      kind: "storyTitleChanged",
      title: value,
    });
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
    onSuccess: (publishedStory) => {
      onStoryChanged({
        kind: "storyPublished",
        story: publishedStory,
      });
    },
  });

  const onPublishStory = () => {
    publishTheStory.mutate(story.id);
  };

  const unpublishTheStory = useMutation<
    PersistentStory,
    Error,
    PersistentStory["id"]
  >({
    mutationFn: () =>
      unpublishStory(story.id).then((result) => {
        switch (result.kind) {
          case "storyUnpublished":
            return result.story;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (unpublishedStory) => {
      onStoryChanged({
        kind: "storyUnpublished",
        story: unpublishedStory,
      });
    },
  });

  const onUnpublishStory = async () => {
    const result = await feedback.dialog.yesNo(
      "action.unpublish-story.confirm.prompt",
    );

    if (result.isConfirmed) {
      unpublishTheStory.mutate(story.id);
    }
  };

  const deleteTheStory = useMutation<unknown, Error, PersistentStory["id"]>({
    mutationFn: () =>
      deleteStory({ storyId: story.id }).then((result) => {
        switch (result.kind) {
          case "storyDeleted":
            return null;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () => {
      onStoryChanged({
        kind: "storyDeleted",
      });
    },
  });

  const onDeleteStory = async () => {
    const result = await feedback.dialog.yesNo(
      "action.delete-story.confirm.prompt",
    );

    if (result.isConfirmed) {
      deleteTheStory.mutate(story.id);
    }
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

      <div className={styles.actionBar}>
        <a href="/author/story/">{t("action.back-to-my-stories.label")}</a>
        <div className={styles.toolbar}>
          <button
            type="button"
            onClick={onPublishStory}
            disabled={publishTheStory.isPending}
          >
            <img
              src="/images/publish-24.png"
              alt={t("action.publish-story.label")}
              title={t("action.publish-story.label")}
            />
          </button>
          <button
            type="button"
            onClick={onUnpublishStory}
            disabled={story.publishedOn === null || unpublishTheStory.isPending}
          >
            <img
              src="/images/unpublish-24.png"
              alt={t("action.unpublish-story.label")}
              title={t("action.unpublish-story.label")}
            />
          </button>
          <button
            type="button"
            onClick={onDeleteStory}
            disabled={deleteTheStory.isPending}
          >
            <img
              src="/images/message-square-x-solid-24.png"
              alt={t("action.delete-story.label")}
              title={t("action.delete-story.label")}
            />
          </button>
          <button
            type="button"
            onClick={onCreateScene}
            disabled={createTheScene.isPending}
          >
            <img
              src="/images/message-square-add-solid-24.png"
              alt={t("action.create-scene.label")}
              title={t("action.create-scene.label")}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryHeader;
