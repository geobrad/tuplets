const UINT32_BASE = 2n ** 32n;

function murmurHash3Mix_32bit(keys: Iterable<number>, seed = 0): number {
  // The first (i.e., mixing) stage of the MurmurHash3 algorithm for 32-bit keys
  let hash = seed;
  let keyCount = 0;
  for (const key of keys) {
    keyCount++;
    let k = Math.imul(key, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17); // ROTL32(k1, 15)
    k = Math.imul(k, 0x1b873593);
    hash ^= k;
    hash = (hash << 13) | (hash >>> 19); // ROTL32(h1, 13);
    hash = Math.imul(hash, 5) + 0xe6546b64;
  }
  hash ^= keyCount * 4; // number of input bytes
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
const recordSeed = randomUint32();
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
  map: WeakMap<object | symbol, number>,
  value: object | symbol
): number {
  if (value === null) return nullHash;
  const hash = map.get(value);
  if (hash !== undefined) return hash;
  const newHash = randomUint32();
  map.set(value, newHash);
  return newHash;
}

function* stringToUint32s(value: string): Generator<number> {
  for (let i = 0; i < value.length; i += 2) {
    const char1 = value.charCodeAt(i);
    const char2 = value.charCodeAt(i + 1);
    yield (char2 << 16) | char1;
  }
}

function* numberToUint32s(value: number): Generator<number> {
  const buffer = new ArrayBuffer(8); // 8 bytes = 64 bits
  const view = new DataView(buffer);
  view.setFloat64(0, value);
  yield view.getUint32(0);
  yield view.getUint32(4);
}

function* bigIntToUint32s(value: bigint): Generator<number> {
  for (let n = value; n !== 0n; n /= UINT32_BASE) {
    yield Number(((n % UINT32_BASE) + UINT32_BASE) % UINT32_BASE); // Safely non-negative
  }
}

function valueHash(value: unknown): number {
  switch (typeof value) {
    case "string":
      return mixHashes(stringToUint32s(value), stringSeed);
    case "number":
      return mixHashes(numberToUint32s(value), numberSeed);
    case "bigint":
      return mixHashes(bigIntToUint32s(value), bigIntSeed);
    case "boolean":
      return value ? trueHash : falseHash;
    case "symbol":
      const k = Symbol.keyFor(value);
      return k === undefined
        ? stableRandomHash(objectHashMap, value)
        : mixHashes(stringToUint32s(k), registeredSymbolSeed);
    case "undefined":
      return undefinedHash;
    case "object":
      return value === null ? nullHash : stableRandomHash(objectHashMap, value);
    case "function":
      return stableRandomHash(objectHashMap, value);
  }
}

const mixHashes = murmurHash3Mix_32bit;

function* valueHashes(values: Iterable<unknown>): Generator<number> {
    for (const v of values) {
        yield valueHash(v);
    }
}

export function tupleHash(elements: readonly unknown[]): number {
    return mixHashes(valueHashes(elements), tupleSeed);
}

function* keyAndValueHashes(record: Record<string, unknown>): Generator<number> {
    for (const key of Object.keys(record).sort()) {
        yield valueHash(key);
        yield valueHash(record[key]);
    }
}

export function recordHash(record: Record<string, unknown>): number {
  return mixHashes(
    keyAndValueHashes(record),
    recordSeed
  );
}
