import type { RequestHandler } from "express";

function staticHeadersMiddleware(
  headers: Headers | Map<string, number | string | readonly string[]>,
): RequestHandler {
  return (_req, res, next) => {
    res.setHeaders(headers);

    return next();
  };
}

export default staticHeadersMiddleware;

export const headersToEnableSharedArrayBufferUsage: Map<
  string,
  number | string | readonly string[]
> = new Map([
  ["Cross-Origin-Embedder-Policy", "require-corp"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
]);

/**
 * Routes that must NOT be cross-origin isolated: they embed the Magic iframe
 * (https://auth.magic.link), which sends no Cross-Origin-Resource-Policy /
 * Cross-Origin-Embedder-Policy header and so is blocked under COEP
 * `require-corp` (Firefox: NS_ERROR_DOM_COEP_FAILED).
 *
 * Everything else stays isolated by default, because downstream forks rely on
 * `SharedArrayBuffer` being available. Leave isolated pages via a full page
 * navigation; never load Magic from one.
 */
export const routesWithoutCrossOriginIsolation: readonly string[] = ["/login"];

function isExemptFromCrossOriginIsolation(path: string): boolean {
  return routesWithoutCrossOriginIsolation.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Middleware that adds headers to the response so that `SharedArrayBuffer`s
 * can be used, except on {@link routesWithoutCrossOriginIsolation}.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated}
 */
export function withHeadersToEnableSharedArrayBufferUsage(): RequestHandler {
  const addHeaders = staticHeadersMiddleware(
    headersToEnableSharedArrayBufferUsage,
  );

  return (req, res, next) =>
    isExemptFromCrossOriginIsolation(req.path)
      ? next()
      : addHeaders(req, res, next);
}
