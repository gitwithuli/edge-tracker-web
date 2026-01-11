'use client';

import { useEffect, useState } from 'react';
import { useEdgeStore } from '@/hooks/use-edge-store';
import { MfaEnrollment } from '@/components/mfa-enrollment';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

export default function SecuritySettingsPage() {
  const { user, mfaEnabled, checkMfaStatus, loadingStates } = useEdgeStore();
  const [showEnrollment, setShowEnrollment] = useState(false);

  useEffect(() => {
    if (user) {
      checkMfaStatus();
    }
  }, [user, checkMfaStatus]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Security Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account security and authentication methods
        </p>
      </div>

      <div className="border rounded-lg p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {mfaEnabled ? (
              <ShieldCheck className="h-10 w-10 text-green-600 mt-0.5" />
            ) : (
              <ShieldAlert className="h-10 w-10 text-amber-500 mt-0.5" />
            )}
            <div>
              <h2 className="text-lg font-medium">Two-Factor Authentication</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {mfaEnabled
                  ? 'Your account is protected with two-factor authentication.'
                  : 'Add an extra layer of security to your account by enabling 2FA.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loadingStates.checkingMfa ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mfaEnabled ? (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                Enabled
              </span>
            ) : (
              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                Disabled
              </span>
            )}
          </div>
        </div>

        {!mfaEnabled && (
          <Button
            onClick={() => setShowEnrollment(true)}
            className="w-full sm:w-auto"
          >
            <Shield className="mr-2 h-4 w-4" />
            Enable Two-Factor Authentication
          </Button>
        )}
      </div>

      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-medium">Account Details</h2>
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-sm text-muted-foreground">Account Created</span>
            <span className="text-sm font-medium">
              {new Date(user.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm text-muted-foreground">Last Sign In</span>
            <span className="text-sm font-medium">
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {showEnrollment && (
        <MfaEnrollment
          onClose={() => setShowEnrollment(false)}
          onSuccess={() => {
            setShowEnrollment(false);
            checkMfaStatus();
          }}
        />
      )}
    </div>
  );
}
