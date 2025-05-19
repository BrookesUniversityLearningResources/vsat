import type { LinkTarget } from "@domain/story/publish/types.js";

export const EVENT_LINK_ACTIVATED = "linkactivated";

/**
 * Fired whenever the reader activates (clicks, gazes on, etc.) a link in the
 * story.
 *
 * The result of activating a link is that the reader navigates to the target of
 * the link. (They see a new scene / page.)
 */
export function linkActivatedEvent(link: LinkTarget): CustomEvent<LinkTarget> {
  return new CustomEvent<LinkTarget>(EVENT_LINK_ACTIVATED, { detail: link });
}
