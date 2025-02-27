import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ResourceKey } from "i18next";
import type { FC } from "react";
import { I18nextProvider } from "react-i18next";

import useI18N from "../../../i18n/client/useI18N.js";
import {
  ClientContext,
  createClientEnvironment,
} from "../edit/context/ClientContext.js";
import CreateStory from "./CreateStory.js";

type CreateStoryIslandProps = {
  translations: Record<string, ResourceKey>;
};

const CreateStoryIsland: FC<CreateStoryIslandProps> = ({ translations }) => {
  const i18n = useI18N(translations, navigator.language);

  const queryClient = new QueryClient();

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ClientContext.Provider value={createClientEnvironment(i18n)}>
          <CreateStory />
        </ClientContext.Provider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default CreateStoryIsland;
