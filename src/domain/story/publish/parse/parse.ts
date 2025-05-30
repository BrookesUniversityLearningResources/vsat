import parseEmptyLine from "./parseEmptyLine.js";
import parseHeaderAnonymous from "./parseHeaderAnonymous.js";
import parseHeaderNamed from "./parseHeaderNamed.js";
import parseLink from "./parseLink.js";
import parsePlaintext from "./parsePlaintext.js";
import { parseUsing } from "./parseUsing.js";

const parse = parseUsing([
  parseEmptyLine(),
  parseHeaderNamed(),
  parseHeaderAnonymous(),
  parseLink(),
  parsePlaintext(),
]);

export default parse;
