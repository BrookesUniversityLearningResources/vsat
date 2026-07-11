import type { RequestHandler } from "express";
import type { Logger } from "pino";

import type { RecordStoryEditInDatabase } from "../../../database/schema.js";

export type StoryEditMatch = {
  action: string;
  storyId: number;
  sceneId: number | null;
};

// Each rule is a (method, anchored-path) pair; because the paths are RESTful
// and mutually exclusive, first-match order does not matter. `scene: true`
// means group 2 of the regex is the scene id.
const RULES: ReadonlyArray<{
  method: string;
  re: RegExp;
  action: string;
  scene: boolean;
}> = [
  {
    method: "PUT",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/content$/,
    action: "edit-content",
    scene: true,
  },
  {
    method: "PUT",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/title$/,
    action: "rename-scene",
    scene: true,
  },
  {
    method: "POST",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/image$/,
    action: "set-scene-image",
    scene: true,
  },
  {
    method: "DELETE",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/image\/(\d+)$/,
    action: "remove-scene-image",
    scene: true,
  },
  {
    method: "POST",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/audio$/,
    action: "set-scene-audio",
    scene: true,
  },
  {
    method: "DELETE",
    re: /^\/story\/(\d+)\/scene\/(\d+)\/audio\/(\d+)$/,
    action: "remove-scene-audio",
    scene: true,
  },
  {
    method: "DELETE",
    re: /^\/story\/(\d+)\/scene\/(\d+)$/,
    action: "delete-scene",
    scene: true,
  },
  {
    method: "POST",
    re: /^\/story\/(\d+)\/scene$/,
    action: "create-scene",
    scene: false,
  },
  {
    method: "PUT",
    re: /^\/story\/(\d+)\/title$/,
    action: "rename-story",
    scene: false,
  },
  {
    method: "PUT",
    re: /^\/story\/(\d+)\/mode$/,
    action: "set-mode",
    scene: false,
  },
  {
    method: "POST",
    re: /^\/story\/(\d+)\/publish$/,
    action: "publish",
    scene: false,
  },
  {
    method: "DELETE",
    re: /^\/story\/(\d+)\/publish$/,
    action: "unpublish",
    scene: false,
  },
  {
    method: "DELETE",
    re: /^\/story\/(\d+)$/,
    action: "delete-story",
    scene: false,
  },
];

/**
 * Map an HTTP method + request path to the story edit it represents, or null if
 * the request is not an auditable story mutation. Pure and exported so the
 * mapping can be unit-tested without spinning up Express. Tolerates the `/api`
 * mount prefix and a trailing slash.
 */
export function matchStoryEdit(
  method: string,
  path: string,
): StoryEditMatch | null {
  const normalized = path.replace(/^\/api/, "").replace(/\/+$/, "") || "/";

  for (const rule of RULES) {
    if (rule.method !== method) {
      continue;
    }

    const groups = rule.re.exec(normalized);
    if (groups) {
      return {
        action: rule.action,
        storyId: Number(groups[1]),
        sceneId: rule.scene ? Number(groups[2]) : null,
      };
    }
  }

  return null;
}

/**
 * Express middleware that records an audit-log row for every SUCCESSFUL
 * story-scoped mutation. It attaches on `res.finish` and checks the status
 * there, so only 2xx responses are logged (a 403 from the auth gate, a 400, a
 * 500 all leave no row). A failed log write is swallowed with a warning — the
 * user's edit already succeeded and must not be undone by an audit hiccup.
 *
 * Mount app-wide after authentication so `req.user` is populated.
 */
export default function auditStoryEdits(
  log: Logger,
  recordStoryEdit: RecordStoryEditInDatabase,
): RequestHandler {
  return (req, res, next) => {
    const match = matchStoryEdit(req.method, req.path);
    if (!match) {
      return next();
    }

    const user = req.user;

    res.on("finish", () => {
      if (!user) {
        return;
      }
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      recordStoryEdit({
        storyId: match.storyId,
        sceneId: match.sceneId,
        editorId: user.id,
        action: match.action,
      }).catch((err) => {
        log.warn(
          { err, match },
          "Failed to record story edit in the audit log",
        );
      });
    });

    return next();
  };
}
