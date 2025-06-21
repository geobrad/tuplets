import HashCache from "./hash-cache";
export type Tuple<T extends readonly unknown[] = readonly unknown[]> = T;

function murmurHash3Mix_32bit(keys: number[], seed = 0): number {
  // The first (i.e., mixing) stage of the MurmurHash3 algorithm for 32-bit keys
  let hash = seed;
  for (const key of keys) {
    let k = Math.imul(key, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17); // ROTL32(k1, 15)
    k = Math.imul(k, 0x1b873593);
    hash ^= k;
    hash = (hash << 13) | (hash >>> 19); // ROTL32(h1, 13);
    hash = Math.imul(hash, 5) + 0xe6546b64;
  }
  hash ^= keys.length * 4; // number of input bytes
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

const objectHashMap = new WeakMap<object, number>();

function stableRandomHash(
  map: WeakMap<object, number>,
  value: object | symbol
): number {
  if (value === null) return nullHash;
  const hash = map.get(value as object);
  if (hash !== undefined) return hash;
  const newHash = randomUint32();
  map.set(value as object, newHash);
  return newHash;
}

function stringToUint32s(value: string): number[] {
  const uint32s = [];
  for (let i = 0; i < value.length; i += 2) {
    const char1 = value.charCodeAt(i);
    const char2 = value.charCodeAt(i + 1);
    uint32s.push((char2 << 16) | char1);
  }
  return uint32s;
}

function numberToUint32s(value: number): number[] {
  const buffer = new ArrayBuffer(8); // 8 bytes = 64 bits
  const view = new DataView(buffer);
  const adjustedValue = value === -0 ? 0 : value; // Ensure +0 and -0 give the same result
  view.setFloat64(0, adjustedValue);
  return [view.getUint32(0), view.getUint32(4)];
}

function bigIntToUint32s(value: bigint): number[] {
  const BASE = 2n ** 32n;
  const uint32s = [];
  for (let n = value; n !== 0n; n /= BASE) {
    uint32s.push(Number(((n % BASE) + BASE) % BASE)); // Safely non-negative
  }
  return uint32s;
}

function valueToUint32s(value: unknown): number[] {
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
  return murmurHash3Mix_32bit(uint32s, seed);
}

export const tupleCache = new HashCache<number, Tuple>(
  (t) => getTupleHash(t, tupleSeed),
  allEquivalent
);

export function tuple<T extends unknown[]>(...args: T): Tuple<T> {
  Object.freeze(args);
  return tupleCache.get<T>(args);
}

function allEquivalent(a1: Tuple, a2: Tuple): boolean {
  if (a2.length !== a1.length) return false;
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] === 0 && a2[i] === 0) continue; // Consider +0 and -0 to be equivalent
    if (!Object.is(a2[i], a1[i])) return false; // Consider NaN to be equivalent to itself despite NaN !== NaN
  }
  return true;
}
