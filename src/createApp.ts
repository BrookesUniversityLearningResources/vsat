import { Magic } from "@magic-sdk/admin";
import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";

import authenticationRequired from "./authentication/authenticationRequired.js";
import devAuthBypass from "./authentication/devAuthBypass.js";
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
import assertIsAuthorOfTheStoryHandler from "./domain/story/support/assertIsAuthorOfTheStoryHandler.js";
import isAuthorOfTheStory from "./domain/story/support/isAuthorOfTheStory.js";
import loadConfig from "./environment/config.js";
import getEnvironment from "./environment/getEnvironment.js";
import enableSharedArrayBufferMiddleware from "./server/enableSharedArrayBufferMiddleware.js";
import type { StartServer } from "./server/createServer.js";
import httpSession from "./server/httpSessionMiddleware.js";
import routeHealthcheck from "./server/routeHealthcheck.js";

export async function createAppParts(): Promise<{
  log: Logger;
  config: ReturnType<typeof loadConfig>;
  middlewares: RequestHandler[];
  routes: RequestHandler[];
}> {
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

  const devAuthBypassEnabled =
    process.env.NODE_ENV === "development" &&
    (process.env.DEV_AUTH_BYPASS === "1" ||
      process.env.DEV_AUTH_BYPASS === "true");
  const devAuthBypassEmail =
    process.env.DEV_AUTH_BYPASS_EMAIL ?? "dev@localhost";
  const devAuthBypassName = process.env.DEV_AUTH_BYPASS_NAME ?? "Dev User";

  let passportSessionMiddleware: RequestHandler = (_req, _res, next) => next();
  let authenticateHandler: RequestHandler = (_req, res) => {
    res.status(503).json({ error: "Magic authentication is unavailable" });
  };

  try {
    const passport = passportWithMagicLogin(
      log,
      await Magic.init(config.authentication.magic.secretKey),
      repositoryAuthor.getAuthorByEmail,
      repositoryAuthor.createAuthor,
    );

    passportSessionMiddleware = passport.session();
    authenticateHandler = passport.authenticate("magic");
  } catch (err) {
    if (!devAuthBypassEnabled) {
      throw err;
    }

    log.warn(
      { err },
      "Magic initialization failed; continuing with dev auth bypass only",
    );
  }

  const sharedArrayBufferHeadersEnabled =
    process.env.DEV_DISABLE_COEP !== "1" &&
    process.env.DEV_DISABLE_COEP !== "true";

  const middlewares: RequestHandler[] = [
    httpSession(config.server.session, connectionPool),
    passportSessionMiddleware,
    devAuthBypass(log, repositoryAuthor, {
      enabled: devAuthBypassEnabled,
      email: devAuthBypassEmail,
      name: devAuthBypassName,
    }),
    authenticationRequired(
      log,
      config.authentication.pathsRequiringAuthentication,
    ),
    ...(sharedArrayBufferHeadersEnabled
      ? [enableSharedArrayBufferMiddleware()]
      : []),
  ];

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
    routeSaveAuthorName(
      log,
      repositoryAuthor.saveAuthorName,
      assertIsAuthorOfTheStory,
    ),
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
    routeAuthenticate(log, authenticateHandler),
    routeLogout(log),
    apiRoutes,
  ];

  return { log, config, middlewares, routes };
}

export default async function createApp(): Promise<[StartServer, Logger]> {
  const { log, config, middlewares, routes } = await createAppParts();
  const { default: createServer } = await import("./server/createServer.js");
  const startServer = createServer(config.server, routes, middlewares);
  return [startServer, log];
}
