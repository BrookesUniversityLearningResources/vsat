const MAX_CHARS_PER_LINE = 50;

export default function countLines(
  text: string,
  max_chars_per_line = MAX_CHARS_PER_LINE,
): number {
  const wrappedLines = Math.max(Math.ceil(text.length / max_chars_per_line), 1);

  const newLines = text.trim().split("\n").length;

  return wrappedLines + (newLines - 1);
}
