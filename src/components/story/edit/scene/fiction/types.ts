import type { ErrorCode } from "@domain/error/errorCode";
import type { Text } from "slate";

export type HeadingElement = {
  type: "blockHeading";
  children: Text[];
};

export type LinkElement = {
  type: "blockLink";
  children: Text[];
};

export type PlaintextElement = {
  type: "blockPlaintext";
  children: Text[];
};

export type ErrorElement = {
  type: "blockError";
  children: Text[];
  error: {
    message: string;
    code: ErrorCode;
  };
};

export type CustomElement =
  | HeadingElement
  | PlaintextElement
  | LinkElement
  | ErrorElement;

declare module "slate" {
  interface CustomTypes {
    Element: CustomElement;
  }
}
