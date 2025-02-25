import { Text } from "@react-three/uikit";
import type { FC } from "react";

import type { LinkBlock, LinkTarget } from "@domain/story/publish/types";

import Button from "../support/Button";

type BlockLinkProps = {
  block: LinkBlock;
  followLink: (target: LinkTarget) => void;
};

const BlockLink: FC<BlockLinkProps> = ({ block, followLink }) => {
  return (
    <Button size="md" platter={true} onClick={() => followLink(block.link)}>
      <Text>{block.text}</Text>
    </Button>
  );
};

export default BlockLink;
