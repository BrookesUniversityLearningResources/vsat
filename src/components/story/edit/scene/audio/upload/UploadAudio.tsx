import { useMutation } from "@tanstack/react-query";
import { type ChangeEventHandler, type FC, useState } from "react";

import type {
  PersistentAudio,
  PersistentScene,
  PersistentStory,
} from "../../../../../../domain";
import unsupported from "../../../../../../domain/story/client/unsupportedResult";
import {
  type WithFeedback,
  type WithUploadSceneAudio,
  useEnvironment,
} from "../../../context/ClientContext";
import type { OnSceneChanged } from "../../types";
import ChooseAudio from "./ChooseAudio";
import PreviewAudio from "./PreviewAudio";

type UploadAudioProps = {
  storyId: PersistentStory["id"];
  sceneId: PersistentScene["id"];
  onSceneChanged: OnSceneChanged;
};

const UploadAudio: FC<UploadAudioProps> = ({
  storyId,
  sceneId,
  onSceneChanged,
}) => {
  const { uploadSceneAudio, feedback } = useEnvironment<
    WithUploadSceneAudio & WithFeedback
  >();

  const upload = useMutation<PersistentAudio, Error, File>({
    mutationFn: (audioData) =>
      uploadSceneAudio({ storyId, sceneId, audioData }).then((result) => {
        switch (result.kind) {
          case "sceneAudioUploaded":
            return result.audio;
          case "error":
            return Promise.reject(result.error);
          default:
            return unsupported(result);
        }
      }),
    onError: feedback.notify.error,
    onSuccess: (audio) =>
      onSceneChanged({
        kind: "audioChanged",
        id: sceneId,
        audio,
      }),
  });

  const [audioFile, setAudioFile] = useState<File | undefined>();

  if (audioFile) {
    return (
      <PreviewAudio
        audio={audioFile}
        cancel={() => setAudioFile(undefined)}
        upload={upload.mutate}
        isUploading={upload.isPending}
      />
    );
  }

  const onFileChange: ChangeEventHandler<HTMLInputElement> = ({
    currentTarget,
  }) => {
    const files = currentTarget.files;

    if (!files) {
      setAudioFile(undefined);
    } else if (files.length >= 1) {
      setAudioFile(files[0]);
    }
  };

  return <ChooseAudio onFileChange={onFileChange} />;
};

export default UploadAudio;
