import express, { type RequestHandler, Router } from "express";
import { isSettingValue, type SiteSettings } from "./siteSettings.js";

export default function routeSiteSettings(
  settings: SiteSettings,
  assertIsSteward: RequestHandler,
): Router {
  const router = Router();
  router.post(
    "/site-settings",
    assertIsSteward,
    express.urlencoded({ extended: false }),
    express.json(),
    async (req, res, next) => {
      const { key, value } = req.body ?? {};
      if (
        (key !== "presentation_mode" && key !== "interpretive_links") ||
        !isSettingValue(key, value)
      ) {
        res.status(400).json({ error: "Invalid site setting" });
        return;
      }
      try {
        await settings.saveSetting(key, value, req.user?.email ?? null);
        if (req.is("application/json")) res.status(200).json({ key, value });
        else res.redirect(303, "/author/settings");
      } catch (error) {
        next(error);
      }
    },
  );
  return router;
}
