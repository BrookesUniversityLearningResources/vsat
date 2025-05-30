import type { ErrorCode } from "@domain/error/errorCode";

export default function translationKeyFor(code: ErrorCode): string {
  return `scene.fiction.error.code.${code}`;
}
