import type { PersistentStory } from "@domain/index.js";
import type { StoryMode } from "@domain/story/publish/types.js";
import useI18N from "@i18n/client/useI18N.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC } from "react";
import { I18nextProvider } from "react-i18next";
import {
  ClientContext,
  createClientEnvironment,
} from "../edit/context/ClientContext.js";
import StoriesHeader from "./StoriesHeader.js";

type StoriesHeaderIslandProps = {
  translations: Record<string, ResourceKey>;
  author: PersistentStory["author"];
  defaultStoryMode: StoryMode;
  showCreateStory?: boolean;
};

const queryClient = new QueryClient();

const StoriesHeaderIsland: FC<StoriesHeaderIslandProps> = ({
  translations,
  author,
  defaultStoryMode,
  showCreateStory = false,
}) => {
  const i18n = useI18N(translations, navigator.language);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ClientContext.Provider value={createClientEnvironment(i18n)}>
          <StoriesHeader
            author={author}
            defaultStoryMode={defaultStoryMode}
            showCreateStory={showCreateStory}
          />
        </ClientContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default StoriesHeaderIsland;
