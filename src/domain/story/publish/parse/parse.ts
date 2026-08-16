import parseAudioHotspot from "./parseAudioHotspot.js";
import parseEmptyLine from "./parseEmptyLine.js";
import parseHeaderAnonymous from "./parseHeaderAnonymous.js";
import parseHeaderNamed from "./parseHeaderNamed.js";
import parseHotspot from "./parseHotspot.js";
import parseLink from "./parseLink.js";
import parsePanel from "./parsePanel.js";
import parsePlaintext from "./parsePlaintext.js";
import { parseUsing } from "./parseUsing.js";

const parse = parseUsing([
  parseEmptyLine(),
  parseHeaderNamed(),
  parseHeaderAnonymous(),
  // Audio hotspot before hotspot, and hotspot before link: the `!` prefix and
  // `@ x,y` suffix must be claimed before malformed-link/plaintext recovery.
  parseAudioHotspot(),
  parseHotspot(),
  parseLink(),
  // panel before plaintext, which would swallow the directive as fiction
  parsePanel(),
  parsePlaintext(),
]);

export default parse;
