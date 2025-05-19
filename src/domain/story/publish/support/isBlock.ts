import type {
  Block,
  HeadingBlock,
  LinkBlock,
  PlaintextBlock,
} from "../types.ts";

export function isHeadingBlock(block: Block): block is HeadingBlock {
  return block.kind === "blockHeading";
}

export function isLinkBlock(block: Block): block is LinkBlock {
  return block.kind === "blockLink";
}

export function isPlaintextBlock(block: Block): block is PlaintextBlock {
  return block.kind === "blockPlaintext";
}
