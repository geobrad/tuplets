import InternCache from "./intern-cache";
export { InternCache };
import * as hash from "./hash";

export type Tuple<T extends readonly unknown[] = readonly unknown[]> = T;

export type TupleType<T extends Tuple = Tuple> = {
  (...t: T): T;
  _cache: InternCache<number, T>;
};

export type KeyedRecordType<
  R extends Record<string, unknown> = Record<string, unknown>
> = { (r: R): R; _cache: InternCache<number, R> };

export type RecordType<
  R extends Record<string, unknown> = Record<string, unknown>
> = KeyedRecordType<R> & {
  withKeys: <K extends readonly (keyof R)[]>(
    ...keys: K
  ) => KeyedRecordType<Pick<R, K[number]>>;
};

function arrayEquivalent(
  a1: readonly unknown[],
  a2: readonly unknown[]
): boolean {
  if (a2.length !== a1.length) return false;
  for (let i = 0; i < a1.length; i++) {
    if (!Object.is(a2[i], a1[i])) return false;
  }
  return true;
}

function recordEquivalent(
  r1: Record<string, unknown>,
  r2: Record<string, unknown>
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

export function tupleType<T extends Tuple>(): TupleType<T> {
  const _cache = new InternCache<number, T>(hash.tupleHash, arrayEquivalent);
  return Object.assign((...t: T) => Object.freeze(_cache.get(t)), {
    _cache,
  });
}

export function recordType<T extends Record<string, unknown>>(): RecordType<T> {
  const _cache = new InternCache<number, T>(hash.recordHash, recordEquivalent);
  return Object.assign(({ ...r }: T): T => Object.freeze(_cache.get(r)), {
    _cache,
    withKeys: <K extends readonly (keyof T)[]>(...keys: K) =>
      recordTypeToKeyedRecordType<T, K>(...keys),
  });
}

export const tuple = tupleType();
export const record = recordType();

type RecordToTuple<
  R extends Record<string, unknown>,
  K extends readonly (keyof R)[]
> = K extends readonly [
  infer Head extends keyof R,
  ...infer Tail extends readonly (keyof R)[]
]
  ? readonly [R[Head], ...RecordToTuple<R, Tail>]
  : [];

function recordToTuple<
  R extends Record<string, unknown>,
  K extends readonly (keyof R)[]
>(record: R, keys: K): RecordToTuple<R, K> {
  return keys.map((k) => record[k]) as RecordToTuple<R, K>;
}

function recordTypeToKeyedRecordType<
  R extends Record<string, unknown>,
  K extends readonly (keyof R)[]
>(...keys: K): KeyedRecordType<Pick<R, K[number]>> {
  const _cache = new InternCache<number, Pick<R, K[number]>>(
    (r) => hash.tupleHash(recordToTuple(r, keys)),
    (r1, r2) =>
      arrayEquivalent(recordToTuple(r1, keys), recordToTuple(r2, keys))
  );
  return Object.assign(
    (r: R): R => {
      const r_: Partial<R> = {};
      for (const k of keys) {
        r_[k] = r[k];
      }
      return Object.freeze(_cache.get(r_ as R));
    },
    { _cache }
  );
}
