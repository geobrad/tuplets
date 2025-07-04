import { tuple, tupleType } from ".";

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

test("Positive and negative zero are distinct", () => {
  expect(tuple(+0)).not.toBe(tuple(-0));
});

test("Tuple cache entry is cleared when tuple is garbage-collected", async () => {
  const Point = tupleType<[number, number]>();

  Point(15, 42);
  expect(Point._cache.size).toBe(1);

  // Trigger garbage collection (requires node --expose-gc)
  await new Promise((res) => setTimeout(res, 100));
  (global as any).gc();
  await new Promise((res) => setTimeout(res, 100));

  expect(Point._cache.size).toBe(0);
});
