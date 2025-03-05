import i18n from "i18next";
import pg from "pg";
import { pino } from "pino";

import createKysely from "../database/createKysely.js";
import type { Database } from "../database/schema.js";
import withTransaction from "../database/transaction/withTransaction.js";
import deleteAudioFromCloudinary from "../domain/audio/cloudinary/deleteAudioFromCloudinary.js";
import uploadAudioToCloudinary from "../domain/audio/cloudinary/uploadAudioToCloudinary.js";
import createAudioInDatabase from "../domain/audio/createAudioInDatabase.js";
import getAudioByIdInDatabase from "../domain/audio/getAudioByIdInDatabase.js";
import saveSceneAudio from "../domain/audio/saveSceneAudio.js";
import createAuthorInDatabase from "../domain/author/createAuthorInDatabase.js";
import getAuthorByEmailInDatabase from "../domain/author/getAuthorByEmailInDatabase.js";
import saveAuthorNameInDatabase from "../domain/author/saveAuthorNameInDatabase.js";
import deleteImageFromCloudinary from "../domain/image/cloudinary/deleteImageFromCloudinary.js";
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
import createStory from "../domain/story/createStory.js";
import deletePublishedStoryInDatabase from "../domain/story/deletePublishedStoryInDatabase.js";
import deleteScene from "../domain/story/deleteScene.js";
import deleteSceneAudio from "../domain/story/deleteSceneAudio.js";
import deleteSceneAudioInDatabase from "../domain/story/deleteSceneAudioInDatabase.js";
import deleteSceneImage from "../domain/story/deleteSceneImage.js";
import deleteSceneImageInDatabase from "../domain/story/deleteSceneImageInDatabase.js";
import deleteSceneInDatabase from "../domain/story/deleteSceneInDatabase.js";
import deleteStory from "../domain/story/deleteStory.js";
import deleteStoryInDatabase from "../domain/story/deleteStoryInDatabase.js";
import getPublishedStoryInDatabase from "../domain/story/getPublishedStoryInDatabase.js";
import getPublishedStorySummariesInDatabase from "../domain/story/getPublishedStorySummariesInDatabase.js";
import getSceneForStoryInDatabase from "../domain/story/getSceneForStoryInDatabase.js";
import getScenesForStoryInDatabase from "../domain/story/getScenesForStoryInDatabase.js";
import getStoryInDatabase from "../domain/story/getStoryInDatabase.js";
import getStorySummariesByAuthorInDatabase from "../domain/story/getStorySummariesByAuthorInDatabase.js";
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

  const db = createKysely<Database>(logDb, config.database.log, connectionPool);

  const [tx, getDB] = withTransaction(logDb, db);

  const repositoryImage: RepositoryImage = {
    getImageById: tx(getImageByIdInDatabase(logDb, getDB)),
    deleteImage: deleteImageFromCloudinary(log),
  };

  const repositoryAudio: RepositoryAudio = {
    getAudioById: tx(getAudioByIdInDatabase(logDb, getDB)),
    deleteAudio: deleteAudioFromCloudinary(log),
  };

  const getScenesForStory = tx(getScenesForStoryInDatabase(logDb, getDB));

  const deleteTheSceneAudio = tx(
    deleteSceneAudio(
      log,
      deleteSceneAudioInDatabase(logDb, getDB),
      deleteAudioFromCloudinary(log),
    ),
  );

  const deleteTheSceneImage = tx(
    deleteSceneImage(
      log,
      deleteSceneImageInDatabase(logDb, getDB),
      deleteImageFromCloudinary(log),
    ),
  );

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
    deleteSceneImage: deleteTheSceneImage,
    saveSceneAudio: tx(
      saveSceneAudio(
        log,
        getDB,
        uploadAudioToCloudinary(log),
        createAudioInDatabase(logDb, getDB),
      ),
    ),
    deleteSceneAudio: deleteTheSceneAudio,
    saveSceneContent: tx(saveSceneContentInDatabase(logDb, getDB)),
    deleteScene: tx(
      deleteScene(
        log,
        deleteSceneInDatabase(logDb, getDB),
        deleteTheSceneImage,
        deleteTheSceneAudio,
      ),
    ),
    saveSceneTitle: tx(saveSceneTitleInDatabase(log, getDB, getScene)),
  };

  const getStory = tx(
    getStoryInDatabase(logDb, getDB, repositoryScene.getScenesForStory),
  );

  const saveStory = tx(saveStoryInDatabase(logDb, getDB));

  const repositoryStory: RepositoryStory = {
    createStory: tx(createStory(log, saveStory)),
    saveStory,
    deleteStory: tx(
      deleteStory(
        log,
        getScenesForStory,
        deleteStoryInDatabase(logDb, getDB),
        repositoryScene.deleteScene,
        deletePublishedStoryInDatabase(log, getDB),
      ),
    ),
    getStorySummariesByAuthor: tx(
      getStorySummariesByAuthorInDatabase(logDb, getDB),
    ),
    getStory,
    publishStory: tx(
      publishStory(log, getStory, publishStoryInDatabase(logDb, getDB)),
    ),
    unpublishStory: tx(unpublishStoryInDatabase(logDb, getDB, getStory)),
    getPublishedStory: tx(getPublishedStoryInDatabase(log, getDB)),
    getPublishedStorySummaries: tx(
      getPublishedStorySummariesInDatabase(log, getDB),
    ),
    saveStoryTitle: tx(saveStoryTitleInDatabase(logDb, getDB, getStory)),
  };

  const repositoryAuthor: RepositoryAuthor = {
    getAuthorByEmail: tx(getAuthorByEmailInDatabase(logDb, getDB)),
    createAuthor: tx(createAuthorInDatabase(logDb, getDB)),
    saveAuthorName: tx(saveAuthorNameInDatabase(logDb, getDB)),
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
