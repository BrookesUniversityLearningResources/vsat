import type { Parse } from "./parseTypes.js";

const parseHeaderNamed = (): Parse => {
  const pattern = /^#(.+)\|\s*([a-z-]+)/i;

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
        message: "Named header doesn't have enough matches",
        line: {
          text,
          number: lineNumber,
        },
      };
    }

    const headerText = matches[1]?.trim();

    if (!headerText) {
      return {
        kind: "error",
        message: "Named header doesn't have any text",
        line: {
          text,
          number: lineNumber,
        },
      };
    }

    const headerName = matches[2]?.trim();

    if (!headerName) {
      return {
        kind: "error",
        message: "Named header doesn't have a name",
        line: {
          text,
          number: lineNumber,
        },
      };
    }

    return {
      kind: "headerNamed",
      text: headerText,
      name: headerName.toLowerCase(),
    };
  };
};

export default parseHeaderNamed;
