import { Container, Text } from "@react-three/uikit";
import type { FC } from "react";

import type { PlaintextBlock } from "@domain/story/publish/types";

import { Colors } from "../support/Theme.js";

type BlockPlaintextProps = { block: PlaintextBlock };

const BlockPlaintext: FC<BlockPlaintextProps> = ({ block }) => {
  return (
    <Container
      margin={5}
      padding={5}
      borderRadius={8}
      backgroundOpacity={0}
      backgroundColor={Colors.background}>
      <Text color={Colors.plaintext}>{block.text}</Text>
    </Container>
  );
};

export default BlockPlaintext;
