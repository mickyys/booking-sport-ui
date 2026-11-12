"use client";
import React from 'react';
import { TimeSlot, Court, UserProfile, GuestDetails } from '../../types';
import { PaymentModalMobile } from './PaymentModalMobile';
import { PaymentModalWeb } from './PaymentModalWeb';
import { CheckoutBenefits } from './DiscountPicker';

interface PaymentModalProps {
  slot: TimeSlot;
  court: Court;
  onClose: () => void;
  onConfirm: (method: 'mercadopago' | 'venue' | 'presential', guestDetails?: GuestDetails, partial?: boolean, benefits?: CheckoutBenefits) => Promise<boolean | void>;
  user: UserProfile | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = (props) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full md:p-4 h-screen md:h-auto md:max-w-md md:max-h-[90vh]">
        <div className="hidden md:block h-full">
          <PaymentModalWeb {...props} />
        </div>
        <div className="md:hidden h-full">
          <PaymentModalMobile {...props} />
        </div>
      </div>
    </div>
  );
};
