import { type FC, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import styles from "./AudioPlayer.module.css";

type AudioPlayerProps = {
  src: string;
};

const AudioPlayer: FC<AudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { t } = useTranslation();

  const togglePlay = () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const playLabel = isPlaying
    ? t("scene.action.pause-audio.label")
    : t("scene.action.play-audio.label");

  const muteLabel = isMuted
    ? t("scene.action.unmute-audio.label")
    : t("scene.action.mute-audio.label");

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={src}
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={styles.iconButton}
        aria-label={playLabel}
        title={playLabel}
      >
        {isPlaying ? (
          <img
            src="/images/pause-white.svg"
            alt={playLabel}
            title={playLabel}
          />
        ) : (
          <img src="/images/play-white.svg" alt={playLabel} title={playLabel} />
        )}
      </button>

      <button
        type="button"
        onClick={toggleMute}
        className={styles.iconButton}
        aria-label={muteLabel}
        title={muteLabel}
      >
        {isMuted ? (
          <img src="/images/mute-white.svg" alt={muteLabel} title={muteLabel} />
        ) : (
          <img
            src="/images/unmute-white.svg"
            alt={muteLabel}
            title={muteLabel}
          />
        )}
      </button>
    </div>
  );
};

export default AudioPlayer;
