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

test("NaN values with different bit representations are interned as identical", () => {
  // Construct NaN with payload 1
  const view1 = new DataView(new ArrayBuffer(8));
  view1.setUint32(0, 0x7ff80000);
  view1.setUint32(4, 0x00000001);
  const nan1 = view1.getFloat64(0);
  // Construct NaN with payload 2
  const view2 = new DataView(new ArrayBuffer(8));
  view2.setUint32(0, 0x7ff80000);
  view2.setUint32(4, 0x00000002);
  const nan2 = view2.getFloat64(0);
  // Verify they are both recognized as NaNs and Object.is equivalent:
  expect(Number.isNaN(nan1)).toBe(true);
  expect(Number.isNaN(nan2)).toBe(true);
  expect(Object.is(nan1, nan2)).toBe(true);
  // If NaNs were not canonicalized in numberToUint32s, this would fail (.not.toBe)
  // because nan1 and nan2 would hash to different buckets:
  expect(tuple(nan1)).toBe(tuple(nan2));
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
