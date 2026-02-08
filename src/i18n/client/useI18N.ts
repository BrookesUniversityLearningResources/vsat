"use client";

import i18n, { type Resource, type ResourceKey } from "i18next";
import { useMemo } from "react";

const LOCALE_DEFAULT = "en";

/**
 * Create an internationalization (I18N) instance for the **client-side**.
 */
export default function useI18N(
  resources: Record<string, ResourceKey>,
  locale = LOCALE_DEFAULT,
  namespace = "translation",
) {
  return useMemo(
    () => createI18N(resources, locale ?? LOCALE_DEFAULT, namespace),
    [resources, locale, namespace],
  );
}

/**
 * Not public API: exposed for testing purposes only.
 */
export function createI18N(
  resources: Record<string, ResourceKey>,
  locale = LOCALE_DEFAULT,
  namespace = "translation",
) {
  const namespacedResources = Object.entries(resources).reduce(
    (all, [otherLocale, resource]) => {
      all[otherLocale] = {
        [namespace]: resource,
      };

      return all;
    },
    {} as Resource,
  );

  return i18n.createInstance(
    {
      lng: locale,
      fallbackLng: LOCALE_DEFAULT,
      preload: [locale, LOCALE_DEFAULT],
      supportedLngs: [locale, LOCALE_DEFAULT],
      react: { useSuspense: false },
      resources: namespacedResources,
      interpolation: {
        escapeValue: false,
      },
      showSupportNotice: false,
    },
    (err) => {
      if (err) {
        console.warn(err);
      }
    },
  );
}
