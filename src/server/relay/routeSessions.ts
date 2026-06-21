import { Router } from "express";

import isStewardUser from "../../authentication/isStewardUser.js";
import { sessionRegistry } from "./sessionRegistry.js";

/**
 * Lists the currently-live remote-control sessions for the lobby page.
 * Mounted under `/api`, so the path is `/api/sessions`.
 *
 * Discovery is steward-only: browsing *all* live sessions is a privileged view.
 * Joining a single session you were handed a code/QR for is capability-based
 * and handled by the relay, not here. (Authenticating the relay socket itself
 * is a separate, larger auth task.)
 */
export default function routeSessions(): Router {
  return Router().get("/sessions", (req, res) => {
    if (!isStewardUser(req.user, req.headers.cookie)) {
      res.status(403).json({ error: "Stewards only" });
      return;
    }
    res.json({ sessions: sessionRegistry.list() });
  });
}
