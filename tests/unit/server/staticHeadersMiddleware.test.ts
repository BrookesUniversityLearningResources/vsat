import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { withHeadersToEnableSharedArrayBufferUsage } from "../../../src/server/staticHeadersMiddleware.js";

// Minimal fakes — the middleware only touches req.path and res.setHeaders().
const run = (path: string) => {
  const headers = new Map<string, unknown>();
  let nextCalled = false;

  withHeadersToEnableSharedArrayBufferUsage()(
    { path } as never,
    {
      setHeaders(h: Map<string, unknown>) {
        h.forEach((v, k) => headers.set(k, v));
      },
    } as never,
    () => {
      nextCalled = true;
    },
  );

  return { headers, nextCalled };
};

describe("withHeadersToEnableSharedArrayBufferUsage", () => {
  for (const path of ["/story/1", "/author/story", "/", "/loginfoo"]) {
    test(`isolates ${path}`, () => {
      const { headers, nextCalled } = run(path);
      assert.equal(headers.get("Cross-Origin-Embedder-Policy"), "require-corp");
      assert.equal(headers.get("Cross-Origin-Opener-Policy"), "same-origin");
      assert.ok(nextCalled);
    });
  }

  for (const path of ["/login", "/login/callback"]) {
    test(`does not isolate ${path} (Magic iframe)`, () => {
      const { headers, nextCalled } = run(path);
      assert.equal(headers.size, 0);
      assert.ok(nextCalled);
    });
  }
});
