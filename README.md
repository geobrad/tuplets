# TupleTS

TupleTS implements tuples and structs with shallow equality and identity semantics in TypeScript/JavaScript. It is designed to be tiny, fast, and memory-safe.

- **Equality and Identity Semantics (`===` & `Object.is()`)**: Identical tuples and structs map to the same instance in memory.
- **Composite Keys for `Set` and `Map`**: Use tuples or structs as keys without serialization or hashing workarounds.
- **Memory-Safe**: No memory leaks ever due to advanced integration with garbage collection.
- **Deeply Nestable & Immutable**: Tuples and structs can contain other tuples and structs.
- **TypeScript First**: Full type inference.
- **Customisable Sub-types**: Easily create your own custom tuple and struct sub-types.
- **Zero Dependencies**: Lightweight implementation with fast hashing and no dependencies.

---

## Installation

```bash
npm install tuple-ts
```

---

## Usage Examples

### 1. Basic Tuples, Identity and Equality

Tuples with the same elements evaluate to the exact same object reference:

```ts
import { tuple } from "tuple-ts";

const a = tuple(1, "hello", true);
const b = tuple(1, "hello", true);

console.log(a === b); // true
console.log(Object.is(a, b)); // true

// Tuples are standard frozen arrays:
console.log(a[0]);  // 1
console.log(a.length);  // 3
console.log([...a]);  // [1, "hello", true]
console.log(Object.isFrozen(a));  // true
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

### 4. Custom Typed Tuples

You can easily create custom tuple sub-types:

```ts
import { tuple } from "tuple-ts";

type Point2D = [x: number, y: number];
const Point2D = tuple<Point2D>;

const p1 = Point2D(12, 34);
const p2 = Point2D(12, 34);

console.log(p1 === p2); // true
console.log(Object.is(p1, p2)); // true
```

### 5. Structs

Structs with the same keys and values evaluate to the exact same frozen object reference:

```ts
import { struct } from "tuple-ts";

const userA = struct({ id: 1, role: "admin" });
const userB = struct({ role: "admin", id: 1 }); // different key order

console.log(userA === userB); // true
console.log(Object.is(userA, userB)); // true
console.log(userA.role); // "admin"
console.log(Object.isFrozen(userA)); // true
```

### 6. Custom Typed Structs

As with tuples, you can easily create custom struct sub-types:

```ts
import { struct } from "tuple-ts";

interface User {
  id: string;
  name: string;
  updatedAt: number;
}
const User = struct<User>;

const user1 = User({ id: "alice", name: "Alice", updatedAt: 1000 });
const user2 = User({ name: "Alice", id: "alice", updatedAt: 1000 });

console.log(user1 === user2); // true
console.log(user1.name); // "Alice"
```

### 7. Memory Safety & Garbage Collection

TupleTS uses `WeakRef` and `FinalizationRegistry` under the hood. When a tuple or struct is no longer referenced anywhere in your program, the JavaScript runtime garbage-collects it, and its entry in the intern cache is automatically pruned.

```ts
// No need to manually clear caches or worry about memory leaks.
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
- Object elements are compared by object instance identity:
  ```ts
  const shared = { value: 1 };
  tuple(shared) === tuple(shared); // true
  tuple({}) !== tuple({});         // true (different object instances)
  ```
