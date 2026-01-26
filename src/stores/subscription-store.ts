/**
 * Subscription Store
 * Handles user subscription state and feature access
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { UserSubscription, Feature } from '@/lib/types';
import { mapSubscriptionFromDb, type UserSubscriptionsRow } from '@/lib/database.types';

interface SubscriptionStore {
  subscription: UserSubscription | null;
  isLoading: boolean;

  // Actions
  fetchSubscription: (userId: string) => Promise<void>;
  clearSubscription: () => void;

  // Computed
  canAccess: (feature: Feature) => boolean;
  isPaid: () => boolean;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscription: null,
  isLoading: false,

  fetchSubscription: async (userId) => {
    set({ isLoading: true });

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // If no subscription record exists, create one with 'unpaid' tier
        if (error.code === 'PGRST116') {
          const { data: newSub, error: insertError } = await supabase
            .from('user_subscriptions')
            .insert({ user_id: userId, subscription_tier: 'unpaid' })
            .select()
            .single();

          if (!insertError && newSub) {
            set({
              subscription: mapSubscriptionFromDb(newSub as UserSubscriptionsRow),
              isLoading: false
            });
            return;
          }
        }
        console.error('Failed to fetch subscription:', error.message);
        set({ isLoading: false });
        return;
      }

      set({
        subscription: mapSubscriptionFromDb(data as UserSubscriptionsRow),
        isLoading: false
      });
    } catch (err) {
      console.error('Subscription fetch failed:', err);
      set({ isLoading: false });
    }
  },

  clearSubscription: () => set({ subscription: null }),

  canAccess: (feature) => {
    const { subscription } = get();
    const isPaid = subscription?.tier === 'paid';

    // Coming soon features - always false
    if (['ai_parser', 'voice_journal', 'ai_summaries'].includes(feature)) {
      return false;
    }

    return isPaid;
  },

  isPaid: () => {
    const { subscription } = get();
    return subscription?.tier === 'paid';
  },
}));
