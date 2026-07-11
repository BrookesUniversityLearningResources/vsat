import { ErrorCodes } from "../../../error/errorCode.js";
import { nothing, type Parse } from "./parseTypes.js";

/**
 * A per-page placement directive for the fiction/nav panel:
 *
 *     @panel x,y
 *
 * where x,y are percent-of-viewport coordinates of the panel's centre —
 * e.g. `@panel 72,30` docks the panel toward the upper right. Written by
 * the flat viewer's edit mode when the author drags the panel; harmless
 * to hand-edit.
 *
 * Must run before `parsePlaintext`, which would otherwise swallow the
 * line as fiction text.
 */
const parsePanel = (): Parse => {
  const pattern = /^\s*@panel\s+(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*$/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches || matches.length !== 3) {
      return nothing;
    }

    const x = Number(matches[1]);
    const y = Number(matches[2]);

    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return {
        kind: "error",
        message:
          "Panel coordinates are percentages of the view; both must be between 0 and 100",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    return {
      kind: "panel",
      x,
      y,
    };
  };
};

export default parsePanel;
