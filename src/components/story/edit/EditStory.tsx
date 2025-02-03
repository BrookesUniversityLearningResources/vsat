import {
  QueryClient,
  QueryClientProvider,
  useMutation,
} from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import { type FC, type PropsWithChildren, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";

import styles from "./EditStory.module.css";

import unsupported from "@domain/story/client/unsupportedResult.js";
import type {
  PersistentScene,
  PersistentStory,
} from "../../../domain/index.js";
import useI18N from "../../../i18n/client/useI18N.js";
import {
  ClientContext,
  type WithFeedback,
  type WithSaveSceneTitle,
  type WithSaveStoryTitle,
  createClientEnvironment,
  useEnvironment,
} from "./context/ClientContext.js";
import StoryHeader, { type StoryHeaderProps } from "./header/StoryHeader.js";
import Scene, {
  type SceneProps,
  type SceneTitleChangeEvent,
} from "./scene/Scene.js";

type StoryEditorProps = {
  story: PersistentStory;
};

const StoryEditor: FC<StoryEditorProps> = ({ story: initialStory }) => {
  const [story, setStory] = useState(initialStory);

  const { saveStoryTitle, saveSceneTitle, feedback } = useEnvironment<
    WithSaveStoryTitle & WithSaveSceneTitle & WithFeedback
  >();

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
    onSuccess: (story) => {
      feedback.notify.info("story.title.saved");

      setStory(story);
    },
  });

  const onStoryTitleChange: StoryHeaderProps["onTitleChange"] = (title) => {
    saveTheStoryTitle.mutate(title);
  };

  const saveTheSceneTitle = useMutation<
    PersistentScene,
    Error,
    SceneTitleChangeEvent
  >({
    mutationFn: ({ sceneId, title }) =>
      saveSceneTitle(story.id, sceneId, title).then((result) => {
        switch (result.kind) {
          case "sceneTitleSaved":
            return result.scene;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: () => {
      feedback.notify.info("scene.title.saved");
    },
  });

  const onSceneTitleChange: SceneProps["onTitleChange"] = (event) => {
    return saveTheSceneTitle.mutateAsync(event);
  };

  return (
    <main className={styles.story}>
      <StoryHeader story={story} onTitleChange={onStoryTitleChange} />
      <div className={styles.storyEditScenes}>
        {story.scenes.map((scene) => (
          <Scene
            key={scene.id}
            scene={scene}
            storyId={story.id}
            onTitleChange={onSceneTitleChange}
          />
        ))}
      </div>
    </main>
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
