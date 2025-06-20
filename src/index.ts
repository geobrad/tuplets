export type Tuple<T extends readonly unknown[] = readonly unknown[]> = T;
type TupleCache = Map<Hash, Set<WeakRef<Tuple>>>;
type TupleCacheCleanupRegistry = FinalizationRegistry<
  [TupleCache, Hash, WeakRef<Tuple>]
>;
type Hash = number;

function murmurHash3_32(keys: number[], seed = 0): number {
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  let hash = seed;

  for (let k1 of keys) {
    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17); // ROTL32(k1, 15)
    k1 = Math.imul(k1, c2);

    hash ^= k1;
    hash = (hash << 13) | (hash >>> 19); // ROTL32(h1, 13);
    hash = Math.imul(hash, 5) + 0xe6546b64;
  }

  hash ^= keys.length * 4; // number of input bytes

  // Finalization mix — avalanche
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;

  return hash >>> 0; // unsigned
}

function linearConguentialGenerator(seed: number = Date.now() >>> 0) {
  let state = seed >>> 0; // Force to unsigned 32-bit
  return () => {
    // LCG constants from Numerical Recipes (good default)
    state = (state * 1664525 + 1013904223) >>> 0;
    return state;
  };
}
const randomUint32 = linearConguentialGenerator();

const tupleSeed = randomUint32();
const nullHash = randomUint32();
const undefinedHash = randomUint32();
const falseHash = randomUint32();
const trueHash = randomUint32();
const numberSeed = randomUint32();
const bigIntSeed = randomUint32();
const stringSeed = randomUint32();
const registeredSymbolSeed = randomUint32();

const objectHashMap = new WeakMap<object, Hash>();

function stableRandomHash(
  map: WeakMap<object, Hash>,
  value: object | symbol
): Hash {
  if (value === null) return nullHash;
  const hash = map.get(value as object);
  if (hash !== undefined) return hash;
  const newHash = randomUint32();
  map.set(value as object, newHash);
  return newHash;
}

function stringToUint32s(value: string): Hash[] {
  const uint32s = [];
  for (let i = 0; i < value.length; i += 2) {
    const char1 = value.charCodeAt(i);
    const char2 = value.charCodeAt(i + 1);
    uint32s.push((char2 << 16) | char1);
  }
  return uint32s;
}

function numberToUint32s(value: number): Hash[] {
  const buffer = new ArrayBuffer(8); // 8 bytes = 64 bits
  const view = new DataView(buffer);
  view.setFloat64(0, value);
  return [numberSeed, view.getUint32(0), view.getUint32(4)];
}

function bigIntToUint32s(value: bigint): Hash[] {
  const BASE = 2n ** 32n;
  const uint32s = [];
  for (let n = value; n !== 0n; n /= BASE) {
    uint32s.push(Number(((n % BASE) + BASE) % BASE)); // Safely non-negative
  }
  return uint32s;
}

function valueToUint32s(value: unknown): Hash[] {
  switch (typeof value) {
    case "string":
      return [stringSeed, ...stringToUint32s(value as string)];
    case "number":
      return [numberSeed, ...numberToUint32s(value as number)];
    case "bigint":
      return [bigIntSeed, ...bigIntToUint32s(value as bigint)];
    case "boolean":
      return [value ? trueHash : falseHash];
    case "symbol":
      const k = Symbol.keyFor(value as symbol);
      return k === undefined
        ? [stableRandomHash(objectHashMap, value as symbol)]
        : [registeredSymbolSeed, ...stringToUint32s(k)];
    case "undefined":
      return [undefinedHash];
    case "object":
      return value === null
        ? [nullHash]
        : [stableRandomHash(objectHashMap, value as object)];
    case "function":
      return [stableRandomHash(objectHashMap, value as object)];
  }
}

function getTupleHash(t: Tuple, seed: number) {
  const uint32s = t.map(valueToUint32s).flat();
  return murmurHash3_32(uint32s, seed);
}

export const tupleCache: TupleCache = new Map<Hash, Set<WeakRef<Tuple>>>();
export const tupleCacheCleanupRegistry: TupleCacheCleanupRegistry =
  new FinalizationRegistry(removeTupleRefFromCache);

function getTupleFromCache<T extends Tuple>(
  cache: TupleCache,
  t: T
): T | undefined {
  const hash = getTupleHash(t, tupleSeed);
  const tupleSet = cache.get(hash);
  if (tupleSet === undefined) return undefined;
  for (const tRef of tupleSet) {
    const t_ = tRef.deref();
    if (t_ && allEqual(t_, t)) return t_ as T;
  }
  return undefined;
}

function addTupleToCache<T extends Tuple>(
  cache: TupleCache,
  cacheCleanupRegistry: TupleCacheCleanupRegistry,
  t: T
): void {
  const hash = getTupleHash(t, tupleSeed);
  let tupleSet = cache.get(hash);
  if (tupleSet === undefined) {
    tupleSet = new Set<WeakRef<Tuple>>();
    cache.set(hash, tupleSet);
  }
  const tRef = new WeakRef<Tuple>(t);
  tupleSet.add(tRef);
  cacheCleanupRegistry.register(t, [cache, hash, tRef]);
}

function removeTupleRefFromCache([cache, hash, tRef]: [
  TupleCache,
  number,
  WeakRef<Tuple>
]): void {
  // console.log("REMOVING FROM TUPLE CACHE");
  cleanupListeners.forEach((cb) => cb(cache, hash, tRef));
  const tupleSet = cache.get(hash);
  if (tupleSet === undefined) throw new Error("Could not get tuple set");
  if (!tupleSet.delete(tRef)) throw new Error("Could not delete tuple WeakRef");
  if (tupleSet.size === 0) cache.delete(hash);
}

export function tuple<T extends unknown[]>(...args: T): Tuple<T> {
  let t = getTupleFromCache(tupleCache, args);
  if (t !== undefined) return t;
  t = Object.freeze(args);
  addTupleToCache(tupleCache, tupleCacheCleanupRegistry, t);
  return t;
}

function allEqual(a1: readonly unknown[], a2: readonly unknown[]): boolean {
  if (a2.length !== a1.length) return false;
  for (let i = 0; i < a1.length; i++) {
    if (a2[i] !== a1[i]) return false;
  }
  return true;
}

const cleanupListeners = new Set<(cache: TupleCache, hash: Hash, tRef: WeakRef<Tuple>) => void>();
export function registerTupleCleanupListener(
  callback: (cache: TupleCache, hash: Hash, tRef: WeakRef<Tuple>) => void
): () => void {
  cleanupListeners.add(callback);
  return () => cleanupListeners.delete(callback);
}
