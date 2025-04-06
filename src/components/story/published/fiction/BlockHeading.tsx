import { Container, Text } from "@react-three/uikit";
import type { FC } from "react";

import type { HeadingBlock } from "@domain/story/publish/types";

import { Colors } from "../support/Theme.js";

type BlockHeadingProps = { block: HeadingBlock };

const BlockHeading: FC<BlockHeadingProps> = ({ block }) => {
  return (
    <Container
      flexGrow={1}
      margin={5}
      padding={5}
      backgroundOpacity={0}
      backgroundColor={Colors.background}
    >
      <Text fontWeight={"bold"} color={Colors.plaintext}>
        {block.text}
      </Text>
    </Container>
  );
};

export default BlockHeading;
