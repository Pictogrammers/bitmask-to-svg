import { describe, it, expect } from 'vitest';
import bitmaskToPath from './bitmaskToPath';

describe('bitmaskToPath', () => {
  it('returns empty path for empty bitmask', () => {
    const result = bitmaskToPath([[0, 0], [0, 0]]);
    expect(result).toEqual(['']);
  });

  it('returns a path for a single filled pixel', () => {
    const result = bitmaskToPath([[1]]);
    expect(result).toEqual(['M1,1H0V0H1Z']);
  });

  it('returns a path for a 2x2 filled block', () => {
    const result = bitmaskToPath([[1, 1], [1, 1]]);
    expect(result).toEqual(['M2,2H0V0H2Z']);
  });

  it('applies scale option', () => {
    const result = bitmaskToPath([[1]], { scale: 10 });
    expect(result).toEqual(['M10,10H0V0H10Z']);
  });

  it('throws for 1D array without width option', () => {
    expect(() => bitmaskToPath([1, 0, 0, 1])).toThrow();
  });

  it('accepts 1D array with width option', () => {
    const result = bitmaskToPath([1, 0, 0, 1], { width: 2 });
    expect(result[0]).toContain('M');
  });

  it('handles multi-value bitmask with separate include groups', () => {
    const data = [
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,0,0,1,1,1,0],
      [0,1,2,0,0,0,0,2,1,0],
      [0,1,0,1,1,1,1,0,1,0],
      [0,0,0,1,2,2,1,0,0,0],
      [0,0,0,1,2,2,1,0,0,0],
      [0,1,0,1,1,1,1,0,1,0],
      [0,1,2,0,0,0,0,2,1,0],
      [0,1,1,1,0,0,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0],
    ];
    const result = bitmaskToPath(data, { include: [[1], [2]] });
    expect(result).toEqual([
      'M2,4H1V1H4V2H2ZM9,4H8V2H6V1H9ZM7,7H3V3H7ZM4,9H1V6H2V8H4ZM9,9H6V8H8V6H9ZM6,6V4H4V6Z',
      'M3,3H2V2H3ZM8,3H7V2H8ZM6,6H4V4H6ZM3,8H2V7H3ZM8,8H7V7H8Z',
    ]);
  });

  it('handles nested rectangular borders with holes', () => {
    const data = [
      [0,0,0,0,0,0,0,0,0,0],
      [0,1,1,1,0,0,1,1,1,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,1,0,1,1,1,1,0,1,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,0,0,1,0,0,1,0,0,0],
      [0,1,0,1,1,1,1,0,1,0],
      [0,1,0,0,0,0,0,0,1,0],
      [0,1,1,1,0,0,1,1,1,0],
      [0,0,0,0,0,0,0,0,0,0],
    ];
    const result = bitmaskToPath(data);
    expect(result).toEqual(['M2,4H1V1H4V2H2ZM9,4H8V2H6V1H9ZM7,7H3V3H7ZM4,9H1V6H2V8H4ZM9,9H6V8H8V6H9ZM6,6V4H4V6Z']);
  });

});
