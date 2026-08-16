import { ErrorCodes } from "../../../error/errorCode.js";
import { nothing, type Parse } from "./parseTypes.js";

/**
 * Positioned audio: `![text](audio @ x,y)` uses the scene's audio, while
 * `![text](https://example/audio.mp3 @ x,y)` uses an explicit source.
 *
 * A null parsed source represents the case-insensitive `audio` keyword. It is
 * resolved against the scene's attached audio when the story is published.
 */
const parseAudioHotspot = (): Parse => {
  const pattern =
    /^\s*!\[(.+)]\s*\(([^)]*?)\s+@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/i;

  return (text, lineNumber) => {
    const matches = pattern.exec(text);

    if (!matches || matches.length !== 5) {
      return nothing;
    }

    const label = matches[1]?.trim();
    const source = matches[2]?.trim();
    const x = Number(matches[3]);
    const y = Number(matches[4]);

    if (!label || !source) {
      return {
        kind: "error",
        message:
          "A well-formed audio hotspot needs both some text and an audio source",
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
          "Audio hotspot coordinates are percentages of the photo; both must be between 0 and 100",
        line: {
          text,
          number: lineNumber,
        },
        errorCode: ErrorCodes.MalformedLink,
      };
    }

    return {
      kind: "audioHotspot",
      text: label,
      src: source.toLowerCase() === "audio" ? null : source,
      x,
      y,
    };
  };
};

export default parseAudioHotspot;
