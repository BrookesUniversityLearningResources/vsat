import I18N, { type i18n } from "i18next";
import { createContext, useContext } from "react";

import createScene, {
  type CreateScene,
} from "@domain/story/client/createScene";
import createStory, {
  type CreateStory,
} from "@domain/story/client/createStory";
import deleteScene, {
  type DeleteScene,
} from "@domain/story/client/deleteScene";
import deleteSceneAudio, {
  type DeleteSceneAudio,
} from "@domain/story/client/deleteSceneAudio";
import deleteSceneImage, {
  type DeleteSceneImage,
} from "@domain/story/client/deleteSceneImage";
import getScene, { type GetScene } from "@domain/story/client/getScene";
import getStory, { type GetStory } from "@domain/story/client/getStory";
import publishStory, {
  type PublishStory,
} from "@domain/story/client/publishStory";
import saveSceneContent, {
  type SaveSceneContent,
} from "@domain/story/client/saveSceneContent";
import saveSceneTitle, {
  type SaveSceneTitle,
} from "@domain/story/client/saveSceneTitle";
import saveStoryTitle, {
  type SaveStoryTitle,
} from "@domain/story/client/saveStoryTitle";
import unpublishStory, {
  type UnpublishStory,
} from "@domain/story/client/unpublishStory";
import uploadSceneAudio, {
  type UploadSceneAudio,
} from "@domain/story/client/uploadSceneAudio";
import uploadSceneImage, {
  type UploadSceneImage,
} from "@domain/story/client/uploadSceneImage";
import { type Dialog, dialogUsingSweetAlert } from "../../../feedback/dialog";
import { type Notify, notifyUsingSweetAlert } from "../../../feedback/notify";

export type WithDeleteSceneImage = {
  deleteSceneImage: DeleteSceneImage;
};

export type WithDeleteSceneAudio = {
  deleteSceneAudio: DeleteSceneAudio;
};

export type WithUploadSceneImage = {
  uploadSceneImage: UploadSceneImage;
};

export type WithUploadSceneAudio = {
  uploadSceneAudio: UploadSceneAudio;
};

export type WithGetStory = {
  getStory: GetStory;
};

export type WithGetScene = {
  getScene: GetScene;
};

export type WithCreateStory = {
  createStory: CreateStory;
};

export type WithCreateScene = {
  createScene: CreateScene;
};

export type WithSaveStoryTitle = {
  saveStoryTitle: SaveStoryTitle;
};

export type WithSaveSceneTitle = {
  saveSceneTitle: SaveSceneTitle;
};

export type WithPublishStory = {
  publishStory: PublishStory;
};

export type WithUnpublishStory = {
  unpublishStory: UnpublishStory;
};

export type WithSaveSceneContent = {
  saveSceneContent: SaveSceneContent;
};

export type WithDeleteScene = {
  deleteScene: DeleteScene;
};

export type WithFeedback = {
  feedback: {
    notify: Notify;
    dialog: Dialog;
  };
};

export type ClientEnvironment = WithDeleteSceneImage &
  WithDeleteSceneAudio &
  WithUploadSceneAudio &
  WithUploadSceneImage &
  WithGetStory &
  WithGetScene &
  WithSaveSceneContent &
  WithDeleteScene &
  WithCreateScene &
  WithCreateStory &
  WithPublishStory &
  WithUnpublishStory &
  WithSaveStoryTitle &
  WithSaveSceneTitle &
  WithFeedback;

export const createClientEnvironment = (
  i18n: i18n = I18N,
): ClientEnvironment => {
  return {
    deleteSceneImage,
    deleteSceneAudio,
    uploadSceneImage,
    uploadSceneAudio,
    getStory,
    getScene,
    saveSceneContent,
    feedback: {
      notify: notifyUsingSweetAlert(i18n),
      dialog: dialogUsingSweetAlert(i18n),
    },
    deleteScene,
    createScene,
    createStory,
    publishStory,
    unpublishStory,
    saveStoryTitle,
    saveSceneTitle,
  };
};

export const ClientContext = createContext<ClientEnvironment>(
  createClientEnvironment(),
);

export const useEnvironment = <E extends Partial<ClientEnvironment>>() => {
  return useContext(ClientContext) as E;
};
