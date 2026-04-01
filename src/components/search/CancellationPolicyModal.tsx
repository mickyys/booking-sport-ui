import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Clock, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { SportCenter } from '../../types';

interface CancellationPolicyModalProps {
  center: SportCenter;
  isOpen: boolean;
  onClose: () => void;
}

const CancellationPolicyModal: React.FC<CancellationPolicyModalProps> = ({ center, isOpen, onClose }) => {
  const hasPolicy = center.cancellationHours !== undefined;
  const isFullRetention = center.retentionPercent === 100;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldAlert className="w-6 h-6 text-emerald-500" />
            Política de Cancelación
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Información sobre devoluciones para {center.name}
          </p>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {hasPolicy ? (
            <>
              {/* Opción 1: Cancelación con tiempo suficiente */}
              <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-emerald-900 mb-1">Reembolso Completo</h4>
                  <p className="text-sm text-emerald-800">
                    Si cancelas con más de <span className="font-bold">{center.cancellationHours} horas</span> de anticipación a tu reserva.
                  </p>
                </div>
              </div>

              {/* Opción 2: Cancelación tardía */}
              <div className={`flex gap-4 p-4 rounded-2xl border ${
                isFullRetention ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
              }`}>
                <Clock className={`w-6 h-6 flex-shrink-0 ${
                  isFullRetention ? 'text-red-600' : 'text-amber-600'
                }`} />
                <div>
                  <h4 className={`font-bold mb-1 ${
                    isFullRetention ? 'text-red-900' : 'text-amber-900'
                  }`}>
                    Cancelación Tardía
                  </h4>
                  <p className={`text-sm ${
                    isFullRetention ? 'text-red-800' : 'text-amber-800'
                  }`}>
                    {isFullRetention ? (
                      <>Con menos de <span className="font-bold">{center.cancellationHours} horas</span> de aviso, <span className="font-bold tracking-tight">no se realizará el reembolso</span> del pago.</>
                    ) : (
                      <>Con menos de <span className="font-bold">{center.cancellationHours} horas</span> de aviso, se retendrá un <span className="font-bold">{center.retentionPercent}%</span> del pago.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 px-2">
                <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Las devoluciones se procesan automáticamente al método de pago original y pueden tardar entre 3 a 5 días hábiles en verse reflejadas.
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">Este recinto no ha especificado una política de cancelación detallada.</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
          >
            Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancellationPolicyModal;
