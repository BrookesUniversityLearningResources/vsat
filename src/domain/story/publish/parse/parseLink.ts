import { ErrorCodes } from "../../../error/errorCode.js";
import parseLinkTarget from "./parseLinkTarget.js";
import type { Parse } from "./parseTypes.js";

const parseLink = (): Parse => {
  const pattern = /^\s*\[(.+)]\s*\(([a-zA-Z -]+)\)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches) {
      return {
        kind: "nothing",
      };
    }

    if (matches.length !== 3) {
      return {
        kind: "error",
        message: "Link doesn't have enough matches",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    const linkText = matches[1]?.trim();

    if (!linkText) {
      return {
        kind: "error",
        message: "Link doesn't have any text",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    const linkTarget = matches[2]?.trim();

    if (!linkTarget) {
      return {
        kind: "error",
        message: "Link doesn't have a target",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    const linkResult = parseLinkTarget(linkTarget);
    if (linkResult.kind === "failure") {
      return {
        kind: "error",
        message: linkResult.reason,
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    return {
      kind: "link",
      text: linkText,
      link: linkResult.link,
    };
  };
};

export default parseLink;
