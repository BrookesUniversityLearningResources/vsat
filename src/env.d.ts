declare namespace Express {
  interface User {
    id: number;
    name: string;
    email: string;
  }
}

declare namespace App {
  type WithLog = Readonly<{
    log: import("pino").Logger;
  }>;

  type WithDatabase = Readonly<{
    database: {
      db: import("kysely").Kysely<import("./database/schema.js").Database>;
      connectionPool: import("pg").Pool;
    };
  }>;

  type WithAuthorRepository = {
    repositoryAuthor: import("./domain/index.js").RepositoryAuthor;
  };

  type WithAudioRepository = {
    repositoryAudio: import("./domain/index.js").RepositoryAudio;
  };

  type WithImageRepository = {
    repositoryImage: import("./domain/index.js").RepositoryImage;
  };

  type WithStoryRepository = {
    repositoryStory: import("./domain/index.js").RepositoryStory;
  };

  type WithSceneRepository = {
    repositoryScene: import("./domain/index.js").RepositoryScene;
  };

  type WithMagicAuthenticationConfig = Readonly<{
    magic: {
      publicKey: string;
    };
  }>;

  type WithI18N = {
    i18n: import("./i18n/createI18NContext.js").I18NContext;
  };

  type Environment = Readonly<
    WithLog &
      WithI18N &
      WithDatabase &
      WithAuthorRepository &
      WithStoryRepository &
      WithSceneRepository &
      WithImageRepository &
      WithAudioRepository &
      WithMagicAuthenticationConfig
  >;

  type GetEnvironment = <E extends Partial<Environment>>() => E;

  interface Locals {
    environment: GetEnvironment;
    user?: import("./authentication/types.js").User;
  }
}
