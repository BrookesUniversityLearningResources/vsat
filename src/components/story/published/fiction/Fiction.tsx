import { DefaultProperties } from "@react-three/uikit";
import type { FC } from "react";

import type { Block, LinkTarget } from "@domain/story/publish/types";
import type { NonEmptyArray } from "@util/nonEmptyArray";

import Card from "../support/Card";
import BlockHeading from "./BlockHeading";
import BlockLink from "./BlockLink";
import BlockPlaintext from "./BlockPlaintext";

type FictionProps = {
  content: NonEmptyArray<Block>;
  followLink: (target: LinkTarget) => void;
};

const Fiction: FC<FictionProps> = ({ content, followLink }) => {
  const fiction = content.reduce((pageContent, block) => {
    switch (block.kind) {
      case "blockHeading": {
        pageContent.push(<BlockHeading block={block} />);
        break;
      }

      case "blockPlaintext": {
        pageContent.push(<BlockPlaintext block={block} />);
        break;
      }

      case "blockLink": {
        pageContent.push(<BlockLink block={block} followLink={followLink} />);
        break;
      }

      default: {
        ((_: never) => _)(block);
      }
    }

    return pageContent;
  }, [] as JSX.Element[]);

  return (
    <DefaultProperties fontFamily="roboto">
      <Card
        gap={2}
        padding={8}
        flexDirection="column"
        backgroundOpacity={0.85}
        borderTopLeftRadius={8}
        borderTopRightRadius={60}
        borderBottomRightRadius={8}
        borderBottomLeftRadius={8}
      >
        {...fiction}
      </Card>
    </DefaultProperties>
  );
};

export default Fiction;
