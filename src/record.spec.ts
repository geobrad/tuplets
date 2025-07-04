import { record, recordType } from ".";

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

describe("Keyed record type", () => {
  const Person = recordType<{
    name: string;
    age: number;
    height: number;
  }>().withKeys("name", "age");

  it("interns on only specified keys and values", () => {
    const a = { name: "Bob", age: 42, sex: "male" };
    const b = { name: "Bob", age: 42, occupation: "teacher" };
    expect(Person(a)).toBe(Person(b));
    expect(Person(a)).toEqual({ name: "Bob", age: 42 });
  });

  it("returns different object if keys or values differ", () => {
    const r = Person({ name: "Tom", age: 42 });
    expect({ x: 1, y: 3 }).not.toBe(r);
    expect({ x: 1, y: 3 }).not.toBe(r);
    expect({ x: 1, y: 2, z: 3 }).not.toBe(r);
  });

  it("respects inherited attributes", () => {
    const proto = {name: "Bob"};
    const a = Object.create(proto);
    a.age = 42;
    expect(Person(a)).toBe(Person({name: "Bob", age: 42}));
  });
});
