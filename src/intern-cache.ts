export default class <H, T extends object> {
  private readonly map: Map<H, Set<WeakRef<T>>> = new Map();
  private readonly hashFn: (obj: T) => H;
  private readonly identityFn: (obj1: T, obj2: T) => boolean;
  private cleanupRegistry = new FinalizationRegistry(this.remove.bind(this));

  constructor(hashFn: (obj: T) => H, identityFn: (obj1: T, obj2: T) => boolean) {
    this.hashFn = hashFn;
    this.identityFn = identityFn;
  }

  private remove([hash, ref]: [H, WeakRef<T>]): void {
    const hashBucket = this.map.get(hash);
    if (hashBucket === undefined) throw new Error("Could not get tuple set");
    if (!hashBucket.delete(ref))
      throw new Error("Could not delete tuple WeakRef");
    if (hashBucket.size === 0) this.map.delete(hash);
  }

  get<U extends T>(obj: U): U {
    const hash = this.hashFn(obj);
    let hashBucket = this.map.get(hash);
    if (hashBucket !== undefined) {
      for (const ref of hashBucket) {
        const o = ref.deref();
        if (o && this.identityFn(o, obj)) return o as U;
      }
    } else {
      // This hash has no bucket. Create one.
      hashBucket = new Set();
      this.map.set(hash, hashBucket);
    }

    // Object is not in the cache. Add it and return it.
    const ref = new WeakRef<T>(obj);
    hashBucket.add(ref);
    this.cleanupRegistry.register(obj, [hash, ref]);
    return obj;
  }

  get size(): number {
    return [...this.map.entries()]
      .map(([_, b]) => b.size)
      .reduce((a, b) => a + b, 0);
  }
}
