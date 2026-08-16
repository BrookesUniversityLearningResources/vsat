import type { ErrorCode } from "../../../error/errorCode.js";
import type { LinkTarget } from "../types.js";

export type EmptyLine = Readonly<{
  kind: "emptyLine";
}>;

export type Plaintext = Readonly<{
  kind: "plaintext";
  text: string;
}>;

export type HeaderNamed = Readonly<{
  kind: "headerNamed";
  name: LinkTarget;
  text: string;
}>;

export type HeaderAnonymous = Readonly<{
  kind: "headerAnonymous";
  text: string;
}>;

export type Link = Readonly<{
  kind: "link";
  text: string;
  link: LinkTarget;
}>;

/**
 * A positioned link: `[text](target @ x,y)` where x,y are
 * percent-of-image coordinates. Rendered as a clickable hotspot on the
 * scene photo rather than a button in the fiction block.
 */
export type Hotspot = Readonly<{
  kind: "hotspot";
  text: string;
  link: LinkTarget;
  x: number;
  y: number;
}>;

/**
 * Positioned audio. A null source represents the `audio` keyword and is
 * resolved to the scene's attached audio during publishing.
 */
export type AudioHotspot = Readonly<{
  kind: "audioHotspot";
  text: string;
  src: string | null;
  x: number;
  y: number;
}>;

/**
 * A per-page panel placement directive: `@panel x,y` with x,y as
 * percent-of-viewport coordinates of the fiction/nav panel's centre.
 */
export type Panel = Readonly<{
  kind: "panel";
  x: number;
  y: number;
}>;

/**
 * For when nothing matches; we'll just ignore that sort of stuff
 */
export type Nothing = Readonly<{
  kind: "nothing";
}>;

export type ParseError = Readonly<{
  kind: "error";
  message: string;
  line: {
    text: string;
    number: number;
  };
  errorCode?: ErrorCode;
}>;

export type ParseBlock =
  | Nothing
  | EmptyLine
  | Plaintext
  | HeaderAnonymous
  | HeaderNamed
  | Link
  | Hotspot
  | AudioHotspot
  | Panel
  | ParseError;

export type Parse = (text: string, lineNumber: number) => ParseBlock;

export const nothing: Nothing = Object.freeze({ kind: "nothing" });
