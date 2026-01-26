/**
 * Centralized error handling utilities
 */

import { NextResponse } from 'next/server';

// Error categories for consistent handling
export type ErrorCategory = 'auth' | 'validation' | 'network' | 'server' | 'notFound' | 'rateLimit';

export interface AppError {
  category: ErrorCategory;
  message: string;
  statusCode: number;
  details?: string;
}

// Map error categories to HTTP status codes
const categoryStatusMap: Record<ErrorCategory, number> = {
  auth: 401,
  validation: 400,
  network: 503,
  server: 500,
  notFound: 404,
  rateLimit: 429,
};

// User-friendly messages for common errors
const friendlyMessages: Record<string, string> = {
  'JWT expired': 'Your session has expired. Please sign in again.',
  'invalid token': 'Your session is invalid. Please sign in again.',
  'Failed to fetch': 'Network connection lost. Please check your internet.',
  'timeout': 'The request took too long. Please try again.',
  'PGRST116': 'The requested item was not found.',
  'duplicate key': 'This item already exists.',
  '23505': 'This item already exists.',
  'rate limit': 'Too many requests. Please wait a moment.',
};

/**
 * Parse an error into a standardized AppError
 */
export function parseError(error: unknown): AppError {
  // Handle string errors
  if (typeof error === 'string') {
    return {
      category: 'server',
      message: error,
      statusCode: 500,
    };
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Check for auth errors
    if (message.includes('jwt') || message.includes('unauthorized') || message.includes('token')) {
      return {
        category: 'auth',
        message: getFriendlyMessage(error.message),
        statusCode: 401,
        details: error.message,
      };
    }

    // Check for network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        category: 'network',
        message: getFriendlyMessage(error.message),
        statusCode: 503,
        details: error.message,
      };
    }

    // Check for validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('validation')) {
      return {
        category: 'validation',
        message: error.message,
        statusCode: 400,
        details: error.message,
      };
    }

    // Default to server error
    return {
      category: 'server',
      message: getFriendlyMessage(error.message),
      statusCode: 500,
      details: error.message,
    };
  }

  // Handle Supabase errors (they have a code property)
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const supaError = error as { code: string; message?: string };

    if (supaError.code === 'PGRST116') {
      return {
        category: 'notFound',
        message: 'The requested item was not found.',
        statusCode: 404,
        details: supaError.message,
      };
    }

    if (supaError.code === '23505') {
      return {
        category: 'validation',
        message: 'This item already exists.',
        statusCode: 400,
        details: supaError.message,
      };
    }
  }

  // Unknown error type
  return {
    category: 'server',
    message: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
    details: String(error),
  };
}

/**
 * Get a user-friendly message for an error string
 */
export function getFriendlyMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  for (const [key, friendly] of Object.entries(friendlyMessages)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return friendly;
    }
  }

  return errorMessage;
}

/**
 * Create a standardized API error response
 */
export function apiError(
  error: unknown,
  defaultMessage = 'An error occurred'
): NextResponse {
  const appError = parseError(error);

  // Log the error for debugging (only detailed version)
  console.error(`[API Error] ${appError.category}:`, appError.details || appError.message);

  return NextResponse.json(
    {
      error: appError.message || defaultMessage,
      code: appError.category,
    },
    { status: appError.statusCode }
  );
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Check if an error is retryable (network/timeout issues)
 */
export function isRetryableError(error: unknown): boolean {
  const appError = parseError(error);
  return appError.category === 'network';
}

/**
 * Check if an error is an auth error (should redirect to login)
 */
export function isAuthError(error: unknown): boolean {
  const appError = parseError(error);
  return appError.category === 'auth';
}
