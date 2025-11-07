/** biome-ignore-all lint/suspicious/noExplicitAny: any is fine here because we're typing generically */

export default function debounce<F extends (...args: any[]) => any>(
  fn: F,
  timeout = 300,
): (...args: Parameters<F>) => ReturnType<F> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return (...args) => {
    if (!timer) {
      return fn.apply(null, args);
    }

    clearTimeout(timer);

    timer = setTimeout(() => {
      timer = undefined;
    }, timeout);
  };
}
