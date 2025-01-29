import assert from "node:assert/strict";
import { describe, test } from "node:test";

import i18next from "i18next";

import getTranslationsForPage from "@i18n/getTranslationsForPage.js";

describe("getTranslationsForPage", () => {
  test("given existing translations for 'af/translation/home'" +
    " when we get the 'af' translations for the page 'home' in the namespace 'novels'" +
    " then the translations include ones for both 'af' and the fallback of 'en'", () => {
    const currentLocale = "af";
    const fallbackLocale = "en";
    const namespaceName = "novels";
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          af: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela se kind",
                },
              },
            },
          },
          en: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela's child",
                },
              },
            },
          },
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
      locale: currentLocale,
      namespace: namespaceName,
    });

    assert.deepStrictEqual(translations, {
      af: { title: "Fiela se kind", common: {} },
      en: { title: "Fiela's child", common: {} },
    });
  });

  test("given existing translations for 'af/translation/home'" +
    " when we get the 'af' translations for the page 'home' in the default namespace 'translation'" +
    " then the translations include ones for both 'af' and the fallback of 'en'", () => {
    const currentLocale = "af";
    const fallbackLocale = "en";
    const namespaceName = "translation"; // ⬅️ this is the default namespace
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          af: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela se kind",
                },
              },
            },
          },
          en: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela's child",
                },
              },
            },
          },
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
      locale: currentLocale,
      /* using the default namespace */
    });

    assert.deepStrictEqual(translations, {
      af: { title: "Fiela se kind", common: {} },
      en: { title: "Fiela's child", common: {} },
    });
  });

  test("given existing translations for 'en/translation/home'" +
    " when we get the 'en' translations for the page 'home' in the default namespace 'translation'" +
    " then the translations includes only those for 'en' ('en' being the default fallback)", () => {
    const currentLocale = "en"; // ⬅️ this is the default namespace
    const fallbackLocale = "en";
    const namespaceName = "translation"; // ⬅️ this is the default namespace
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          af: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela se kind",
                },
              },
            },
          },
          en: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela's child",
                },
              },
            },
          },
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
      /* using the default locale and namespace */
    });

    assert.deepStrictEqual(translations, {
      en: { title: "Fiela's child", common: {} },
    });
  });

  test("given no existing translations for 'en/translation/home'" +
    " when we get the 'en' translations for the page 'home' in the default namespace 'translation'" +
    " then an empty translations is returned", () => {
    const currentLocale = "en";
    const fallbackLocale = "en";
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          /* no resources at all */
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
    });

    assert.deepStrictEqual(translations, {
      /* empty */
    });
  });

  test("given existing translations for 'en/translation/home'" +
    " and existing 'common' translations" +
    " when we get the 'en' translations for the page 'home' in the default namespace 'translation'" +
    " then the translations includes only those for 'en' ('en' being the default fallback)" +
    " and the global 'common' translations", () => {
    const currentLocale = "en"; // ⬅️ this is the default namespace
    const fallbackLocale = "en";
    const namespaceName = "translation"; // ⬅️ this is the default namespace
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          af: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela se kind",
                },
              },
            },
          },
          en: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela's child",
                },
              },
              __common__: {
                loading: "General loading blurb",
              },
            },
          },
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
      /* using the default locale and namespace */
    });

    assert.deepStrictEqual(translations, {
      en: {
        title: "Fiela's child",
        common: { loading: "General loading blurb" },
      },
    });
  });

  test("given existing translations for 'en/translation/home'" +
    " and existing 'common' translations" +
    " when we get the 'en' translations for the page 'home' in the default namespace 'translation'" +
    " then the translations includes only those for 'en' ('en' being the default fallback)" +
    " and the page's 'common' translations override the global 'common' translations", () => {
    const currentLocale = "en"; // ⬅️ this is the default namespace
    const fallbackLocale = "en";
    const namespaceName = "translation"; // ⬅️ this is the default namespace
    const pageName = "home";

    const i18n = i18next.createInstance(
      {
        lng: currentLocale,
        fallbackLng: fallbackLocale,
        supportedLngs: [currentLocale, fallbackLocale],
        resources: {
          af: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela se kind",
                },
              },
            },
          },
          en: {
            [namespaceName]: {
              page: {
                [pageName]: {
                  title: "Fiela's child",
                  common: {
                    loading: "Page-specific loading blurb",
                  },
                },
              },
              __common__: {
                loading: "General loading blurb",
              },
            },
          },
        },
      },
      (err) => {
        if (err) {
          assert.fail(err);
        }
      },
    );

    const translations = getTranslationsForPage(i18n)({
      page: pageName,
      /* using the default locale and namespace */
    });

    assert.deepStrictEqual(translations, {
      en: {
        title: "Fiela's child",
        common: { loading: "Page-specific loading blurb" },
      },
    });
  });
});
