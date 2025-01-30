import type { NonEmptyArray } from "@util/nonEmptyArray";

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept
 */
export default function toAcceptExtensions(
  accept: NonEmptyArray<string>,
): string {
  return accept
    .map((extension) => extension.trim())
    .map((extension) => {
      if (extension.startsWith(".")) {
        return extension;
      }

      return `.${extension}`;
    })
    .join();
}
