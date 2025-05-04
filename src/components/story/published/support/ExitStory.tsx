import { Text } from "@react-three/uikit";
import type { FC } from "react";

import { useTranslation } from "react-i18next";
import Button from "./Button.js";
import { Colors } from "./Theme.js";

export type ExitStoryProps = {
  onExit: () => void;
};

const ExitStory: FC<ExitStoryProps> = ({ onExit }) => {
  const { t } = useTranslation();

  return (
    <Button
      size="md"
      backgroundOpacity={0.85}
      backgroundColor={Colors.card}
      onClick={onExit}
    >
      <Text>{t("action.exit-story.label")}</Text>
    </Button>
  );
};

export default ExitStory;
