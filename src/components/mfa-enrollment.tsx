'use client';

import { useState } from 'react';
import { useEdgeStore } from '@/hooks/use-edge-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Copy, Check } from 'lucide-react';

interface MfaEnrollmentProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function MfaEnrollment({ onClose, onSuccess }: MfaEnrollmentProps) {
  const { enrollMfa, verifyMfa, loadingStates } = useEdgeStore();
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setError(null);
    const result = await enrollMfa();
    if (result) {
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setFactorId(result.factorId);
      setStep('verify');
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setError(null);
    const success = await verifyMfa(factorId, verifyCode);
    if (success) {
      onSuccess();
    } else {
      setError('Invalid code. Please try again.');
    }
  };

  const copySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            {step === 'initial'
              ? 'Scan the QR code with your authenticator app to get started.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'initial' && !qrCode && (
          <div className="flex flex-col items-center py-6 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
            </p>
            <Button onClick={handleEnroll} disabled={loadingStates.enrollingMfa}>
              {loadingStates.enrollingMfa ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue Setup'
              )}
            </Button>
          </div>
        )}

        {step === 'verify' && qrCode && (
          <div className="flex flex-col items-center py-4 space-y-6">
            <div className="bg-white p-4 rounded-lg">
              <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
            </div>

            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground text-center">
                Can&apos;t scan? Enter this code manually:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-xs font-mono break-all">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="w-full space-y-3">
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest"
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                onClick={handleVerify}
                disabled={loadingStates.verifyingMfa || verifyCode.length !== 6}
                className="w-full"
              >
                {loadingStates.verifyingMfa ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Enable'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
