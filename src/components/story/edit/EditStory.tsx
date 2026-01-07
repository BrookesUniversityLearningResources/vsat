import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC, PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider, useTranslation } from "react-i18next";

import styles from "./EditStory.module.css";

import type {
  PersistentScene,
  PersistentStory,
} from "../../../domain/index.js";
import unsupported from "../../../domain/story/client/unsupportedResult.js";
import useScrollIntoView from "../../../hooks/useScrollIntoView.js";
import useI18N from "../../../i18n/client/useI18N.js";
import {
  type NonEmptyArray,
  isNonEmptyArray,
} from "../../../util/nonEmptyArray.js";
import htmlIdForStory from "../htmlIdForStory.js";
import StoryOverview from "../overview/StoryOverview.js";
import {
  ClientContext,
  type WithCreateScene,
  type WithFeedback,
  type WithGetStory,
  type WithSaveStoryTitle,
  createClientEnvironment,
  useEnvironment,
} from "./context/ClientContext.js";
import StoryHeader from "./header/StoryHeader.js";
import Scene from "./scene/Scene.js";
import htmlIdForScene from "./scene/htmlIdForScene.js";
import type { OnSceneChanged } from "./scene/types.js";
import type { OnStoryChanged } from "./types.js";

type StoryEditorProps = {
  story: PersistentStory;
};

const StoryEditor: FC<StoryEditorProps> = ({ story: initialStory }) => {
  const scrollTo = useScrollIntoView();

  const { saveStoryTitle, getStory, feedback } = useEnvironment<
    WithSaveStoryTitle & WithGetStory & WithFeedback
  >();

  const queryClient = useQueryClient();

  const queryKeyStory = `story-${initialStory.id}`;

  const { data: story, refetch: refetchStory } = useQuery<
    PersistentStory,
    Error
  >({
    enabled: false,
    queryKey: [queryKeyStory],
    initialData: initialStory,
    queryFn: () =>
      getStory(initialStory.id).then((result) => {
        switch (result.kind) {
          case "gotStory":
            return result.story;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
  });

  const saveTheStoryTitle = useMutation<
    PersistentStory,
    Error,
    PersistentStory["title"]
  >({
    mutationFn: (title) =>
      saveStoryTitle(story.id, title).then((result) => {
        switch (result.kind) {
          case "storyTitleSaved":
            return result.story;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () => {
      refetchStory();
    },
  });

  const onSceneChanged: OnSceneChanged = (e) => {
    switch (e.kind) {
      case "sceneCreated": {
        refetchStory().then(() => {
          scrollTo(htmlIdForScene(e.scene.id));
        });
        break;
      }

      case "sceneDeleted": {
        refetchStory().then(() => {
          scrollTo(htmlIdForStory(story.id));
        });
        break;
      }

      case "sceneTitleChanged":
      case "contentChanged":
      case "imageChanged":
      case "audioChanged": {
        refetchStory();
        break;
      }

      default: {
        // do nothing
      }
    }
  };

  const onStoryChanged: OnStoryChanged = (e) => {
    switch (e.kind) {
      case "storyPublished": {
        queryClient.setQueryData([queryKeyStory], e.story);
        feedback.notify.info("story.published");
        break;
      }

      case "storyUnpublished": {
        queryClient.setQueryData([queryKeyStory], e.story);
        feedback.notify.info("story.unpublished");
        break;
      }

      case "storyTitleChanged": {
        saveTheStoryTitle.mutate(e.title);
        break;
      }

      case "storyDeleted": {
        window.location.href = "/author/story";
        break;
      }

      default: {
        ((_: never) => _)(e);
      }
    }
  };

  return (
    <main className={styles.story} id={htmlIdForStory(story.id)}>
      <StoryHeader
        story={story}
        onSceneChanged={onSceneChanged}
        onStoryChanged={onStoryChanged}
      >
        <StoryOverview
          story={story}
          onSceneSelected={(sceneId) => scrollTo(htmlIdForScene(sceneId))}
        />
      </StoryHeader>

      {isNonEmptyArray(story.scenes) ? (
        <Scenes
          storyId={story.id}
          scenes={story.scenes}
          onSceneChanged={onSceneChanged}
        />
      ) : (
        <NoScenes storyId={story.id} onSceneChanged={onSceneChanged} />
      )}
    </main>
  );
};

type ScenesProps = {
  storyId: PersistentStory["id"];
  scenes: NonEmptyArray<PersistentScene>;
  onSceneChanged: OnSceneChanged;
};

const Scenes: FC<ScenesProps> = ({ storyId, scenes, onSceneChanged }) => {
  return (
    <div className="scenes">
      {scenes.map((scene) => (
        <Scene
          scene={scene}
          key={scene.id}
          storyId={storyId}
          onSceneChanged={onSceneChanged}
        />
      ))}
    </div>
  );
};

type NoScenesProps = {
  storyId: PersistentStory["id"];
  onSceneChanged: OnSceneChanged;
};

const NoScenes: FC<NoScenesProps> = ({ storyId, onSceneChanged }) => {
  const { t } = useTranslation();

  const { createScene, feedback } = useEnvironment<
    WithCreateScene & WithFeedback
  >();

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
    createTheScene.mutate(storyId);
  };

  return (
    <div className={styles.noScenes}>
      <div className={styles.heading}>{t("no-scenes.heading")}</div>
      <div className={styles.instruction}>{t("no-scenes.instruction")}</div>
      <button
        type="button"
        onClick={onCreateScene}
        disabled={createTheScene.isPending}
      >
        {t("action.create-scene.label")}
        <img
          src="/images/add-white.svg"
          alt={t("action.create-scene.label")}
          title={t("action.create-scene.label")}
        />
      </button>
    </div>
  );
};

type EditStoryAppProps = PropsWithChildren<{
  translations: Record<string, ResourceKey>;
  story: PersistentStory;
}>;

const queryClient = new QueryClient();

const EditStoryApp: FC<EditStoryAppProps> = ({
  story,
  translations,
  children,
}) => {
  const i18n = useI18N(translations, navigator.language);

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary fallback={children}>
        <QueryClientProvider client={queryClient}>
          <ClientContext.Provider value={createClientEnvironment(i18n)}>
            <StoryEditor story={story} />
          </ClientContext.Provider>
        </QueryClientProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
};

export default EditStoryApp;
