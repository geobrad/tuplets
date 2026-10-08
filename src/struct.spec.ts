import { struct } from ".";

type ExpectNever<T extends never> = T;

describe("struct", () => {
  it("preserves keys and values", () => {
    const obj = { x: 1, y: 2 };
    const s = struct(obj);
    expect(s).toEqual(obj);
  });

  it("returns the same object for shallow-equal input objects", () => {
    const a = struct({ x: 1, y: 2 });
    const b = struct({ x: 1, y: 2 });
    expect(a).toBe(b);
    expect(a === b).toBe(true);
  });

  it("returns different object if keys or values differ", () => {
    const s1 = struct({ x: 1, y: 2 });
    const s2 = struct({ x: 1, y: 3 });
    const s3 = struct({ x: 1, y: 2, z: 3 });
    expect(s1).not.toBe(s2);
    type ExpectS1S2NoOverlap = ExpectNever<Extract<typeof s1, typeof s2>>;
    expect(s1).not.toBe(s3);
    expect(s1 === s3).toBe(false);
  });

  it("can be customised", () => {
    type Geocode = { lat: number; long: number };
    const geocode = struct<Geocode>;
    const a = geocode({ lat: 1, long: 2 });
    const b = geocode({ lat: 1, long: 2 });
    expect(a).toBe(b);
  });


  it("returns frozen instances", () => {
    const s = struct({ x: 1, y: 2 });
    expect(Object.isFrozen(s)).toBe(true);
    expect(() => {
      (s as any).x = 42;
    }).toThrow();
  });
});
