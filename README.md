# TupleTS

TupleTS is an implementation of interned tuples and records intended to be memory-safe, performant, and tiny.

- **Referential Equality (`===`)**: Identical tuples and records return the same instance in memory.
- **Composite Keys for `Set` & `Map`**: Use tuples or records as keys without custom serialization or hashing workarounds.
- **Memory-Safe**: Uses `WeakRef` and `FinalizationRegistry` to automatically purge entries upon garbage collection.
- **Deeply Nestable & Immutable**: Tuples can contain other tuples; all created tuples and records are `Object.freeze`'d.
- **TypeScript First**: Full type inference and type-safe factories.
- **Zero Dependencies**: Lightweight implementation with fast MurmurHash3-based hashing.

---

## Installation

```bash
npm install tuple-ts
```

---

## Usage Examples

### 1. Basic Tuples & Referential Equality

Tuples with the same elements evaluate to the exact same object reference (`===`):

```ts
import { tuple } from "tuple-ts";

const a = tuple(1, "hello", true);
const b = tuple(1, "hello", true);

console.log(a === b); // true

// Tuples are standard frozen arrays:
console.log(a[0]);        // 1
console.log(a.length);    // 3
console.log([...a]);      // [1, "hello", true]
```

### 2. Nested Tuples

Tuples can be nested arbitrarily and maintain referential equality across structures:

```ts
import { tuple } from "tuple-ts";

const t1 = tuple("matrix", tuple(1, 0), tuple(0, 1));
const t2 = tuple("matrix", tuple(1, 0), tuple(0, 1));
const t3 = tuple("matrix", tuple(1, 1), tuple(0, 1));

console.log(t1 === t2); // true
console.log(t1 === t3); // false
```

### 3. Composite Keys in `Map` and `Set`

In standard JavaScript, arrays and objects compare by reference, preventing them from being used as composite keys in `Map` or values in `Set`. With `tuple`, structural equality makes composite keys work seamlessly:

```ts
import { tuple } from "tuple-ts";

// Set: Deduplicating coordinate pairs
const visited = new Set();
visited.add(tuple(10, 20));

console.log(visited.has(tuple(10, 20))); // true!
console.log(visited.has(tuple(10, 21))); // false

// Map: Multi-argument function memoization / 2D grid
const grid = new Map();
grid.set(tuple(0, 0), "Origin");
grid.set(tuple(3, 4), "Target");

console.log(grid.get(tuple(0, 0))); // "Origin"
console.log(grid.get(tuple(3, 4))); // "Target"
```

### 4. Custom Typed Tuples (`tupleType`)

You can create isolated, strictly-typed tuple factories with their own independent intern caches:

```ts
import { tupleType } from "tuple-ts";

type Point2D = [x: number, y: number];
const Point = tupleType<Point2D>();

const p1 = Point(12, 34);
const p2 = Point(12, 34);

console.log(p1 === p2); // true
```

### 5. Interned Records (`record`)

Just like tuples, `record` interns shallow objects. Property key insertion order does not affect equality:

```ts
import { record } from "tuple-ts";

const userA = record({ id: 1, role: "admin" });
const userB = record({ role: "admin", id: 1 }); // different key order

console.log(userA === userB); // true
console.log(userA.role);      // "admin"
```

### 6. Keyed Records (`recordType().withKeys(...)`)

Define records interned and deduplicated on a specific subset of primary keys:

```ts
import { recordType } from "tuple-ts";

interface UserProfile {
  id: string;
  name: string;
  updatedAt: number;
}

// Only 'id' determines record identity
const UserById = recordType<UserProfile>().withKeys("id");

const session1 = UserById({ id: "usr_1", name: "Alice", updatedAt: 1000 });
const session2 = UserById({ id: "usr_1", name: "Alice B.", updatedAt: 2000 });

console.log(session1 === session2); // true
console.log(session1);              // { id: "usr_1" }
```

### 7. Memory Safety & Garbage Collection

TupleTS uses `WeakRef` and `FinalizationRegistry` under the hood. When a tuple or record is no longer referenced anywhere in your program, the JavaScript runtime garbage-collects it, and its entry in the intern cache is automatically pruned.

```ts
// No need to manually clear caches or worry about memory leaks!
{
  const temp = tuple("transient", 123);
  // once 'temp' leaves scope and GC runs, the intern cache entry is freed.
}
```

---

## Equality Semantics

TupleTS compares primitives via `Object.is`:
- `NaN` is equivalent to `NaN` (`tuple(NaN) === tuple(NaN)`).
- `+0` and `-0` are treated as distinct values (`tuple(+0) !== tuple(-0)`).
- Object elements are interned by object identity:
  ```ts
  const shared = { value: 1 };
  tuple(shared) === tuple(shared); // true
  tuple({}) === tuple({});         // false (different object references)
  ```
