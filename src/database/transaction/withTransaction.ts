import { AsyncLocalStorage } from "node:async_hooks";

import type { Kysely } from "kysely";
import type { Logger } from "pino";

/**
 * Add transactional behaviour to asynchronous data-accessing functions.
 *
 * If the function is applied when there's no existing transaction in * progress
 * then a new transaction will be started and the wrapped function will be
 * applied in the context of that new transaction.
 *
 * If the function is applied when there *is* an existing transaction in
 * progress then the wrapped function will be applied in the context of the
 * existing transaction.
 *
 * Note that _currently_ there's no way to change the
 * [isolation level](https://kysely-org.github.io/kysely-apidoc/classes/TransactionBuilder.html#setIsolationLevel)
 * of transactions started/joined in this manner.
 *
 * @param log used to log the transaction lifecycle.
 * @param db used to access the Kysely instance.
 * @param storage transactions will be stored here.
 * @param thisArg an (optional) binding for the (wrapped) function.
 * @returns a tuple of the functional combinator and a function to access the
 * (storage-based) Kysely instance.
 * @see https://kysely.dev/docs/category/transactions
 */
export default function withTransaction<Database>(
  log: Logger,
  db: Kysely<Database>,
  storage: AsyncLocalStorage<Kysely<Database>> = new AsyncLocalStorage<
    Kysely<Database>
  >(),
  thisArg = null,
): [typeof transactional, typeof getDatabase] {
  const getDatabase = () => storage.getStore() ?? db;

  function transactional<
    F extends (
      // biome-ignore lint/suspicious/noExplicitAny: it's fine here
      ...args: any[]
      // biome-ignore lint/suspicious/noExplicitAny: it's fine here
    ) => ReturnType<F> extends Promise<any> ? ReturnType<F> : never,
  >(fn: F): (...args: Parameters<F>) => ReturnType<F> {
    return (...args) => {
      const action = () => fn.apply(thisArg, args);

      const db = getDatabase();

      if (db.isTransaction) {
        log.trace({ name: fn.name }, "Running in existing transaction");
        return action();
      }

      log.trace({ name: fn.name }, "Running in new transaction");
      return db
        .transaction()
        .execute((tx) => storage.run(tx, action)) as ReturnType<F>;
    };
  }

  return [transactional, getDatabase];
}
