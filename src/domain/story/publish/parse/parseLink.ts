import { ErrorCodes } from "../../../error/errorCode.js";
import parseLinkTarget from "./parseLinkTarget.js";
import { nothing, type Parse } from "./parseTypes.js";
import { parseUsing } from "./parseUsing.js";

const parseLinkWithSwappedDelimiters = ((): Parse => {
  const pattern = /^\s*\((.+)\)\s*\[([a-zA-Z0-9 -]+)\]/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches || matches.length !== 3) {
      return nothing;
    }

    return {
      kind: "error",
      message: "Link delimiters are swapped; it's []() not ()[]",
      line: {
        text,
        number: lineNumber,
      },
      errorCode: ErrorCodes.ParseErrorLinkDelimetersSwapped,
    };
  };
})();

const parseUnclosedLink = ((): Parse => {
  const pattern = /^\s*\[(.+)]\s*\(([a-zA-Z0-9 -]+)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches || matches.length !== 3) {
      return nothing;
    }

    return {
      kind: "error",
      message: "Link is missing closing )",
      line: {
        text,
        number: lineNumber,
      },
      errorCode: ErrorCodes.ParseErrorLinkNotClosed,
    };
  };
})();

const parseLinkMissingTextAndTarget = ((): Parse => {
  const pattern = /^\s*\[\s*]\s*\(\s*\)/i;

  return (text, lineNumber) => {
    const matches = pattern.test(text);

    if (!matches) {
      return nothing;
    }

    return {
      kind: "error",
      message:
        "A well-formed link needs both some text and a target that it links to",
      line: {
        text,
        number: lineNumber,
      },
      errorCode: ErrorCodes.ParseErrorLinkEmpty,
    };
  };
})();

const parseLink = (): Parse => {
  const pattern = /^\s*\[(.+)]\s*\(([a-zA-Z0-9 -]*)\)/i;

  const parsePotentiallyMalformedLinks = parseUsing([
    parseUnclosedLink,
    parseLinkWithSwappedDelimiters,
    parseLinkMissingTextAndTarget,
  ]);

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches) {
      return parsePotentiallyMalformedLinks(text, lineNumber);
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
    const linkTarget = matches[2]?.trim();

    if (!linkText && !linkTarget) {
      return {
        kind: "error",
        message:
          "A well-formed link needs both some text and a target that it links to",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.ParseErrorLinkEmpty,
      };
    }

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
