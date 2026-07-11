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
  // hotspot before link: the `@ x,y` suffix would otherwise trip
  // parseLink's malformed-link recovery
  parseHotspot(),
  parseLink(),
  // panel before plaintext, which would swallow the directive as fiction
  parsePanel(),
  parsePlaintext(),
]);

export default parse;
