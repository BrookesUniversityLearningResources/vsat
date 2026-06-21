"use client";

import { Magic } from "magic-sdk";
import { safeReturnTo } from "../returnTo.js";
import authenticateWithServer from "./authenticateWithServer.js";

const LIFESPAN_IN_SECONDS = 2 /* hours */ * 60 * 60;

// https://magic.link/docs/api/client-side-sdks/web#loginwithmagiclink
async function authenticateWithServerUsingEmail(
  publicKey: string,
  email: string,
  returnTo?: string,
) {
  const magic = new Magic(publicKey);
  const callbackUrl = new URL("/login/callback", window.location.origin);
  callbackUrl.searchParams.set("returnTo", safeReturnTo(returnTo));

  const token = await magic.auth.loginWithMagicLink({
    email,
    redirectURI: callbackUrl.href,
    lifespan: LIFESPAN_IN_SECONDS,
  });

  if (!token) {
    throw new Error("No token received from login-with-magic-link");
  }

  return authenticateWithServer(token);
}

export default authenticateWithServerUsingEmail;
