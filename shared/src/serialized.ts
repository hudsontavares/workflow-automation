// What a value looks like after a JSON round trip: dates arrive as ISO strings.
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Serialized<Item>[]
    : T extends object
      ? { [Key in keyof T]: Serialized<T[Key]> }
      : T;
