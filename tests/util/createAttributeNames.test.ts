import createAttributeNames from '../../src/util/createAttributeNames';

describe('createAttributeNames', () => {
  it('returns a proxy that echoes property names', () => {
    const attrs = createAttributeNames<{ foo: string; bar: number }>();
    expect(attrs.foo).toBe('foo');
    expect(attrs.bar).toBe('bar');
  });

  it('works with any property name', () => {
    const attrs = createAttributeNames<{ baz: boolean }>();
    expect(attrs.baz).toBe('baz');
    // @ts-expect-error: not in type
    expect(attrs.notDefined).toBe('notDefined');
  });
});
