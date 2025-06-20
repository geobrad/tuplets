import { tuple, tupleCache, registerTupleCleanupListener, Tuple } from ".";

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
  // TODO: complete this test
});

test("Basic interned equality (if same input, same object)", () => {
  const a = {};
  const t1 = tuple(a, 42, "hi", 7839278492n);
  const t2 = tuple(a, 42, "hi", 7839278492n);
  expect(t1).toBe(t2); // same object reference
});

test("Referential inequality (same structure, different references)", () => {
  const t1 = tuple({}, 42);
  const t2 = tuple({}, 42);
  expect(t1).not.toBe(t2); // different objects
});

test("Length matters", () => {
  const t1 = tuple(1, 2);
  const t2 = tuple(1, 2, 3);
  expect(t1).not.toBe(t2);
});

test("Tuples are frozen", () => {
  const t = tuple("a", "b");
  expect(() => (t[0] = "c")).toThrow();
});

test("Nestable", () => {
  const t1 = tuple("a", tuple("b1", "b2"), "c");
  const t2 = tuple("a", tuple("b1", "b2"), "c");
  expect(t2).toBe(t1);
});

test("Tuple cache entry is cleared when tuple is garbage-collected", async () => {
  const callback = jest.fn();
  const deregister = registerTupleCleanupListener(callback);
  tuple(42);

  // Now simulate GC
  await new Promise((res) => setTimeout(res, 100));
  (global as any).gc();
  await new Promise((res) => setTimeout(res, 100));
  deregister();

  expect(callback).toHaveBeenCalled();
  expect(tupleCache.size).toBe(0);
});
