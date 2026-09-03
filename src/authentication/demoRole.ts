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
