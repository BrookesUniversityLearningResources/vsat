import { Magic } from "@magic-sdk/admin";
import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";

import authenticationRequired from "./authentication/authenticationRequired.js";
import passportWithMagicLogin from "./authentication/passport/passportWithMagicLogin.js";
import routeAuthenticate from "./authentication/routeAuthenticate.js";
import routeCreateScene from "./domain/story/route/routeCreateScene.js";
import routeCreateStory from "./domain/story/route/routeCreateStory.js";
import routeDeleteScene from "./domain/story/route/routeDeleteScene.js";
import routeDeleteSceneAudio from "./domain/story/route/routeDeleteSceneAudio.js";
import routeDeleteSceneImage from "./domain/story/route/routeDeleteSceneImage.js";
import routeDeleteStory from "./domain/story/route/routeDeleteStory.js";
import routeGetScene from "./domain/story/route/routeGetScene.js";
import routeGetStory from "./domain/story/route/routeGetStory.js";
import routePublishStory from "./domain/story/route/routePublishStory.js";
import routeSaveSceneContent from "./domain/story/route/routeSaveSceneContent.js";
import routeSaveSceneTitle from "./domain/story/route/routeSaveSceneTitle.js";
import routeSaveStoryTitle from "./domain/story/route/routeSaveStoryTitle.js";
import routeUnpublishStory from "./domain/story/route/routeUnpublishStory.js";
import routeUploadSceneAudio from "./domain/story/route/routeUploadSceneAudio.js";
import routeUploadSceneImage from "./domain/story/route/routeUploadSceneImage.js";
import assertAuthorHandler from "./domain/story/support/assertAuthorHandler.js";
import isAuthorOfTheStory from "./domain/story/support/isAuthorOfTheStory.js";
import loadConfig from "./environment/config.js";
import getEnvironment from "./environment/getEnvironment.js";
import createServer, { type StartServer } from "./server/createServer.js";
import httpSession from "./server/httpSessionMiddleware.js";
import routeHealthcheck from "./server/routeHealthcheck.js";

async function createApp(): Promise<[StartServer, Logger]> {
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

  const assertAuthor = assertAuthorHandler(log, isAuthorOfTheStory(db));

  const apiRoutes = [
    routeCreateStory(log, repositoryStory.createStory),
    routeCreateScene(repositoryScene.createScene),
    routeGetStory(repositoryStory.getStory, assertAuthor),
    routeGetStory(repositoryStory.getStory, assertAuthor),
    routeGetScene(repositoryScene.getScene, assertAuthor),
    routeUploadSceneImage(log, repositoryScene.saveSceneImage, assertAuthor),
    routeDeleteSceneImage(log, repositoryScene.deleteSceneImage, assertAuthor),
    routeUploadSceneAudio(log, repositoryScene.saveSceneAudio, assertAuthor),
    routeDeleteSceneAudio(repositoryScene.deleteSceneAudio, assertAuthor),
    routeSaveSceneContent(log, repositoryScene.saveSceneContent, assertAuthor),
    routeSaveStoryTitle(log, repositoryStory.saveStoryTitle, assertAuthor),
    routeSaveSceneTitle(log, repositoryScene.saveSceneTitle, assertAuthor),
    routeDeleteScene(repositoryScene.deleteScene, assertAuthor),
    routeDeleteStory(log, repositoryStory.deleteStory, assertAuthor),
    routePublishStory(log, repositoryStory.publishStory, assertAuthor),
    routeUnpublishStory(log, repositoryStory.unpublishStory, assertAuthor),
  ].reduce((router, route) => {
    router.use("/api", route);
    return router;
  }, Router());

  const routes = [
    routeHealthcheck(log),
    routeAuthenticate(log, passport.authenticate("magic")),
    apiRoutes,
  ];

  const startServer = createServer(config.server, routes, middlewares);

  return [startServer, log];
}

export default createApp;
