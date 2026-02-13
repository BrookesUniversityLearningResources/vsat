import type { HeaderAnonymous } from "../parse/parseTypes.js";
import type { LinkTarget } from "../types.js";

export default function deriveLinkTarget(header: HeaderAnonymous): LinkTarget {
  return header.text.toLowerCase().replace(/[^a-z0-9 ]+/gi, "");
}
export function deriveLinkTargetLeniently(name: LinkTarget): LinkTarget {
  return name.replace(/\s+/g, "-");
}
