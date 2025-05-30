import { nothing, type Parse } from "./parseTypes.js";

export function parseUsing(parsers: ReadonlyArray<Parse>): Parse {
  return (text, lineNumber) => {
    for (const parse of parsers) {
      const result = parse(text, lineNumber);

      if (result.kind === "nothing") {
        continue;
      }

      return result;
    }

    return nothing;
  };
}
