import { record } from ".";

describe("record", () => {
  it("preserves keys and values", () => {
    const a = record({ x: 1, y: 2 });
    expect(a).toEqual({ x: 1, y: 2 });
  });

  it("returns the same object for shallow-equal input objects", () => {
    const a = record({ x: 1, y: 2 });
    const b = record({ x: 1, y: 2 });
    expect(a).toBe(b);
  });

  it("returns different object if keys or values differ", () => {
    const r = record({ x: 1, y: 2 });
    expect(record({ x: 1, y: 3 })).not.toBe(r);
    expect(record({ x: 1, y: 3 })).not.toBe(r);
    expect(record({ x: 1, y: 2, z: 3 })).not.toBe(r);
  });
});
