/** A choice function over options — deterministic variants are injected in tests. */
export type Selector<T> = (options: T[]) => T;

/** Uniform random selector. */
export function randomSelect<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/** Fisher–Yates shuffle producing a new array. */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
