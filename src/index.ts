import InternCache from "./intern-cache";
export { InternCache };
import * as hash from "./hash";

export type TupleType<T extends readonly unknown[]> = (...t: T) => Readonly<T>;
export type RecordType<T extends Record<string, unknown>> = (
  r: T,
) => Readonly<T>;

export const _tupleCache = new InternCache<number, readonly unknown[]>(
  hash.tupleHash,
  arrayEquivalent,
);
export const _recordCache = new InternCache<number, Record<string, unknown>>(
  hash.recordHash,
  recordEquivalent,
);

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

function recordEquivalent(
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

export const tuple = <const T_ extends readonly unknown[]>(...t: T_) =>
  Object.freeze(_tupleCache.get(t));

export const record = <const T_ extends Record<string, unknown>>({
  ...r
}: T_): T_ => Object.freeze(_recordCache.get(r));

export const defineTupleType =
  <T extends readonly unknown[]>(): TupleType<T> =>
  (...t: T) =>
    tuple(...t) as Readonly<T>;

export const defineRecordType =
  <T extends Record<string, unknown>>(): RecordType<T> =>
  (r: T) =>
    record(r);
