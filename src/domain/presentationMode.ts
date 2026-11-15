import { sql } from "kysely";
import type { GetDatabase } from "../database/schema.js";

export type PresentationMode = "both" | "360" | "2d";
export type GetPresentationMode = () => Promise<PresentationMode>;
export type SavePresentationMode = (
  mode: PresentationMode,
  by: string | null,
) => Promise<void>;

export function isPresentationMode(value: unknown): value is PresentationMode {
  return value === "both" || value === "360" || value === "2d";
}

export function resolvePresentationMode(
  stored: unknown,
  env: { presentation?: string; photospheres?: boolean },
): PresentationMode {
  if (isPresentationMode(stored)) return stored;
  if (isPresentationMode(env.presentation)) return env.presentation;
  return env.photospheres === false ? "2d" : "both";
}

export default function presentationModeInDatabase(
  db: GetDatabase,
  env: { presentation?: string; photospheres?: boolean },
  now: () => number = Date.now,
): {
  getPresentationMode: GetPresentationMode;
  savePresentationMode: SavePresentationMode;
} {
  let cached: { mode: PresentationMode; until: number } | undefined;
  let revision = 0;
  return {
    async getPresentationMode() {
      if (cached && now() < cached.until) return cached.mode;
      const observedRevision = revision;
      const row = await db()
        .selectFrom("siteSetting")
        .select("value")
        .where("key", "=", "presentation_mode")
        .executeTakeFirst();
      const mode = resolvePresentationMode(row?.value, env);
      // A read started before a save must not repopulate the invalidated cache.
      if (observedRevision === revision)
        cached = { mode, until: now() + 30_000 };
      return mode;
    },
    async savePresentationMode(mode, by) {
      if (!isPresentationMode(mode))
        throw new Error("Invalid presentation mode");
      await db()
        .insertInto("siteSetting")
        .values({
          key: "presentation_mode",
          value: mode,
          updatedBy: by,
        })
        .onConflict((oc) =>
          oc.column("key").doUpdateSet({
            value: mode,
            updatedBy: by,
            updatedAt: sql<Date>`now()`,
          }),
        )
        .execute();
      revision += 1;
      cached = undefined;
    },
  };
}
