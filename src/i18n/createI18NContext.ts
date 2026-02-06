import type { InitOptions, TFunction, i18n } from "i18next";
import i18next from "i18next";
import FsBackend, { type FsBackendOptions } from "i18next-fs-backend";

import type { GetTranslationsForPage } from "./getTranslationsForPage.js";
import getTranslationsForPage from "./getTranslationsForPage.js";
import type { HasSupportForLocale } from "./hasSupportForLocale.js";
import hasSupportForLocale from "./hasSupportForLocale.js";

export type I18NContext = Readonly<{
  i18n: i18n;
  t: TFunction;
  getTranslationsForPage: GetTranslationsForPage;
  hasSupportFor: HasSupportForLocale;
}>;

export default function createI18NContext(i18n: i18n): I18NContext {
  initializeI18n();

  return Object.freeze({
    i18n,
    t: i18n.t.bind(i18n),
    getTranslationsForPage: getTranslationsForPage(i18n),
    hasSupportFor: hasSupportForLocale(i18n),
  });
}

const LOCALE_DEFAULT = "en";

function initializeI18n(overrides: Partial<InitOptions> = {}) {
  const options: InitOptions = {
    fallbackLng: LOCALE_DEFAULT,
    preload: [LOCALE_DEFAULT, "pt-BR"],
    supportedLngs: [LOCALE_DEFAULT, "pt-BR"],
    initImmediate: false, // eagerly—and synchronously—load the translations
    backend: {
      loadPath: "src/i18n/locales/{{lng}}/{{ns}}.json",
    },
    showSupportNotice: false,
    ...overrides,
  };

  return i18next.use(FsBackend).init<FsBackendOptions>(options, (err) => {
    if (err) {
      throw new Error("Error initializing i18n", { cause: err });
    }
  });
}
