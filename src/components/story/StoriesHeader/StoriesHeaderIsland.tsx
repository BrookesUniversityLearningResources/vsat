import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC } from "react";
import { I18nextProvider } from "react-i18next";

import type { PersistentStory } from "@domain/index.js";
import useI18N from "@i18n/client/useI18N.js";

import StoriesHeader from "./StoriesHeader.js";
import {
  ClientContext,
  createClientEnvironment,
} from "../edit/context/ClientContext.js";

type StoriesHeaderIslandProps = {
  translations: Record<string, ResourceKey>;
  author: PersistentStory["author"];
  showCreateStory?: boolean;
};

const queryClient = new QueryClient();

const StoriesHeaderIsland: FC<StoriesHeaderIslandProps> = ({
  translations,
  author,
  showCreateStory = false,
}) => {
  const i18n = useI18N(translations, navigator.language);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ClientContext.Provider value={createClientEnvironment(i18n)}>
          <StoriesHeader author={author} showCreateStory={showCreateStory} />
        </ClientContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default StoriesHeaderIsland;
