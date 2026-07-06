"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { CreditCard, CheckCircle, XCircle, ExternalLink, Info } from 'lucide-react';
import { useBookingStore } from '../../store/useBookingStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface MockMPModalProps {
  amount: number;
  bookingCode: string;
  initPoint: string;
  onClose: () => void;
}

const MockMPModal: React.FC<MockMPModalProps> = ({ amount, bookingCode, initPoint, onClose }) => {
  const router = useRouter();
  const { mockConfirmPayment } = useBookingStore();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleSuccess = async () => {
    setProcessing('approved');
    try {
      await mockConfirmPayment(bookingCode, 'approved');
      router.push(`/booking/success?code=${bookingCode}`);
    } catch {
      toast.error("Error al procesar pago mock");
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    setProcessing('rejected');
    try {
      await mockConfirmPayment(bookingCode, 'rejected');
      router.push('/booking/failure');
    } catch {
      toast.error("Error al procesar rechazo mock");
      setProcessing(null);
    }
  };

  const handleRealMP = () => {
    window.location.href = initPoint;
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <CreditCard className="w-6 h-6 text-blue-500" />
            Simulador de Pago
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Entorno de desarrollo — simula el resultado del pago
          </p>
        </DialogHeader>

        {/* Información de la tarjeta simulada */}
        <div className="mt-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-medium uppercase tracking-wider opacity-80">Tarjeta de Crédito</p>
            <CreditCard className="w-6 h-6 opacity-80" />
          </div>
          <p className="text-lg font-mono tracking-wider mb-4">···· ···· ···· 2580</p>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs opacity-80 mb-1">Titular</p>
              <p className="text-sm font-semibold">Test User</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80 mb-1">Vence</p>
              <p className="text-sm font-semibold">12/28</p>
            </div>
          </div>
        </div>

        {/* Detalle del pago */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Monto</span>
            <span className="font-bold text-slate-900">${amount.toLocaleString('es-CL')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Cuotas</span>
            <span className="text-slate-900">1 cuota de ${amount.toLocaleString('es-CL')}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="font-semibold text-slate-800">Total</span>
            <span className="font-black text-lg text-blue-700">${amount.toLocaleString('es-CL')}</span>
          </div>
        </div>

        {/* Botones */}
        <div className="mt-4 space-y-3">
          <button
            onClick={handleSuccess}
            disabled={processing !== null}
            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            {processing === 'approved' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Pago Exitoso
              </>
            )}
          </button>

          <button
            onClick={handleReject}
            disabled={processing !== null}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
          >
            {processing === 'rejected' ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                Rechazar Pago
              </>
            )}
          </button>

          <button
            onClick={handleRealMP}
            disabled={processing !== null}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            Pagar con MercadoPago real
          </button>
        </div>

        <div className="flex items-start gap-2 mt-4 text-xs text-slate-400 bg-amber-50 p-3 rounded-lg">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p>
            Este modal solo aparece en entorno de desarrollo. En producción serás redirigido a MercadoPago.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MockMPModal;
