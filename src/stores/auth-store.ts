/**
 * Auth Store
 * Handles user authentication state, login, logout, and MFA
 */

import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface MfaEnrollResult {
  qrCode: string;
  secret: string;
  factorId: string;
}

interface AuthLoadingStates {
  checkingMfa: boolean;
  enrollingMfa: boolean;
  verifyingMfa: boolean;
  challengingMfa: boolean;
}

interface AuthStore {
  user: User | null;
  isLoaded: boolean;
  mfaEnabled: boolean;
  loadingStates: AuthLoadingStates;

  // Actions
  setUser: (user: User | null) => void;
  setIsLoaded: (loaded: boolean) => void;
  initializeAuth: (onAuthReady: (user: User | null) => Promise<void>) => Promise<void>;
  logout: (onLogout?: () => void) => Promise<void>;

  // MFA
  checkMfaStatus: () => Promise<void>;
  enrollMfa: () => Promise<MfaEnrollResult | null>;
  verifyMfa: (factorId: string, code: string) => Promise<boolean>;
  challengeMfa: (code: string) => Promise<boolean>;
}

const initialLoadingStates: AuthLoadingStates = {
  checkingMfa: false,
  enrollingMfa: false,
  verifyingMfa: false,
  challengingMfa: false,
};

// Module-level state to prevent multiple initializations
let authInitialized = false;
let authSubscription: { unsubscribe: () => void } | null = null;
let visibilityHandler: (() => void) | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoaded: false,
  mfaEnabled: false,
  loadingStates: initialLoadingStates,

  setUser: (user) => set({ user }),
  setIsLoaded: (isLoaded) => set({ isLoaded }),

  initializeAuth: async (onAuthReady) => {
    if (authInitialized) return;
    authInitialized = true;

    try {
      const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), ms)
          ),
        ]);
      };

      let user = null;

      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 15000);
        user = session?.user || null;
      } catch {
        console.log('getSession timed out, trying getUser...');
        try {
          const { data: { user: freshUser } } = await withTimeout(supabase.auth.getUser(), 15000);
          user = freshUser;
        } catch {
          console.log('getUser also failed, clearing session...');
          user = null;
        }
      }

      set({ user, isLoaded: true });

      if (user) {
        await Promise.all([
          onAuthReady(user),
          get().checkMfaStatus(),
        ]);
      }

      // Clean up existing subscription
      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          set({ user: session.user });
          await Promise.all([
            onAuthReady(session.user),
            get().checkMfaStatus(),
          ]);
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, mfaEnabled: false });
        }
      });
      authSubscription = subscription;

    } catch (err) {
      console.error('Auth initialization failed:', err);
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore
      }
      set({ user: null, isLoaded: true });
      toast.error('Session expired. Please sign in again.');
    }
  },

  logout: async (onLogout) => {
    if (authSubscription) {
      authSubscription.unsubscribe();
      authSubscription = null;
    }
    if (visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityHandler);
      visibilityHandler = null;
    }
    authInitialized = false;

    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }

    set({ user: null, mfaEnabled: false, isLoaded: true });
    onLogout?.();
    window.location.href = '/';
  },

  checkMfaStatus: async () => {
    set({ loadingStates: { ...get().loadingStates, checkingMfa: true } });

    try {
      const { data, error } = await supabase.auth.mfa.listFactors();

      if (error) {
        console.error('Failed to check MFA status:', error.message);
        set({ loadingStates: { ...get().loadingStates, checkingMfa: false } });
        return;
      }

      const hasVerifiedTotp = data.totp.some(factor => factor.status === 'verified');
      set({
        mfaEnabled: hasVerifiedTotp,
        loadingStates: { ...get().loadingStates, checkingMfa: false }
      });
    } catch (err) {
      console.error('MFA status check failed:', err);
      set({ loadingStates: { ...get().loadingStates, checkingMfa: false } });
    }
  },

  enrollMfa: async () => {
    set({ loadingStates: { ...get().loadingStates, enrollingMfa: true } });

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) {
        toast.error(`Failed to start MFA enrollment: ${error.message}`);
        set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });
        return null;
      }

      set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });
      return {
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        factorId: data.id,
      };
    } catch (err) {
      console.error('MFA enrollment failed:', err);
      toast.error('Failed to start MFA enrollment');
      set({ loadingStates: { ...get().loadingStates, enrollingMfa: false } });
      return null;
    }
  },

  verifyMfa: async (factorId, code) => {
    set({ loadingStates: { ...get().loadingStates, verifyingMfa: true } });

    try {
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });

      if (challengeError) {
        toast.error(`MFA challenge failed: ${challengeError.message}`);
        set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
        return false;
      }

      set({
        mfaEnabled: true,
        loadingStates: { ...get().loadingStates, verifyingMfa: false }
      });
      toast.success('Two-factor authentication enabled');
      return true;
    } catch (err) {
      console.error('MFA verification failed:', err);
      set({ loadingStates: { ...get().loadingStates, verifyingMfa: false } });
      return false;
    }
  },

  challengeMfa: async (code) => {
    set({ loadingStates: { ...get().loadingStates, challengingMfa: true } });

    try {
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError || !factorsData.totp.length) {
        toast.error('No MFA factors found');
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const verifiedFactor = factorsData.totp.find(f => f.status === 'verified');
      if (!verifiedFactor) {
        toast.error('No verified MFA factor found');
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });

      if (challengeError) {
        toast.error(`MFA challenge failed: ${challengeError.message}`);
        set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: verifiedFactor.id,
        challengeId: challengeData.id,
        code,
      });

      set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
      return !verifyError;
    } catch (err) {
      console.error('MFA challenge failed:', err);
      set({ loadingStates: { ...get().loadingStates, challengingMfa: false } });
      return false;
    }
  },
}));

// Export visibility handler setter for use in other stores
export function setVisibilityHandler(handler: () => void) {
  if (visibilityHandler && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', visibilityHandler);
  }
  visibilityHandler = handler;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handler);
  }
}
