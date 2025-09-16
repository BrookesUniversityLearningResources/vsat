import type { ResourceKey, i18n } from "i18next";

const LOCALE_DEFAULT = "en";

type TranslationsForPageRequest = {
  page: string;
  locale?: string | undefined;
  namespace?: string | undefined;
};

export type TranslationsForPage = Record<string, ResourceKey>;

export type GetTranslationsForPage = (
  request: TranslationsForPageRequest,
) => TranslationsForPage;

/**
 * Get *just* the subset of translations needed for the specific page.
 */
export default function getTranslationsForPage(
  i18n: i18n,
): GetTranslationsForPage {
  return (
    { page, locale = LOCALE_DEFAULT, namespace = "translation" },
    fallbackLocale = LOCALE_DEFAULT,
  ) => {
    let fallbackTranslations: TranslationsForPage | undefined;
    try {
      fallbackTranslations = getTranslations(i18n, {
        page,
        locale: fallbackLocale ?? LOCALE_DEFAULT,
        namespace,
      });
    } catch {
      // no fallback *shrug*
    }

    let localeTranslations: TranslationsForPage | undefined;

    try {
      localeTranslations = getTranslations(i18n, { page, locale, namespace });

      return {
        [locale]: localeTranslations,

        // include any fallback
        ...(fallbackTranslations
          ? { [fallbackLocale ?? LOCALE_DEFAULT]: fallbackTranslations }
          : {}),
      };
    } catch {
      if (!fallbackTranslations) {
        return {};
      }

      return {
        [locale]: fallbackTranslations,
      };
    }
  };
}

const KEY_COMMON_TRANSLATIONS = "__common__";

function getTranslations(
  i18n: i18n,
  {
    page,
    locale = LOCALE_DEFAULT,
    namespace = "translation",
  }: TranslationsForPageRequest,
): TranslationsForPage {
  if (!i18n.hasResourceBundle(locale, namespace)) {
    throw new Error(`No resource bundle found for "${locale}.${namespace}"`);
  }

  const resourceBundle = i18n.getResourceBundle(locale, namespace);

  if (!resourceBundle.page) {
    throw new Error(
      `There are no translations under "${locale}.${namespace}.page"`,
    );
  }

  const translations = resourceBundle.page[page];

  if (!translations) {
    throw new Error(
      `There are no translations under "${locale}.${namespace}.page.${page}"`,
    );
  }

  const common = resourceBundle[KEY_COMMON_TRANSLATIONS] ?? {};

  return {
    /* global commons first so that in the event of page-specific commons they'll override these */ common,
    ...translations,
  };
}
