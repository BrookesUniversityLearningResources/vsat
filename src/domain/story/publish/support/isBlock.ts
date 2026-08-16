import type {
  AudioHotspotBlock,
  Block,
  HeadingBlock,
  HotspotBlock,
  LinkBlock,
  PanelBlock,
  PlaintextBlock,
} from "../types.ts";

export function isHeadingBlock(block: Block): block is HeadingBlock {
  return block.kind === "blockHeading";
}

export function isLinkBlock(block: Block): block is LinkBlock {
  return block.kind === "blockLink";
}

export function isHotspotBlock(block: Block): block is HotspotBlock {
  return block.kind === "blockHotspot";
}

export function isAudioHotspotBlock(block: Block): block is AudioHotspotBlock {
  return block.kind === "blockAudioHotspot";
}

export function isPanelBlock(block: Block): block is PanelBlock {
  return block.kind === "blockPanel";
}

export function isPlaintextBlock(block: Block): block is PlaintextBlock {
  return block.kind === "blockPlaintext";
}
