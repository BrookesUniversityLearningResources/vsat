import { useMutation } from "@tanstack/react-query";
import type { FC, PropsWithChildren } from "react";
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
import { isNonEmptyArray } from "../../../../util/nonEmptyArray.js";
import {
  type WithCreateScene,
  type WithDeleteStory,
  type WithFeedback,
  type WithPreviewStory,
  type WithPublishStory,
  type WithUnpublishStory,
  useEnvironment,
} from "../context/ClientContext.js";
import type { OnSceneChanged } from "../scene/types.js";
import type { OnStoryChanged } from "../types.js";

export type StoryHeaderProps = PropsWithChildren<{
  story: PersistentStory;
  onSceneChanged: OnSceneChanged;
  onStoryChanged: OnStoryChanged;
}>;

const StoryHeader: FC<StoryHeaderProps> = ({
  story,
  onSceneChanged,
  onStoryChanged,
  children,
}) => {
  const { t } = useTranslation();

  const {
    createScene,
    publishStory,
    unpublishStory,
    deleteStory,
    previewStory,
    feedback,
  } = useEnvironment<
    WithCreateScene &
      WithPublishStory &
      WithUnpublishStory &
      WithDeleteStory &
      WithPreviewStory &
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

  const onPreviewStory = () => {
    previewStory(story.id);
  };

  const publishStoryDisabled =
    !isNonEmptyArray(story.scenes) || publishTheStory.isPending;

  const unpublishStoryDisabled =
    story.publishedOn === null || unpublishTheStory.isPending;

  const previewStoryDisabled = !isNonEmptyArray(story.scenes);

  return (
    <div className={styles.header}>
      <div className={styles.contentMain}>
        <div>
          <InlineTextInput
            onChanged={onSceneTitleChanged}
            initialValue={story.title}
            i18n={{
              editing: {
                labelName: t("title.field.label"),
                labelSave: t("title.action.save-title"),
                labelClose: t("common.close"),
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
          <a href="/logout">{t("common.logout.label")}</a>
        </div>

        <div className={styles.actionBar}>
          <a href="/author/story/">{t("action.back-to-my-stories.label")}</a>
          <div className={styles.toolbar}>
            <button
              type="button"
              onClick={onPublishStory}
              disabled={publishStoryDisabled}
            >
              <img
                src="/images/publish.svg"
                alt={t("action.publish-story.label")}
                title={t("action.publish-story.label")}
              />
            </button>
            <button
              type="button"
              onClick={onUnpublishStory}
              disabled={unpublishStoryDisabled}
            >
              <img
                src="/images/unpublish.svg"
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
                src="/images/delete.svg"
                alt={t("action.delete-story.label")}
                title={t("action.delete-story.label")}
              />
            </button>
            <button
              type="button"
              onClick={onPreviewStory}
              disabled={previewStoryDisabled}
            >
              <img
                src="/images/preview-24.svg"
                alt={t("action.preview-story.label")}
                title={t("action.preview-story.label")}
              />
            </button>
            <button
              type="button"
              onClick={onCreateScene}
              disabled={createTheScene.isPending}
            >
              <img
                src="/images/add.svg"
                alt={t("action.create-scene.label")}
                title={t("action.create-scene.label")}
              />
            </button>
          </div>
        </div>
      </div>

      {children}
    </div>
  );
};

export default StoryHeader;
