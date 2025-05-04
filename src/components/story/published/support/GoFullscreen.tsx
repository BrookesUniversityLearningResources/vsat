import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/uikit";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

import Button from "./Button.js";
import { Colors } from "./Theme.js";

const GoFullscreen: FC = () => {
  const { t } = useTranslation();

  const { gl } = useThree();

  if (document.fullscreenElement !== null) {
    // we're already fullscreen so don't bother rendering anything
    return null;
  }

  return (
    <Button
      size="md"
      backgroundOpacity={0.85}
      backgroundColor={Colors.card}
      onClick={() => {
        gl.domElement.requestFullscreen();
      }}
    >
      <Text>{t("action.fullscreen-enter.label")}</Text>
    </Button>
  );
};

export default GoFullscreen;
