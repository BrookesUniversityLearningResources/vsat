import type { Parse } from "./parseTypes.js";

const parseEmptyLine = (): Parse => {
  const pattern = /^$/;

  return (text) => {
    const matches = pattern.exec(text.trim());

    if (!matches) {
      return {
        kind: "nothing",
      };
    }

    return {
      kind: "emptyLine",
    };
  };
};

export default parseEmptyLine;
