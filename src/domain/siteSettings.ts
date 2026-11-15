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

export type InterpretiveLinks = "on" | "off";
export type SettingValues = {
  presentation_mode: PresentationMode;
  interpretive_links: InterpretiveLinks;
};
export type SettingKey = keyof SettingValues;
export type Setting<K extends SettingKey> = {
  value: SettingValues[K];
  source: "stored" | "deployment";
  updatedBy: string | null;
  updatedAt: Date | null;
};
export type SettingDefaults = {
  presentation?: string;
  photospheres?: boolean;
  interpretiveLinks?: string;
};
export function isSettingValue<K extends SettingKey>(
  key: K,
  value: unknown,
): value is SettingValues[K] {
  return key === "presentation_mode"
    ? isPresentationMode(value)
    : key === "interpretive_links" && (value === "on" || value === "off");
}
export function resolveInterpretiveLinks(
  stored: unknown,
  env?: string,
): InterpretiveLinks {
  if (stored === "on" || stored === "off") return stored;
  return env === "off" ? "off" : "on";
}

export default function siteSettingsInDatabase(
  db: GetDatabase,
  env: SettingDefaults,
  now: () => number = Date.now,
) {
  const cached = new Map<
    SettingKey,
    { setting: Setting<SettingKey>; until: number }
  >();
  let revision = 0;
  async function getSetting<K extends SettingKey>(key: K): Promise<Setting<K>> {
    const hit = cached.get(key);
    if (hit && now() < hit.until) return hit.setting as Setting<K>;
    const observedRevision = revision;
    const row = await db()
      .selectFrom("siteSetting")
      .select(["value", "updatedBy", "updatedAt"])
      .where("key", "=", key)
      .executeTakeFirst();
    const stored = row && isSettingValue(key, row.value);
    const setting = {
      value: stored
        ? row.value
        : key === "presentation_mode"
          ? resolvePresentationMode(undefined, env)
          : resolveInterpretiveLinks(undefined, env.interpretiveLinks),
      source: stored ? "stored" : "deployment",
      updatedBy: stored ? row.updatedBy : null,
      updatedAt: stored ? row.updatedAt : null,
    } as Setting<K>;
    if (revision === observedRevision)
      cached.set(key, { setting, until: now() + 30_000 });
    return setting;
  }
  async function saveSetting<K extends SettingKey>(
    key: K,
    value: SettingValues[K],
    by: string | null,
  ): Promise<void> {
    if (!isSettingValue(key, value)) throw new Error("Invalid site setting");
    await db()
      .insertInto("siteSetting")
      .values({ key, value, updatedBy: by })
      .onConflict((oc) =>
        oc
          .column("key")
          .doUpdateSet({ value, updatedBy: by, updatedAt: sql<Date>`now()` }),
      )
      .execute();
    revision++;
    cached.clear();
  }
  return {
    getSetting,
    saveSetting,
    getPresentationMode: async () =>
      (await getSetting("presentation_mode")).value,
    savePresentationMode: (mode: PresentationMode, by: string | null) =>
      saveSetting("presentation_mode", mode, by),
    getInterpretiveLinks: async () =>
      (await getSetting("interpretive_links")).value,
  };
}
export type SiteSettings = ReturnType<typeof siteSettingsInDatabase>;
