import { ErrorCodes, type ErrorCode } from "../../../../error/errorCode.js";
import { allLinksIn } from "../../allLinkables.js";
import type { HeaderAnonymous, HeaderNamed } from "../../parse/parseTypes.js";
import type { ParsedStory } from "../../parseStory.js";
import deriveLinkTarget, {
  deriveLinkTargetLeniently,
} from "../../support/deriveLinkTarget.js";

export type HeaderValidationResult =
  | HeaderNamed
  | HeaderAnonymous
  | HeaderIsInvalid;

export type HeaderIsInvalid = Readonly<{
  kind: "invalid";
  header: HeaderNamed | HeaderAnonymous;
  errorCode: ErrorCode;
  message: string;
}>;

function validateHeader(
  story: ParsedStory,
): (header: HeaderNamed | HeaderAnonymous) => HeaderValidationResult {
  const allLinks = allLinksIn(story.scenes);

  return (header) => {
    const linkName = deriveLinkTargetLeniently(
      header.kind === "headerNamed" ? header.name : deriveLinkTarget(header),
    );

    if (allLinks.has(linkName)) {
      return {
        kind: "invalid",
        header,
        errorCode: ErrorCodes.LinkNamesMustBeUnique,
        message: "Link names must be unique",
      } satisfies HeaderIsInvalid;
    }

    return header;
  };
}

export default validateHeader;
