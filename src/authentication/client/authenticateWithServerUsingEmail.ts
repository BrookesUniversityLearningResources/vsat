"use client";

import { Magic } from "magic-sdk";

import authenticateWithServer from "./authenticateWithServer.js";

const LIFESPAN_IN_SECONDS = 2 /* hours */ * 60 * 60;

// https://magic.link/docs/api/client-side-sdks/web#loginwithmagiclink
async function authenticateWithServerUsingEmail(
  publicKey: string,
  email: string,
) {
  const magic = new Magic(publicKey);
  const token = await magic.auth.loginWithMagicLink({
    email,
    redirectURI: new URL("/login/callback", window.location.origin).href,
    lifespan: LIFESPAN_IN_SECONDS,
  });

  if (!token) {
    throw new Error("No token received from login-with-magic-link");
  }

  return authenticateWithServer(token);
}

export default authenticateWithServerUsingEmail;
