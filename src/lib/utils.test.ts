import { describe, it, expect } from 'vitest';
import { cn, getTVImageUrl } from './utils';

describe('cn (className merger)', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('merges tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('handles undefined and null', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });
});

describe('getTVImageUrl', () => {
  it('extracts image URL from TradingView share link with trailing slash', () => {
    const link = 'https://www.tradingview.com/x/abc123/';
    const result = getTVImageUrl(link);
    expect(result).toBe('https://s3.tradingview.com/snapshots/a/abc123.png');
  });

  it('returns null for invalid links', () => {
    expect(getTVImageUrl('https://google.com')).toBeNull();
    expect(getTVImageUrl('')).toBeNull();
  });

  it('returns null for links without trailing slash (requires slash)', () => {
    const link = 'https://www.tradingview.com/x/xyz789';
    const result = getTVImageUrl(link);
    expect(result).toBeNull();
  });

  it('uses first character for bucket path', () => {
    const link = 'https://www.tradingview.com/x/Zabc123/';
    const result = getTVImageUrl(link);
    expect(result).toBe('https://s3.tradingview.com/snapshots/z/Zabc123.png');
  });
});
