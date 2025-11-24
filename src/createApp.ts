import { Magic } from "@magic-sdk/admin";
import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";

import authenticationRequired from "./authentication/authenticationRequired.js";
import passportWithMagicLogin from "./authentication/passport/passportWithMagicLogin.js";
import routeAuthenticate from "./authentication/routeAuthenticate.js";
import routeLogout from "./authentication/routeLogout.js";
import routeCreateScene from "./domain/story/route/routeCreateScene.js";
import routeCreateStory from "./domain/story/route/routeCreateStory.js";
import routeDeleteScene from "./domain/story/route/routeDeleteScene.js";
import routeDeleteSceneAudio from "./domain/story/route/routeDeleteSceneAudio.js";
import routeDeleteSceneImage from "./domain/story/route/routeDeleteSceneImage.js";
import routeDeleteStory from "./domain/story/route/routeDeleteStory.js";
import routeGetPublishedStories from "./domain/story/route/routeGetPublishedStories.js";
import routeGetScene from "./domain/story/route/routeGetScene.js";
import routeGetStory from "./domain/story/route/routeGetStory.js";
import routePublishStory from "./domain/story/route/routePublishStory.js";
import routeSaveAuthorName from "./domain/story/route/routeSaveAuthorName.js";
import routeSaveSceneContent from "./domain/story/route/routeSaveSceneContent.js";
import routeSaveSceneTitle from "./domain/story/route/routeSaveSceneTitle.js";
import routeSaveStoryTitle from "./domain/story/route/routeSaveStoryTitle.js";
import routeUnpublishStory from "./domain/story/route/routeUnpublishStory.js";
import routeUploadSceneAudio from "./domain/story/route/routeUploadSceneAudio.js";
import routeUploadSceneImage from "./domain/story/route/routeUploadSceneImage.js";
import assertIsAuthorHandler from "./domain/story/support/assertIsAuthorHandler.js";
import assertIsAuthorOfTheStoryHandler from "./domain/story/support/assertIsAuthorOfTheStoryHandler.js";
import isAuthorOfTheStory from "./domain/story/support/isAuthorOfTheStory.js";
import loadConfig from "./environment/config.js";
import getEnvironment from "./environment/getEnvironment.js";
import createServer, { type StartServer } from "./server/createServer.js";
import httpSession from "./server/httpSessionMiddleware.js";
import routeHealthcheck from "./server/routeHealthcheck.js";

export default async function createApp(): Promise<[StartServer, Logger]> {
  const config = loadConfig();

  const {
    log,
    repositoryAuthor,
    repositoryStory,
    repositoryScene,
    database: { connectionPool, db },
  } = getEnvironment<
    App.WithLog &
      App.WithDatabase &
      App.WithAuthorRepository &
      App.WithStoryRepository &
      App.WithSceneRepository
  >();

  const passport = passportWithMagicLogin(
    log,
    await Magic.init(config.authentication.magic.secretKey),
    repositoryAuthor.getAuthorByEmail,
    repositoryAuthor.createAuthor,
  );

  const middlewares: RequestHandler[] = [
    httpSession(config.server.session, connectionPool),
    passport.session(),
    authenticationRequired(
      log,
      config.authentication.pathsRequiringAuthentication,
    ),
  ];

  const assertIsAuthor = assertIsAuthorHandler(log);

  const assertIsAuthorOfTheStory = assertIsAuthorOfTheStoryHandler(
    log,
    isAuthorOfTheStory(db),
  );

  const apiRoutes = [
    routeCreateStory(log, repositoryStory.createStory),
    routeCreateScene(
      log,
      repositoryScene.createScene,
      assertIsAuthorOfTheStory,
    ),
    routeGetStory(repositoryStory.getStory, assertIsAuthorOfTheStory),
    routeGetScene(repositoryScene.getScene, assertIsAuthorOfTheStory),
    routeUploadSceneImage(
      log,
      repositoryScene.saveSceneImage,
      config.uploads.image,
      assertIsAuthorOfTheStory,
    ),
    routeDeleteSceneImage(
      log,
      repositoryScene.deleteSceneImage,
      assertIsAuthorOfTheStory,
    ),
    routeUploadSceneAudio(
      log,
      repositoryScene.saveSceneAudio,
      config.uploads.audio,
      assertIsAuthorOfTheStory,
    ),
    routeDeleteSceneAudio(
      repositoryScene.deleteSceneAudio,
      assertIsAuthorOfTheStory,
    ),
    routeSaveAuthorName(log, repositoryAuthor.saveAuthorName, assertIsAuthor),
    routeSaveSceneContent(
      log,
      repositoryScene.saveSceneContent,
      assertIsAuthorOfTheStory,
    ),
    routeSaveStoryTitle(
      log,
      repositoryStory.saveStoryTitle,
      assertIsAuthorOfTheStory,
    ),
    routeSaveSceneTitle(
      log,
      repositoryScene.saveSceneTitle,
      assertIsAuthorOfTheStory,
    ),
    routeDeleteScene(repositoryScene.deleteScene, assertIsAuthorOfTheStory),
    routeDeleteStory(
      log,
      repositoryStory.deleteStory,
      assertIsAuthorOfTheStory,
    ),
    routePublishStory(
      log,
      repositoryStory.publishStory,
      assertIsAuthorOfTheStory,
    ),
    routeUnpublishStory(
      log,
      repositoryStory.unpublishStory,
      assertIsAuthorOfTheStory,
    ),
    routeGetPublishedStories(log, repositoryStory.getPublishedStorySummaries),
  ].reduce((router, route) => {
    router.use("/api", route);
    return router;
  }, Router());

  const routes = [
    routeHealthcheck(log),
    routeAuthenticate(log, passport.authenticate("magic")),
    routeLogout(log),
    apiRoutes,
  ];

  const startServer = createServer(config.server, routes, middlewares);

  return [startServer, log];
}
