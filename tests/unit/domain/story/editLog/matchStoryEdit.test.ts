import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { matchStoryEdit } from "@domain/story/editLog/auditStoryEdits.js";

describe("matchStoryEdit", () => {
  const cases: [string, string, { action: string; storyId: number; sceneId: number | null }][] = [
    ["PUT", "/api/story/5/scene/9/content", { action: "edit-content", storyId: 5, sceneId: 9 }],
    ["PUT", "/api/story/5/scene/9/title", { action: "rename-scene", storyId: 5, sceneId: 9 }],
    ["POST", "/api/story/5/scene/9/image", { action: "set-scene-image", storyId: 5, sceneId: 9 }],
    ["DELETE", "/api/story/5/scene/9/image/3", { action: "remove-scene-image", storyId: 5, sceneId: 9 }],
    ["POST", "/api/story/5/scene/9/audio", { action: "set-scene-audio", storyId: 5, sceneId: 9 }],
    ["DELETE", "/api/story/5/scene/9/audio/3", { action: "remove-scene-audio", storyId: 5, sceneId: 9 }],
    ["DELETE", "/api/story/5/scene/9", { action: "delete-scene", storyId: 5, sceneId: 9 }],
    ["POST", "/api/story/5/scene", { action: "create-scene", storyId: 5, sceneId: null }],
    ["PUT", "/api/story/5/title", { action: "rename-story", storyId: 5, sceneId: null }],
    ["PUT", "/api/story/5/mode", { action: "set-mode", storyId: 5, sceneId: null }],
    ["POST", "/api/story/5/publish", { action: "publish", storyId: 5, sceneId: null }],
    ["DELETE", "/api/story/5/publish", { action: "unpublish", storyId: 5, sceneId: null }],
    ["DELETE", "/api/story/5", { action: "delete-story", storyId: 5, sceneId: null }],
  ];

  for (const [method, path, expected] of cases) {
    test(`${method} ${path} → ${expected.action}`, () => {
      assert.deepEqual(matchStoryEdit(method, path), expected);
    });
  }

  test("works without the /api mount prefix", () => {
    assert.deepEqual(matchStoryEdit("PUT", "/story/7/scene/2/content"), {
      action: "edit-content",
      storyId: 7,
      sceneId: 2,
    });
  });

  test("tolerates a trailing slash", () => {
    assert.deepEqual(matchStoryEdit("POST", "/api/story/7/scene/"), {
      action: "create-scene",
      storyId: 7,
      sceneId: null,
    });
  });

  test("delete-story does not swallow delete-scene or unpublish", () => {
    // /publish is unpublish, /scene/:id is delete-scene — neither is delete-story
    assert.equal(matchStoryEdit("DELETE", "/api/story/5/publish")?.action, "unpublish");
    assert.equal(matchStoryEdit("DELETE", "/api/story/5/scene/9")?.action, "delete-scene");
  });

  test("returns null for non-mutations and reads", () => {
    assert.equal(matchStoryEdit("GET", "/api/story/5"), null);
    assert.equal(matchStoryEdit("GET", "/api/story/5/scene/9"), null);
    assert.equal(matchStoryEdit("POST", "/api/anthology"), null);
    assert.equal(matchStoryEdit("PUT", "/api/story/5/scene/9/unknown"), null);
    assert.equal(matchStoryEdit("PATCH", "/api/story/5"), null);
  });
});
