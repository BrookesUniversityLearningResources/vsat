import type { Parse } from "./parseTypes.js";

const parsePlaintext = (): Parse => {
  const pattern = /(.+)/;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches) {
      return {
        kind: "nothing",
      };
    }

    const plaintext = matches[1]?.trim();

    if (!plaintext) {
      return {
        kind: "error",
        message: "Plaintext doesn't have enough matches",
        line: {
          text,
          number: lineNumber,
        },
      };
    }

    return {
      kind: "plaintext",
      text: plaintext,
    };
  };
};

export default parsePlaintext;
