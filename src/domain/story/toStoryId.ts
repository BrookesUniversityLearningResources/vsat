import type { PersistentStory } from "../index.js";

export default function toStoryId(
  value: string | undefined,
): PersistentStory["id"] | null {
  if (!value) {
    return null;
  }

  const maybeId = Number.parseInt(value, 10);

  if (Number.isNaN(maybeId)) {
    return null;
  }

  if (maybeId <= 0) {
    return null;
  }

  return maybeId;
}
