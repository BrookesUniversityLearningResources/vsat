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
 * Middleware that adds headers to the response so that `SharedArrayBuffer`s
 * can be used.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated}
 */
export function withHeadersToEnableSharedArrayBufferUsage(): RequestHandler {
  return staticHeadersMiddleware(headersToEnableSharedArrayBufferUsage);
}
