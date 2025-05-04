import { Root, Text } from "@react-three/uikit";
import type { FC } from "react";

import Button from "./Button.js";
import { Colors } from "./Theme.js";
import { useTranslation } from "react-i18next";

const ExitStory: FC = () => {
  const { t } = useTranslation();

  return (
    <Root
      sizeX={1}
      flexDirection="column"
      positionType={"static"}
      positionLeft={0}
      positionTop={0}
    >
      <Button
        size="md"
        backgroundOpacity={0.85}
        backgroundColor={Colors.card}
        onClick={() => {
          window.location.href = new URL("/story", window.location.origin).href;
        }}
      >
        <Text>{t("action.exit-story.label")}</Text>
      </Button>
    </Root>
  );
};

export default ExitStory;
