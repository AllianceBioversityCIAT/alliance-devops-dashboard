import { describe, it, expect } from 'vitest';
import {
  decodeNextToken,
  encodeNextToken,
  parseLimit,
  PaginationError,
} from '../../src/lambdas/powerbi-data-export/pagination.js';

describe('powerbi pagination', () => {
  it('uses default limit when not provided', () => {
    expect(parseLimit(undefined)).toBe(100);
    expect(parseLimit('')).toBe(100);
  });

  it('parses valid limit', () => {
    expect(parseLimit('50')).toBe(50);
  });

  it('rejects invalid limit', () => {
    expect(() => parseLimit('0')).toThrow(PaginationError);
    expect(() => parseLimit('-1')).toThrow(PaginationError);
    expect(() => parseLimit('abc')).toThrow(PaginationError);
  });

  it('rejects limit above 1000', () => {
    expect(() => parseLimit('1001')).toThrow(PaginationError);
  });

  it('encodes and decodes nextToken', () => {
    const key = { PK: 'CHECK#maoy', SK: 'METADATA' };
    const token = encodeNextToken(key);
    expect(decodeNextToken(token)).toEqual(key);
  });

  it('rejects invalid nextToken', () => {
    expect(() => decodeNextToken('not-base64-json')).toThrow(PaginationError);
  });
});
