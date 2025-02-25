import type { Parse } from "./parseTypes.js";

const parseHeaderAnonymous = (): Parse => {
  const pattern = /^#(.+)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches) {
      return {
        kind: "nothing",
      };
    }

    const headerText = matches[1]?.trim();

    if (!headerText) {
      return {
        kind: "error",
        message: "Anonymous header doesn't have enough matches",
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
