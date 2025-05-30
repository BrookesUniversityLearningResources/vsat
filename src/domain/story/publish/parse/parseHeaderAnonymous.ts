import { ErrorCodes } from "../../../error/errorCode.js";
import { nothing, type Parse } from "./parseTypes.js";

const parseHeaderAnonymous = (): Parse => {
  const pattern = /^#(.*)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches) {
      return nothing;
    }

    const headerText = matches[1]?.trim();

    if (!headerText) {
      return {
        kind: "error",
        message: "A header must have some text; add some text after the #",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.ParseErrorHeaderNeedsText,
      };
    }

    if (headerText.endsWith("|")) {
      return {
        kind: "error",
        message: "An anonymous header must not end with a |",
        errorCode: ErrorCodes.ParseErrorHeaderNeedsName,
        line: {
          text,
          number: lineNumber,
        },
      };
    }

    return {
      kind: "headerAnonymous",
      text: headerText,
    };
  };
};

export default parseHeaderAnonymous;
