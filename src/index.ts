import InternCache from "./intern-cache";
import * as hash from "./hash";

function arrayEquivalent(
  a1: readonly unknown[],
  a2: readonly unknown[],
): boolean {
  if (a2.length !== a1.length) return false;
  for (let i = 0; i < a1.length; i++) {
    if (!Object.is(a2[i], a1[i])) return false;
  }
  return true;
}

function structEquivalent(
  r1: Record<string, unknown>,
  r2: Record<string, unknown>,
): boolean {
  const r1Keys = Object.keys(r1);
  const r2Keys = Object.keys(r2);
  if (r2Keys.length !== r1Keys.length) return false;
  for (let i = 0; i < r1Keys.length; i++) {
    const k = r1Keys[i];
    if (!(k in r2)) return false;
    if (!Object.is(r2[k], r1[k])) return false;
  }
  return true;
}

export const _tupleCache = new InternCache<number, readonly unknown[]>(
  hash.valuesHash,
  arrayEquivalent,
);

export const _structCache = new InternCache<number, Record<string, unknown>>(
  (r) => hash.valuesHash(Object.entries(r).flat()),
  structEquivalent,
);

export const tuple = <const T extends readonly unknown[]>(...t: T) =>
  Object.freeze(_tupleCache.get(t));

export const struct = <const T extends Record<string, unknown>>({ ...r }: T) =>
  Object.freeze(_structCache.get(r));
