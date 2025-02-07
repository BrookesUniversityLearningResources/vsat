import type { PersistentScene } from "../../../../domain";

export type SceneImageChanged = Readonly<
  Required<Pick<PersistentScene, "id" | "image">> & {
    kind: "imageChanged";
  }
>;

export type SceneAudioChanged = Readonly<
  Required<Pick<PersistentScene, "id" | "audio">> & {
    kind: "audioChanged";
  }
>;

export type SceneContentChanged = Readonly<
  Required<Pick<PersistentScene, "id" | "content">> & {
    kind: "contentChanged";
  }
>;

export type SceneDeleted = Readonly<
  Required<Pick<PersistentScene, "id">> & {
    kind: "sceneDeleted";
  }
>;

export type SceneCreated = Readonly<{
  kind: "sceneCreated";
  scene: PersistentScene;
}>;

export type SceneTitleChanged = Readonly<{
  kind: "sceneTitleChanged";
  title: PersistentScene["title"];
}>;

export type SceneChanged =
  | SceneImageChanged
  | SceneAudioChanged
  | SceneDeleted
  | SceneCreated
  | SceneTitleChanged
  | SceneContentChanged;

export type OnSceneChanged = (scene: SceneChanged) => void;
