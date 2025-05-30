import { type Descendant, Node } from "slate";

export default function getContent(nodes: Descendant[]): string {
  let content = nodes.map((n) => Node.string(n)).join("\n");

  if (!content.endsWith("\n")) {
    content = `${content}\n`;
  }

  return content;
}
