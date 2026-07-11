import { Magic } from "@magic-sdk/admin";
import { type RequestHandler, Router } from "express";
import type { Logger } from "pino";

import assertIsStewardHandler from "./authentication/assertIsStewardHandler.js";
import authenticationRequired from "./authentication/authenticationRequired.js";
import devAuthBypass from "./authentication/devAuthBypass.js";
import passportWithMagicLogin from "./authentication/passport/passportWithMagicLogin.js";
import routeAuthenticate from "./authentication/routeAuthenticate.js";
import routeLogout from "./authentication/routeLogout.js";
import routeAnthology from "./domain/anthology/route/routeAnthology.js";
import auditStoryEdits from "./domain/story/editLog/auditStoryEdits.js";
import canVoteOnStoryLinkInDatabase from "./domain/story/link/canVoteOnStoryLinkInDatabase.js";
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
import routeSaveStoryMode from "./domain/story/route/routeSaveStoryMode.js";
import routeSaveStoryTitle from "./domain/story/route/routeSaveStoryTitle.js";
import routeStoryLinks from "./domain/story/route/routeStoryLinks.js";
import routeUnpublishStory from "./domain/story/route/routeUnpublishStory.js";
import routeUploadSceneAudio from "./domain/story/route/routeUploadSceneAudio.js";
import routeUploadSceneImage from "./domain/story/route/routeUploadSceneImage.js";
import assertIsAuthorHandler from "./domain/story/support/assertIsAuthorHandler.js";
import assertIsAuthorOrStewardOfTheStoryHandler from "./domain/story/support/assertIsAuthorOrStewardOfTheStoryHandler.js";
import isAuthorOfTheStory from "./domain/story/support/isAuthorOfTheStory.js";
import loadConfig from "./environment/config.js";
import getEnvironment from "./environment/getEnvironment.js";
import type { StartServer } from "./server/createServer.js";
import httpSession from "./server/httpSessionMiddleware.js";
import routeSessions from "./server/relay/routeSessions.js";
import routeHealthcheck from "./server/routeHealthcheck.js";
import { withHeadersToEnableSharedArrayBufferUsage } from "./server/staticHeadersMiddleware.js";

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
    repositoryStoryEditLog,
    repositoryStoryLink,
    repositoryAnthology,
    repositoryScene,
    database: { connectionPool, db },
  } = getEnvironment<
    App.WithLog &
      App.WithDatabase &
      App.WithAuthorRepository &
      App.WithStoryRepository &
      App.WithStoryEditLogRepository &
      App.WithStoryLinkRepository &
      App.WithAnthologyRepository &
      App.WithSceneRepository
  >();

  const devAuthBypassRequested =
    process.env.DEV_AUTH_BYPASS === "1" ||
    process.env.DEV_AUTH_BYPASS === "true";
  const devAuthBypassAllowedHosts = (
    process.env.DEV_AUTH_BYPASS_ALLOWED_HOSTS ?? ""
  )
    .split(",")
    .map((host) => host.trim().replace(/:\d+$/, ""))
    .filter(Boolean);
  const devAuthBypassEnabled =
    devAuthBypassRequested &&
    (process.env.NODE_ENV === "development" ||
      devAuthBypassAllowedHosts.length > 0);
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
      allowedHosts: devAuthBypassAllowedHosts,
    }),
    authenticationRequired(
      log,
      config.authentication.pathsRequiringAuthentication,
    ),
    // After auth so req.user is populated: record every successful
    // story-scoped mutation to the edit changelog (the accountability trail
    // for author+steward editing).
    auditStoryEdits(log, repositoryStoryEditLog.recordStoryEdit),
    ...(sharedArrayBufferHeadersEnabled
      ? [withHeadersToEnableSharedArrayBufferUsage()]
      : []),
  ];

  const assertIsAuthor = assertIsAuthorHandler(log);

  const assertIsAuthorOrStewardOfTheStory =
    assertIsAuthorOrStewardOfTheStoryHandler(log, isAuthorOfTheStory(db));

  const assertIsSteward = assertIsStewardHandler(log);

  const apiRoutes = [
    routeCreateStory(log, repositoryStory.createStory),
    routeCreateScene(
      log,
      repositoryScene.createScene,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeGetStory(repositoryStory.getStory, assertIsAuthorOrStewardOfTheStory),
    routeGetScene(repositoryScene.getScene, assertIsAuthorOrStewardOfTheStory),
    routeUploadSceneImage(
      log,
      repositoryScene.saveSceneImage,
      config.uploads.image,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeDeleteSceneImage(
      log,
      repositoryScene.deleteSceneImage,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeUploadSceneAudio(
      log,
      repositoryScene.saveSceneAudio,
      config.uploads.audio,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeDeleteSceneAudio(
      repositoryScene.deleteSceneAudio,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeSaveAuthorName(log, repositoryAuthor.saveAuthorName, assertIsAuthor),
    routeSaveSceneContent(
      log,
      repositoryScene.saveSceneContent,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeSaveStoryTitle(
      log,
      repositoryStory.saveStoryTitle,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeSaveStoryMode(
      log,
      repositoryStory.saveStoryMode,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeSaveSceneTitle(
      log,
      repositoryScene.saveSceneTitle,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeStoryLinks(
      repositoryStoryLink.createStoryLink,
      repositoryStoryLink.getStoryLinksForStory,
      repositoryStoryLink.voteOnStoryLink,
      canVoteOnStoryLinkInDatabase(() => db),
      repositoryStoryLink.retireStoryLink,
    ),
    routeAnthology(
      repositoryAnthology.createAnthology,
      repositoryAnthology.getAnthology,
      repositoryAnthology.getAnthologies,
      repositoryAnthology.updateAnthology,
      repositoryAnthology.deleteAnthology,
      repositoryAnthology.assignStoryToAnthology,
      repositoryAnthology.removeStoryFromAnthology,
      repositoryAnthology.getAnthologyStories,
      repositoryAnthology.createInterpretiveNote,
      repositoryAnthology.getInterpretiveNotes,
      repositoryStoryLink.getStoryLinksForStory,
      assertIsSteward,
    ),
    routeDeleteScene(
      repositoryScene.deleteScene,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeDeleteStory(
      log,
      repositoryStory.deleteStory,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routePublishStory(
      log,
      repositoryStory.publishStory,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeUnpublishStory(
      log,
      repositoryStory.unpublishStory,
      assertIsAuthorOrStewardOfTheStory,
    ),
    routeGetPublishedStories(log, repositoryStory.getPublishedStorySummaries),
    routeSessions(),
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
