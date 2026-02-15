import type { RequestHandler } from "express";

const headersToEnableSharedArrayBuffer = new Map([
  ["Cross-Origin-Embedder-Policy", "require-corp"],
  ["Cross-Origin-Opener-Policy", "same-origin"],
]);

/**
 * Middleware that adds headers to the response so that `SharedArrayBuffer`s
 * can be used.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated}
 */
function enableSharedArrayBufferMiddleware(): RequestHandler {
  return (req, res, next) => {
    /*
     * We only want to enable SharedArayBuffer support
     * on the subset of pages that actually need it.
     */
    if (req.path.startsWith("/story") || req.path.endsWith("/preview")) {
      res.setHeaders(headersToEnableSharedArrayBuffer);
    }

    return next();
  };
}

export default enableSharedArrayBufferMiddleware;
