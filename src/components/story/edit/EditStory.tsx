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
  StoryLinkSummary,
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
  type WithGetStoryLinks,
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
    WithSaveStoryTitle & WithGetStory & WithGetStoryLinks & WithFeedback
  >();

  const { getStoryLinks } = useEnvironment<WithGetStoryLinks>();

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

  const { data: links = [], refetch: refetchLinks } = useQuery<
    StoryLinkSummary[],
    Error
  >({
    queryKey: [`story-links-${initialStory.id}`],
    initialData: [],
    queryFn: () =>
      getStoryLinks(initialStory.id).then((result) => {
        switch (result.kind) {
          case "gotStoryLinks":
            return result.links;
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

  const outboundLinks = links.filter((link) => link.fromStory.id === story.id);
  const inboundLinks = links.filter((link) => link.toStory.id === story.id);

  const sceneLinkMap = new Map<
    number,
    { count: number; pages: number[] }
  >();

  inboundLinks.forEach((link) => {
    if (!link.toScene?.id) return;
    const existing = sceneLinkMap.get(link.toScene.id) ?? {
      count: 0,
      pages: [],
    };
    existing.count += 1;
    if (
      typeof link.toPageNumber === "number" &&
      !existing.pages.includes(link.toPageNumber)
    ) {
      existing.pages.push(link.toPageNumber);
    }
    sceneLinkMap.set(link.toScene.id, existing);
  });

  return (
    <main className={styles.story} id={htmlIdForStory(story.id)}>
      <div className={styles.editor}>
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
            sceneLinkMap={sceneLinkMap}
          />
        ) : (
          <NoScenes storyId={story.id} onSceneChanged={onSceneChanged} />
        )}
      </div>

      <aside className={styles.linkPanel}>
        <div className={styles.linkPanelHeader}>
          <h2>Interpretive links</h2>
          <button
            type="button"
            className={styles.linkPanelRefresh}
            onClick={() => refetchLinks()}
          >
            Refresh
          </button>
        </div>
        <a className={styles.linkPanelManage} href={`/author/story/${story.id}/links`}>
          Manage links
        </a>
        <div className={styles.linkPanelSection}>
          <h3>Outbound</h3>
          {outboundLinks.length ? (
            <ul>
              {outboundLinks.map((link) => (
                <li key={link.id}>
                  <span className={styles.linkStatus}>{link.status}</span>
                  <div className={styles.linkTitle}>{link.toStory.title}</div>
                  <div className={styles.linkMeta}>
                    {link.linkType}
                    {link.toScene && (
                      <span>
                        · Scene {link.toScene.title ?? `#${link.toScene.id}`}
                      </span>
                    )}
                    {link.toPageNumber && <span>· Page {link.toPageNumber}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No outbound links yet.</p>
          )}
        </div>
        <div className={styles.linkPanelSection}>
          <h3>Inbound</h3>
          {inboundLinks.length ? (
            <ul>
              {inboundLinks.map((link) => (
                <li key={link.id}>
                  <span className={styles.linkStatus}>{link.status}</span>
                  <div className={styles.linkTitle}>{link.fromStory.title}</div>
                  <div className={styles.linkMeta}>
                    {link.linkType}
                    {link.toScene && (
                      <span>
                        · Scene {link.toScene.title ?? `#${link.toScene.id}`}
                      </span>
                    )}
                    {link.toPageNumber && <span>· Page {link.toPageNumber}</span>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No inbound links yet.</p>
          )}
        </div>
      </aside>
    </main>
  );
};

type ScenesProps = {
  storyId: PersistentStory["id"];
  scenes: NonEmptyArray<PersistentScene>;
  onSceneChanged: OnSceneChanged;
  sceneLinkMap: Map<number, { count: number; pages: number[] }>;
};

const Scenes: FC<ScenesProps> = ({
  storyId,
  scenes,
  onSceneChanged,
  sceneLinkMap,
}) => {
  return (
    <div className="scenes">
      {scenes.map((scene) => (
        <Scene
          scene={scene}
          key={scene.id}
          storyId={storyId}
          onSceneChanged={onSceneChanged}
          linkInfo={sceneLinkMap.get(scene.id)}
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
