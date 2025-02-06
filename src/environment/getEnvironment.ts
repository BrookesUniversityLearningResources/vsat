import i18n from "i18next";
import { CamelCasePlugin, Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import { pino } from "pino";

import logUsingPino from "../database/logUsingPino.js";
import type { Database } from "../database/schema.js";
import withTransaction from "../database/transaction/withTransaction.js";
import uploadAudioToCloudinary from "../domain/audio/cloudinary/uploadAudioToCloudinary.js";
import createAudioInDatabase from "../domain/audio/createAudioInDatabase.js";
import getAudioByIdInDatabase from "../domain/audio/getAudioByIdInDatabase.js";
import saveSceneAudio from "../domain/audio/saveSceneAudio.js";
import createAuthorInDatabase from "../domain/author/createAuthorInDatabase.js";
import getAuthorByEmailInDatabase from "../domain/author/getAuthorByEmailInDatabase.js";
import uploadImageToCloudinary from "../domain/image/cloudinary/uploadImageToCloudinary.js";
import createImageInDatabase from "../domain/image/createImageInDatabase.js";
import getImageByIdInDatabase from "../domain/image/getImageByIdInDatabase.js";
import saveSceneImage from "../domain/image/saveSceneImage.js";
import type {
  RepositoryAudio,
  RepositoryAuthor,
  RepositoryImage,
  RepositoryScene,
  RepositoryStory,
} from "../domain/index.js";
import createScene from "../domain/story/createScene.js";
import createSceneInDatabase from "../domain/story/createSceneInDatabase.js";
import deleteScene from "../domain/story/deleteScene.js";
import deleteSceneAudioInDatabase from "../domain/story/deleteSceneAudioInDatabase.js";
import deleteSceneImageInDatabase from "../domain/story/deleteSceneImageInDatabase.js";
import deleteSceneInDatabase from "../domain/story/deleteSceneInDatabase.js";
import deleteStory from "../domain/story/deleteStory.js";
import deleteStoryInDatabase from "../domain/story/deleteStoryInDatabase.js";
import getPublishedStories from "../domain/story/getPublishedStories.js";
import getPublishedStory from "../domain/story/getPublishedStory.js";
import getSceneForStoryInDatabase from "../domain/story/getSceneForStoryInDatabase.js";
import getScenesForStoryInDatabase from "../domain/story/getScenesForStoryInDatabase.js";
import getStoriesInDatabase from "../domain/story/getStoriesInDatabase.js";
import getStoryInDatabase from "../domain/story/getStoryInDatabase.js";
import getStoryTitlesByAuthorInDatabase from "../domain/story/getStoryTitlesByAuthorInDatabase.js";
import publishStory from "../domain/story/publish/publishStory.js";
import publishStoryInDatabase from "../domain/story/publish/publishStoryInDatabase.js";
import unpublishStoryInDatabase from "../domain/story/publish/unpublishStoryInDatabase.js";
import saveSceneContentInDatabase from "../domain/story/saveSceneContentInDatabase.js";
import saveSceneTitleInDatabase from "../domain/story/saveSceneTitleInDatabase.js";
import saveStoryInDatabase from "../domain/story/saveStoryInDatabase.js";
import saveStoryTitleInDatabase from "../domain/story/saveStoryTitleInDatabase.js";
import createI18NContext from "../i18n/createI18NContext.js";
import loadConfig from "./config.js";

/**
 * Get the environment that this app runs within.
 *
 * @see The [Composition Root](https://blog.ploeh.dk/2011/07/28/CompositionRoot/)
 */
//@ts-expect-error
const getEnvironment: App.GetEnvironment = (() => {
  const config = loadConfig();

  const log = pino({
    base: null,
    name: config.app.name,
    ...config.log,
    serializers: pino.stdSerializers,
  });

  const logDb = log.child({ component: "db" });

  const connectionPool = new pg.Pool({
    connectionString: config.database.connectionString,
  });

  const db = new Kysely<Database>({
    log: logUsingPino(logDb, config.database.log),
    dialect: new PostgresDialect({
      pool: connectionPool,
    }),
    plugins: [new CamelCasePlugin()],
  });

  const [tx, getDB] = withTransaction(logDb, db);

  const getScenesForStory = tx(getScenesForStoryInDatabase(logDb, getDB));

  const deleteSceneAudio = tx(deleteSceneAudioInDatabase(logDb, getDB));

  const deleteSceneImage = tx(deleteSceneImageInDatabase(logDb, getDB));

  const getScene = tx(getSceneForStoryInDatabase(logDb, getDB));

  const repositoryScene: RepositoryScene = {
    getScene,
    getScenesForStory,
    createScene: tx(createScene(log, createSceneInDatabase(logDb, getDB))),
    saveSceneImage: tx(
      saveSceneImage(
        log,
        getDB,
        uploadImageToCloudinary(log),
        createImageInDatabase(logDb, getDB),
      ),
    ),
    deleteSceneImage,
    saveSceneAudio: tx(
      saveSceneAudio(
        log,
        getDB,
        uploadAudioToCloudinary(log),
        createAudioInDatabase(logDb, getDB),
      ),
    ),
    deleteSceneAudio,
    saveSceneContent: tx(saveSceneContentInDatabase(logDb, getDB)),
    deleteScene: tx(
      deleteScene(
        log,
        deleteSceneInDatabase(logDb, getDB),
        deleteSceneImage,
        deleteSceneAudio,
      ),
    ),
    saveSceneTitle: tx(saveSceneTitleInDatabase(log, getDB, getScene)),
  };

  const getStory = tx(
    getStoryInDatabase(logDb, getDB, repositoryScene.getScenesForStory),
  );

  const repositoryStory: RepositoryStory = {
    saveStory: tx(saveStoryInDatabase(logDb, getDB)),
    deleteStory: tx(
      deleteStory(
        log,
        getScenesForStory,
        deleteStoryInDatabase(logDb, getDB),
        repositoryScene.deleteScene,
      ),
    ),
    getStoryTitlesByAuthor: tx(getStoryTitlesByAuthorInDatabase(logDb, getDB)),
    getStory,
    publishStory: tx(
      publishStory(getStory, publishStoryInDatabase(logDb, getDB)),
    ),
    unpublishStory: tx(unpublishStoryInDatabase(logDb, getDB)),
    getPublishedStory: tx(getPublishedStory(log, getStory)),
    getPublishedStories: tx(
      getPublishedStories(log, getStoriesInDatabase(logDb, getDB)),
    ),
    saveStoryTitle: tx(saveStoryTitleInDatabase(logDb, getDB, getStory)),
  };

  const repositoryImage: RepositoryImage = {
    getImageById: tx(getImageByIdInDatabase(logDb, getDB)),
  };

  const repositoryAudio: RepositoryAudio = {
    getAudioById: tx(getAudioByIdInDatabase(logDb, getDB)),
  };

  const repositoryAuthor: RepositoryAuthor = {
    getAuthorByEmail: tx(getAuthorByEmailInDatabase(logDb, getDB)),
    createAuthor: tx(createAuthorInDatabase(logDb, getDB)),
  };

  const environment: App.Environment = Object.freeze({
    log,
    i18n: createI18NContext(i18n),
    database: {
      db,
      connectionPool,
    },
    magic: {
      publicKey: config.authentication.magic.publicKey,
    },
    repositoryAuthor,
    repositoryAudio,
    repositoryImage,
    repositoryScene,
    repositoryStory,
  });

  return () => environment;
})();

export default getEnvironment;
