/**
 * Cookies behind the demo role bar (see `DemoRoleBar.astro`).
 *
 * The bar lets someone with no account look at VSAT as a steward, as an
 * ordinary author, or as a signed-out visitor. Steward-ness already rides on
 * `vsat_steward` (read by `isStewardUser`); this adds the signed-out case,
 * which has to be honoured by *every* place that attaches the dev bypass user
 * — the Express middleware and both Astro middlewares — or the role switch
 * silently does nothing on whichever surface was missed.
 */

const DEMO_ANON_COOKIE = "vsat_demo_anon";
const DEMO_AUTHOR_COOKIE = "vsat_demo_author";

export const demoRoleBarEnabled = (): boolean =>
  process.env.DEMO_ROLE_BAR === "1" || process.env.DEMO_ROLE_BAR === "true";

const readCookie = (
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined =>
  cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split("=")
    .at(1);

/**
 * True when this request asked to be treated as signed out. Only honoured
 * while the demo role bar is enabled, so it cannot affect a real deployment.
 */
export const wantsSignedOutPreview = (
  cookieHeader: string | null | undefined,
): boolean => {
  if (!demoRoleBarEnabled()) {
    return false;
  }

  const value = readCookie(cookieHeader, DEMO_ANON_COOKIE);
  return value === "1" || value === "true";
};

export type DemoIdentity = { email: string; name: string };

/**
 * The second demo author. Author 1 is whoever DEV_AUTH_BYPASS_EMAIL names, so
 * that the existing bypass identity keeps its stories; author 2 is a separate
 * account with a story list of its own, which is the point — switching between
 * them shows that authors see different work.
 */
export const secondDemoAuthor = (): DemoIdentity => ({
  email: process.env.DEMO_AUTHOR_2_EMAIL ?? "author2@vsat-dev.local",
  name: process.env.DEMO_AUTHOR_2_NAME ?? "Author Two",
});

/** True when this request asked to be the second demo author. */
export const wantsSecondAuthor = (
  cookieHeader: string | null | undefined,
): boolean =>
  demoRoleBarEnabled() && readCookie(cookieHeader, DEMO_AUTHOR_COOKIE) === "2";

/** The identity the dev bypass should attach for this request. */
export const demoIdentityFor = (
  cookieHeader: string | null | undefined,
  fallback: DemoIdentity,
): DemoIdentity =>
  wantsSecondAuthor(cookieHeader) ? secondDemoAuthor() : fallback;
