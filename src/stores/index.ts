/**
 * Stores Index
 *
 * This module exports all store hooks for the application.
 * The stores are split by domain for better organization and maintainability.
 *
 * For gradual migration, the original useEdgeStore is still available from
 * @/hooks/use-edge-store. These new stores can be used for new features
 * and gradually adopted.
 */

// Auth store - user authentication and MFA
export { useAuthStore, setVisibilityHandler } from './auth-store';

// Subscription store - user subscription management
export { useSubscriptionStore } from './subscription-store';

// Edge store - edge CRUD operations
export { useEdgeStoreInternal } from './edge-store';

// Log store - trade log CRUD operations
export { useLogStoreInternal } from './log-store';

// Re-export types
export type { UserSubscription, Feature, SubscriptionTier } from '@/lib/types';
