import { ErrorCodes } from "../../../error/errorCode.js";
import parseLinkTarget from "./parseLinkTarget.js";
import { nothing, type Parse } from "./parseTypes.js";

/**
 * A positioned link — a link with percent-of-image coordinates appended:
 *
 *     [text](target @ x,y)
 *
 * e.g. `[through the door](hallway @ 43,62)` puts a clickable hotspot at
 * 43% across / 62% down the scene photo.
 *
 * This parser must run BEFORE `parseLink`: the `@` cannot appear in a link
 * target, so `parseLink`'s malformed-link recovery would otherwise report
 * these lines as "link is missing closing )".
 */
const parseHotspot = (): Parse => {
  const pattern =
    /^\s*\[(.+)]\s*\(([a-zA-Z0-9 -]*)@\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*\)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches || matches.length !== 5) {
      return nothing;
    }

    const linkText = matches[1]?.trim();
    const linkTarget = matches[2]?.trim();
    const x = Number(matches[3]);
    const y = Number(matches[4]);

    if (!linkText || !linkTarget) {
      return {
        kind: "error",
        message:
          "A well-formed hotspot needs both some text and a target that it links to",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return {
        kind: "error",
        message:
          "Hotspot coordinates are percentages of the photo; both must be between 0 and 100",
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
      kind: "hotspot",
      text: linkText,
      link: linkResult.link,
      x,
      y,
    };
  };
};

export default parseHotspot;
