"use client";
"use client";
import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useBookingStore } from '@/store/useBookingStore';
import { CancellationModal } from '@/components/booking/CancellationModal';

export default function CancelBookingPage() {
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
  const [isCode, setIsCode] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setBookingToCancel(code);
      setIsCode(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">      
      <AnimatePresence>
        {bookingToCancel && (
          <CancellationModal
            bookingId={!isCode ? bookingToCancel : undefined}
            bookingCode={isCode ? bookingToCancel : undefined}
            onClose={() => {
              window.location.replace('/');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
