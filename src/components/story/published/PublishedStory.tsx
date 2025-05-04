import { Hud, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { FontFamilyProvider, Root } from "@react-three/uikit";
import type { ResourceKey } from "i18next";
import { type FC, useState } from "react";
import { I18nextProvider } from "react-i18next";

import openingPageFor from "@domain/story/publish/support/openingPage.js";
import openingSceneFor from "@domain/story/publish/support/openingScene.js";
import type {
  LinkTarget,
  Page,
  PublishedScene,
  PublishedStory,
} from "@domain/story/publish/types.js";
import useI18N from "@i18n/client/useI18N.js";

import htmlIdForStory from "../htmlIdForStory.js";
import Skybox from "./Skybox/Skybox.js";
import BackgroundSound from "./audio/BackgroundSound.js";
import Fiction from "./fiction/Fiction.js";
import ExitStory from "./support/ExitStory.js";
import GoFullscreen from "./support/GoFullscreen.js";
import changePage from "./support/changePage.js";

type PublishedStoryViewProps = {
  story: PublishedStory;
};

const PublishedStoryView: FC<PublishedStoryViewProps> = ({ story }) => {
  const [currentScene, setCurrentScene] = useState<PublishedScene>(() =>
    openingSceneFor(story),
  );

  const [currentPage, setCurrentPage] = useState<Page>(() =>
    openingPageFor(currentScene),
  );

  const followLink = (() => {
    const changePageTo = changePage(story);

    return (target: LinkTarget) => {
      const change = changePageTo(target, currentScene);

      if (change) {
        setCurrentPage(change.toPage);

        if (change.toScene) {
          setCurrentScene(change.toScene);
        }
      }
    };
  })();

  const onExitStory = () => {
    window.location.href = new URL("/story", window.location.origin).href;
  };

  return (
    <Canvas
      id={htmlIdForStory(story.id)}
      gl={{
        localClippingEnabled: true,
        /* for fullscreening */ preserveDrawingBuffer: true,
      }}
      style={{ position: "absolute", inset: "0" }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 5]} />

      <OrbitControls />

      {currentScene.image && <Skybox url={currentScene.image.url} />}

      {currentScene.audio && <BackgroundSound audio={currentScene.audio} />}

      <Hud>
        <PerspectiveCamera />
        <group position={[-3, 0, 1]}>
          <Fiction content={currentPage.content} followLink={followLink} />
        </group>

        <group position={[4.5, -2.5, 1]}>
          <Root
            sizeX={1}
            gapRow={3}
            flexDirection="column"
            positionType={"static"}
            positionTop={0}
            positionLeft={0}
          >
            <GoFullscreen />
            <ExitStory onExit={onExitStory} />
          </Root>
        </group>
      </Hud>
    </Canvas>
  );
};

type PublishedStoryAppProps = {
  translations: Record<string, ResourceKey>;
  story: PublishedStory;
};

const PublishedStoryApp: FC<PublishedStoryAppProps> = ({
  story,
  translations,
}) => {
  const i18n = useI18N(translations, navigator.language);

  return (
    <I18nextProvider i18n={i18n}>
      <FontFamilyProvider
        roboto={{
          medium: "/fonts/roboto-regular-msdf.json",
          bold: "/fonts/roboto-bold-msdf.json",
        }}
      >
        <PublishedStoryView story={story} />
      </FontFamilyProvider>
    </I18nextProvider>
  );
};

export default PublishedStoryApp;
