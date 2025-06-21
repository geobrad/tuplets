import { tuple, tupleCache } from ".";

// Putting this test first in case the testing framework keeps references to tuples to report test failures
test("Tuple cache entry is cleared when tuple is garbage-collected", async () => {
  tuple(42);

  // Trigger garbage collection (requires node --expose-gc)
  await new Promise((res) => setTimeout(res, 100));
  (global as any).gc();
  await new Promise((res) => setTimeout(res, 100));

  expect(tupleCache.size).toBe(0);
});

test("Empty tuples", () => {
  const a = tuple();
  const b = tuple();
  expect(b).toBe(a);
});

test("Indexability", () => {
  const a = {};
  const t = tuple(42, "blah", a);
  expect(t[0]).toBe(42);
  expect(t[1]).toBe("blah");
  expect(t[2]).toBe(a);
});

test("Iterability", () => {
  const a = {};
  const t = tuple(42, "blah", a);
  expect(typeof t[Symbol.iterator]).toBe("function");
  expect([...t]).toEqual([42, "blah", a]);
});

test("Basic interned equality (if same input, same object)", () => {
  const a = {};
  const f = () => {};
  const t1 = tuple(a, f, 42, "hi", undefined, true, null, 7839278492n);
  const t2 = tuple(a, f, 42, "hi", undefined, true, null, 7839278492n);
  expect(t1).toBe(t2); // same object reference
});

test("Referential inequality (same structure, different references)", () => {
  const t1 = tuple({}, 42);
  const t2 = tuple({}, 42);
  expect(t1).not.toBe(t2); // different objects
});

test("Different-length tuples are different tuples", () => {
  const t1 = tuple(1, 2);
  const t2 = tuple(1, 2, 3);
  const t3 = tuple(1, 2, undefined);
  expect(t1).not.toBe(t2);
  expect(t1).not.toBe(t3);
});

test("Tuples are frozen", () => {
  const t = tuple("a", "b");
  expect(() => (t[0] = "c")).toThrow();
});

test("Nestable", () => {
  const t1 = tuple("a", tuple("b1", "b2"), "c");
  const t2 = tuple("a", tuple("b1", "b2"), "c");
  const t3 = tuple("a", tuple("b1", "b3"), "c");
  expect(t2).toBe(t1);
  expect(t3).not.toBe(t1);
});

test("NaN is equivalent to itself", () => {
  expect(tuple(NaN)).toBe(tuple(NaN));
});

test("Positive and negative zero are equivalent", () => {
  expect(tuple(+0)).toBe(tuple(-0));
});
