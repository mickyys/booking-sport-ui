"use client";

import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Unlink,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminPanel } from '@/context/AdminPanelContext';
import { useMPConnect } from '@/hooks/useMPConnect';
import { useBookingStore } from '@/store/useBookingStore';

type PaymentMode = 'pay_online' | 'pay_at_center';

/**
 * Activa/desactiva el cobro online con Mercado Pago después del onboarding.
 *
 * - ON  -> payment_mode = pay_online y se habilita la configuración de MP.
 * - OFF -> payment_mode = pay_at_center; el backend revoca y elimina el token.
 *
 * El guardado es inmediato; desactivar pide confirmación porque borra la
 * conexión y obliga a reconectar Mercado Pago.
 */
export const MPOnlinePaymentCard: React.FC = () => {
  const { currentSportCenter, refreshSportCenter } = useAdminPanel();
  const { getAccessTokenSilently } = useAuth0();
  const updateSportCenterSettings = useBookingStore((state) => state.updateSportCenterSettings);
  const {
    status,
    isLoading,
    isConnecting,
    isDisconnecting,
    connect,
    disconnect,
    fetchStatus,
  } = useMPConnect();

  const center = currentSportCenter as any;
  const centerId = center?.id || center?._id;

  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDisableOpen, setConfirmDisableOpen] = useState(false);

  useEffect(() => {
    setEnabled(center?.payment_mode === 'pay_online');
  }, [center?.id, center?.payment_mode]);

  const connected = status?.connected ?? false;
  const busy = saving || isConnecting || isDisconnecting;

  const updateMode = async (mode: PaymentMode): Promise<boolean> => {
    if (!centerId) {
      toast.error('No se encontró el centro deportivo');
      return false;
    }
    setSaving(true);
    try {
      await updateSportCenterSettings(centerId, { payment_mode: mode }, getAccessTokenSilently);
      await refreshSportCenter();
      await fetchStatus();
      return true;
    } catch (error) {
      console.error('Error updating Mercado Pago mode:', error);
      toast.error(
        mode === 'pay_at_center'
          ? 'No se pudo desactivar el cobro online'
          : 'No se pudo activar el cobro online',
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    if (busy) return;

    if (enabled) {
      setConfirmDisableOpen(true);
      return;
    }

    const ok = await updateMode('pay_online');
    if (!ok) return;

    setEnabled(true);
    toast.success(
      connected
        ? 'Cobro online activado'
        : 'Cobro online activado. Conecta Mercado Pago para recibir pagos.',
    );
  };

  const handleConfirmDisable = async () => {
    setConfirmDisableOpen(false);
    const ok = await updateMode('pay_at_center');
    if (!ok) return;

    setEnabled(false);
    toast.success('Cobro online desactivado y conexión con Mercado Pago eliminada');
  };

  const handleConnect = async () => {
    if (busy) return;
    const ok = await connect();
    if (ok === false) {
      toast.error('No se pudo iniciar la conexión con Mercado Pago');
    }
  };

  const handleDisconnect = async () => {
    if (busy) return;
    const ok = await disconnect();
    if (ok) {
      toast.success('Cuenta de Mercado Pago desconectada');
    } else {
      toast.error('No se pudo desconectar Mercado Pago');
    }
  };

  return (
    <div className="border-t border-slate-200 pt-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CreditCard className="h-5 w-5 text-emerald-500" />
        <h4 className="text-base font-bold text-slate-900">Mercado Pago</h4>
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          Se guarda al instante
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <div className="space-y-0.5">
            <label htmlFor="mp-online-toggle" className="text-sm font-bold text-slate-900">
              Cobrar online con Mercado Pago
            </label>
            <p className="text-xs text-slate-500">
              {enabled
                ? 'Tus clientes pagan al reservar directamente con Mercado Pago.'
                : 'Tus clientes reservan online y pagan directamente en el centro.'}
            </p>
          </div>
          <button
            id="mp-online-toggle"
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Cobrar online con Mercado Pago"
            disabled={busy || !centerId}
            onClick={() => void handleToggle()}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
              enabled ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {enabled && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            {isLoading && !status ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Consultando conexión con Mercado Pago...
              </div>
            ) : connected ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-emerald-900">Cuenta conectada</p>
                    <p className="mt-0.5 text-xs text-emerald-700">
                      {status?.live_mode ? 'Producción' : 'Pruebas (Sandbox)'}
                      {status?.mp_user_id ? ` · ID ${status.mp_user_id}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Los pagos se procesan de forma segura por Mercado Pago
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleDisconnect()}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition-all hover:bg-rose-100 disabled:opacity-50"
                  >
                    {isDisconnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Unlink size={14} />
                    )}
                    Desconectar cuenta
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      Mercado Pago no está conectado
                    </p>
                    <p className="mt-0.5 text-xs text-amber-800">
                      Activaste el cobro online, pero las reservas no podrán pagar hasta que
                      conectes tu cuenta.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isConnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink size={16} />
                  )}
                  {isConnecting ? 'Redirigiendo a Mercado Pago...' : 'Conectar Mercado Pago'}
                </button>
              </div>
            )}
          </div>
        )}

        {!enabled && (
          <p className="text-xs text-slate-500">
            Al desactivar se elimina la conexión con Mercado Pago y tus próximas reservas se
            pagan en el centro. Las reservas y comisiones ya generadas no se modifican.
          </p>
        )}
      </div>

      <AlertDialog open={confirmDisableOpen} onOpenChange={setConfirmDisableOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar el cobro online?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la conexión con Mercado Pago y deberás volver a conectar la cuenta
              si quieres reactivar los pagos online. Las reservas ya pagadas y sus comisiones
              no se modifican.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirmDisable();
              }}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sí, desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MPOnlinePaymentCard;
