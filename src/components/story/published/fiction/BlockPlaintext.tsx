import { Container, Text } from "@react-three/uikit";
import type { FC } from "react";

import type { PlaintextBlock } from "@domain/story/publish/types";

type BlockPlaintextProps = { block: PlaintextBlock };

const BlockPlaintext: FC<BlockPlaintextProps> = ({ block }) => {
  return (
    <Container margin={5} padding={5} backgroundColor={"whitesmoke"}>
      <Text color={"#330000"}>{block.text}</Text>
    </Container>
  );
};

export default BlockPlaintext;
