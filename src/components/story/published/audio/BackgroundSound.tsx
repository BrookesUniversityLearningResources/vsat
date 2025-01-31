import { useThree } from "@react-three/fiber";
import { type FC, useEffect } from "react";
import { Audio, AudioListener, AudioLoader } from "three";

import type { PersistentAudio } from "@domain/index";

type BackgroundSoundProps = {
  audio: PersistentAudio;
};

const BackgroundSound: FC<BackgroundSoundProps> = ({ audio }) => {
  const { camera } = useThree();

  useEffect(() => {
    const listener = new AudioListener();
    camera.add(listener);

    const backgroundSound = new Audio(listener);
    const audioLoader = new AudioLoader();

    audioLoader.load(audio.url, (buffer) => {
      backgroundSound.setBuffer(buffer);
      backgroundSound.setLoop(true);
      backgroundSound.setVolume(0.5);
    });

    const play = () => {
      if (!backgroundSound.isPlaying) {
        backgroundSound.play();
      }
    };

    window.addEventListener("click", play);
    return () => {
      window.removeEventListener("click", play);
      backgroundSound.stop();
    };
  }, [audio, camera]);

  return null;
};

export default BackgroundSound;
