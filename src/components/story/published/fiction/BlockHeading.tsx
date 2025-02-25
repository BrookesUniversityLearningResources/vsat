import { Container, Text } from "@react-three/uikit";
import type { FC } from "react";

import type { HeadingBlock } from "@domain/story/publish/types";

type BlockHeadingProps = { block: HeadingBlock };

const BlockHeading: FC<BlockHeadingProps> = ({ block }) => {
  return (
    <Container
      flexGrow={1}
      margin={5}
      padding={5}
      backgroundColor={"whitesmoke"}
    >
      <Text fontWeight={"bold"} color={"#330000"}>
        {block.text}
      </Text>
    </Container>
  );
};

export default BlockHeading;
