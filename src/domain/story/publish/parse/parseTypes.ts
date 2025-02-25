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
  | ParseError;

export type Parse = (text: string, lineNumber: number) => ParseBlock;
