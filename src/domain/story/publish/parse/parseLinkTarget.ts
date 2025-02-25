import type { LinkTarget } from "../types.js";

export type ParseLinkTargetSuccess = {
  kind: "link";
  link: LinkTarget;
};

export type ParseLinkTargetFailure = {
  kind: "failure";
  reason: string;
};

export type ParseLinkTargetResult =
  | ParseLinkTargetSuccess
  | ParseLinkTargetFailure;

function parseLinkTarget(text: string): ParseLinkTargetResult {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return {
      kind: "failure",
      reason: "The empty string is not a valid link target",
    };
  }

  const link = trimmed.replace(/\s+/g, "-").toLocaleLowerCase();

  return {
    kind: "link",
    link,
  };
}

export default parseLinkTarget;
