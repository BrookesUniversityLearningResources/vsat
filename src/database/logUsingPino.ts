import type { ErrorLogEvent, Logger } from "kysely";
import type pino from "pino";

import type { DatabaseLogConfig } from "../environment/config.js";

const logNothing: Logger = () => void 0;

type ErrorLogger = (e: ErrorLogEvent) => void;

export default function logUsingPino(
  log: pino.Logger,
  config: DatabaseLogConfig,
): Logger {
  const logQuery: Logger = config.query
    ? (event) => log.trace({ event }, "Query")
    : logNothing;

  const logError: ErrorLogger = config.error
    ? (event) => log.trace({ err: event.error, event }, "Error")
    : logNothing;

  return (event) => {
    switch (event.level) {
      case "query": {
        logQuery(event);
        break;
      }

      case "error": {
        logError(event);
        break;
      }

      default:
        ((_: never) => _)(event);
    }
  };
}
