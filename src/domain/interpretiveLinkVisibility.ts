import type { InterpretiveLinks } from "./siteSettings.js";

// Authoring only: stored links are retained and published readers continue to
// render them. Turning authoring back on restores all of these affordances.
export function showInterpretiveLinkAuthoring(
  setting: InterpretiveLinks,
): boolean {
  return setting === "on";
}
