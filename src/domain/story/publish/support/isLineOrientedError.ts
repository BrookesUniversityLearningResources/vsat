import type { ParseError } from "../parseStory.js";

export type LineOrientedError = Required<ParseError>;

/**
 * Is the supplied `error` one that is line-oriented?
 *
 * Some parse errors are line-oriented: there's something wrong with a specific
 * line of text.
 *
 * Some parse errors are not line-oriennted: for example, there's no content to
 * parse at all or the file doesn't event exist.
 *
 * This function allows us to discriminate between those two kinds of parse
 * errors.
 */
export default function isLineOrientedError(
  error: ParseError,
): error is LineOrientedError {
  return !!error.line;
}
