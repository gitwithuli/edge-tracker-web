import { describe, it, expect } from 'vitest';
import { parseError, getFriendlyMessage, isRetryableError, isAuthError } from './errors';

describe('errors', () => {
  describe('parseError', () => {
    it('parses string errors', () => {
      const result = parseError('Something went wrong');
      expect(result.category).toBe('server');
      expect(result.message).toBe('Something went wrong');
      expect(result.statusCode).toBe(500);
    });

    it('parses auth errors from Error objects', () => {
      const result = parseError(new Error('JWT expired'));
      expect(result.category).toBe('auth');
      expect(result.statusCode).toBe(401);
    });

    it('parses network errors from Error objects', () => {
      const result = parseError(new Error('Failed to fetch'));
      expect(result.category).toBe('network');
      expect(result.statusCode).toBe(503);
    });

    it('parses timeout errors as network errors', () => {
      const result = parseError(new Error('Request timeout'));
      expect(result.category).toBe('network');
      expect(result.statusCode).toBe(503);
    });

    it('parses validation errors', () => {
      const result = parseError(new Error('Field is required'));
      expect(result.category).toBe('validation');
      expect(result.statusCode).toBe(400);
    });

    it('parses Supabase not found errors', () => {
      const result = parseError({ code: 'PGRST116', message: 'Row not found' });
      expect(result.category).toBe('notFound');
      expect(result.statusCode).toBe(404);
    });

    it('parses Supabase duplicate key errors', () => {
      const result = parseError({ code: '23505', message: 'Duplicate key' });
      expect(result.category).toBe('validation');
      expect(result.statusCode).toBe(400);
    });

    it('handles unknown error types', () => {
      const result = parseError({ unknownProp: true });
      expect(result.category).toBe('server');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('getFriendlyMessage', () => {
    it('returns friendly message for JWT expired', () => {
      expect(getFriendlyMessage('JWT expired')).toBe(
        'Your session has expired. Please sign in again.'
      );
    });

    it('returns friendly message for Failed to fetch', () => {
      expect(getFriendlyMessage('Failed to fetch')).toBe(
        'Network connection lost. Please check your internet.'
      );
    });

    it('returns friendly message for timeout', () => {
      expect(getFriendlyMessage('Request timeout')).toBe(
        'The request took too long. Please try again.'
      );
    });

    it('returns original message for unknown errors', () => {
      expect(getFriendlyMessage('Some custom error')).toBe('Some custom error');
    });
  });

  describe('isRetryableError', () => {
    it('returns true for network errors', () => {
      expect(isRetryableError(new Error('Failed to fetch'))).toBe(true);
    });

    it('returns true for timeout errors', () => {
      expect(isRetryableError(new Error('timeout'))).toBe(true);
    });

    it('returns false for auth errors', () => {
      expect(isRetryableError(new Error('JWT expired'))).toBe(false);
    });

    it('returns false for server errors', () => {
      expect(isRetryableError(new Error('Internal server error'))).toBe(false);
    });
  });

  describe('isAuthError', () => {
    it('returns true for JWT errors', () => {
      expect(isAuthError(new Error('JWT expired'))).toBe(true);
    });

    it('returns true for unauthorized errors', () => {
      expect(isAuthError(new Error('Unauthorized access'))).toBe(true);
    });

    it('returns true for token errors', () => {
      expect(isAuthError(new Error('Invalid token'))).toBe(true);
    });

    it('returns false for network errors', () => {
      expect(isAuthError(new Error('Failed to fetch'))).toBe(false);
    });
  });
});
