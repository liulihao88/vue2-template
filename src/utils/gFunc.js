export function sleep(delay = 0, fn) {
  return new Promise((resolve) =>
    setTimeout(() => {
      fn?.();
      resolve();
    }, delay)
  );
}
