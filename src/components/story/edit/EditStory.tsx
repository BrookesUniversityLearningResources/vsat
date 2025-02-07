import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC, PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { I18nextProvider } from "react-i18next";

import styles from "./EditStory.module.css";

import unsupported from "@domain/story/client/unsupportedResult.js";
import useScrollIntoView from "src/hooks/useScrollIntoView.js";
import type { PersistentStory } from "../../../domain/index.js";
import useI18N from "../../../i18n/client/useI18N.js";
import htmlIdForStory from "../htmlIdForStory.js";
import {
  ClientContext,
  type WithFeedback,
  type WithGetStory,
  type WithSaveStoryTitle,
  createClientEnvironment,
  useEnvironment,
} from "./context/ClientContext.js";
import StoryHeader, { type StoryHeaderProps } from "./header/StoryHeader.js";
import Scene from "./scene/Scene.js";
import htmlIdForScene from "./scene/htmlIdForScene.js";
import type { OnSceneChanged } from "./scene/types.js";

type StoryEditorProps = {
  story: PersistentStory;
};

const StoryEditor: FC<StoryEditorProps> = ({ story: initialStory }) => {
  const scrollTo = useScrollIntoView();

  const { saveStoryTitle, getStory, feedback } = useEnvironment<
    WithSaveStoryTitle & WithGetStory & WithFeedback
  >();

  const { data: story, refetch: refetchStory } = useQuery<
    PersistentStory,
    Error
  >({
    enabled: false,
    queryKey: [`story-${initialStory.id}`],
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
      feedback.notify.info("story.title.saved");

      refetchStory();
    },
  });

  const onStoryTitleChanged: StoryHeaderProps["onStoryTitleChanged"] = (
    title,
  ) => {
    saveTheStoryTitle.mutate(title);
  };

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

      default: {
        // do nothing
      }
    }
  };

  return (
    <main className={styles.story} id={htmlIdForStory(story.id)}>
      <StoryHeader
        story={story}
        onSceneChanged={onSceneChanged}
        onStoryTitleChanged={onStoryTitleChanged}
      />

      <div className={styles.storyEditScenes}>
        {story.scenes.map((scene) => (
          <Scene
            key={scene.id}
            scene={scene}
            storyId={story.id}
            onSceneChanged={onSceneChanged}
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
