import parseEmptyLine from "./parseEmptyLine.js";
import parseHeaderAnonymous from "./parseHeaderAnonymous.js";
import parseHeaderNamed from "./parseHeaderNamed.js";
import parseLink from "./parseLink.js";
import parsePlaintext from "./parsePlaintext.js";
import type { Parse, ParseBlock } from "./parseTypes.js";

const Parsers: ReadonlyArray<Parse> = [
  parseEmptyLine(),
  parseHeaderNamed(),
  parseHeaderAnonymous(),
  parseLink(),
  parsePlaintext(),
];

function parse(text: string, lineNumber: number): ParseBlock {
  for (const parse of Parsers) {
    const result = parse(text, lineNumber);

    if (result.kind === "nothing") {
      continue;
    }

    return result;
  }

  return {
    kind: "nothing",
  };
}

export default parse;
