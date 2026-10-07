const BIGINT_UINT32_MASK = 0xffffffffn;

const float64Buffer = new Float64Array(1);
const uint32View = new Uint32Array(float64Buffer.buffer);

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
    hash = (Math.imul(hash, 5) + 0xe6546b64) | 0; // Bitwise OR to force 32-bit
  }
  hash ^= keyCount * 4; // number of input bytes
  return hash >>> 0; // unsigned
}

function linearCongruentialGenerator(seed: number = Date.now()) {
  let state = seed >>> 0; // Force to unsigned 32-bit
  return () => {
    // LCG constants from Numerical Recipes (good default)
    state = (state * 1664525 + 1013904223) >>> 0;
    return state;
  };
}

const randomUint32 = linearCongruentialGenerator();

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
const symbolHashMap = new WeakMap<symbol, number>();

function stableRandomHash<T extends object | symbol>(
  map: WeakMap<T, number>,
  value: T
): number {
  if (value === null) return nullHash;
  const hash = map.get(value);
  if (hash !== undefined) return hash;
  const newHash = randomUint32();
  map.set(value, newHash);
  return newHash;
}

function stringToUint32s(value: string): Array<number> {
  const result = Array(Math.ceil(value.length / 2) + 1);
  result[0] = value.length;
  for (let i = 0; i < value.length / 2; i += 1) {
    const char1 = value.charCodeAt(2 * i);
    const char2 = value.charCodeAt(2 * i + 1);
    result[i + 1] = (char2 << 16) | char1;
  }
  return result;
}

function numberToUint32s(value: number): Array<number> {
  float64Buffer[0] = Number.isNaN(value) ? NaN : value;
  return [uint32View[0], uint32View[1]];
}

function bigintToUint32s(value: bigint): number[] {
  const isNegative = value < 0n;
  let n = isNegative ? -value : value;
  const result: Array<number> = [isNegative ? 1 : 0];
  while (n !== 0n) {
    result.push(Number(n & BIGINT_UINT32_MASK));
    n >>= 32n;
  }
  return result;
}

function valueHash(value: unknown): number {
  switch (typeof value) {
    case "string":
      return mixHashes(stringToUint32s(value), stringSeed);
    case "number":
      return mixHashes(numberToUint32s(value), numberSeed);
    case "bigint":
      return mixHashes(bigintToUint32s(value), bigIntSeed);
    case "boolean":
      return value ? trueHash : falseHash;
    case "symbol":
      const k = Symbol.keyFor(value);
      return k === undefined
        ? stableRandomHash(symbolHashMap, value)
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

function valueHashes(values: Iterable<unknown>): Array<number> {
  return Array.from(values, valueHash);
}

export function tupleHash(elements: readonly unknown[]): number {
    return mixHashes(valueHashes(elements), tupleSeed);
}

function keyAndValueHashes(record: Record<string, unknown>): Array<number> {
    return Object.keys(record).sort().flatMap(key => [
        valueHash(key),
        valueHash(record[key])
    ]);
}

export function recordHash(record: Record<string, unknown>): number {
  return mixHashes(
    keyAndValueHashes(record),
    recordSeed
  );
}
