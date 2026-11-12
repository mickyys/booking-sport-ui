import api from './axiosInstance';

export interface OnboardingStep {
  key: 'contact' | 'spaces' | 'schedules' | 'payment_mode' | 'billing' | 'profile' | string;
  label: string;
  done: boolean;
  optional: boolean;
  detail?: string;
}

/** Avance del onboarding calculado por el backend con datos reales del centro. */
export interface OnboardingStatus {
  onboarding_status: string;
  onboarding_step: number;
  steps: OnboardingStep[];
  can_complete: boolean;
  missing: string[];
  payment_mode: string;
  spaces_count: number;
  draft_spaces: number;
  courts_count: number;
  courts_with_schedule: number;
  subscription_status?: string;
  mercadopago_connected: boolean;
}

export interface SubscriptionInfo {
  status: string;
  plan?: string;
  amount: number;
  next_charge_at?: string;
}

export interface SubscriptionResponse {
  applicable: boolean;
  status?: string;
  subscription?: SubscriptionInfo;
}

const auth = (token: string) => ({ headers: { Authorization: `Bearer ${token}` } });

export const getOnboardingStatus = async (token: string): Promise<OnboardingStatus> =>
  (await api.get('/admin/my-sport-center/onboarding/status', auth(token))).data;

/** Cierra el onboarding con los espacios y horarios que el centro ya tiene. */
export const completeOnboarding = async (token: string): Promise<void> => {
  await api.post('/admin/my-sport-center/onboarding/complete', {}, auth(token));
};

export const getSubscription = async (token: string): Promise<SubscriptionResponse> =>
  (await api.get('/admin/commercial/subscription', auth(token))).data;

/** Cambia la modalidad comercial (`PAY_AT_CENTER` | `PAY_ONLINE`) y mantiene sincronizados ambos modelos de cobro. */
export const setCommercialMode = async (
  token: string,
  mode: 'PAY_AT_CENTER' | 'PAY_ONLINE',
): Promise<void> => {
  await api.put('/admin/commercial/mode', { payment_mode: mode }, auth(token));
};

/** Crea la suscripción mensual y devuelve la URL de Mercado Pago para autorizarla. */
export const startSubscription = async (
  token: string,
): Promise<{ init_point: string; amount: number }> =>
  (await api.post('/admin/commercial/subscription', {}, auth(token))).data;

export const apiErrorMessage = (e: unknown, fallback: string): string => {
  const err = e as { response?: { data?: { error?: string } }; message?: string };
  return err?.response?.data?.error || fallback;
};

/** Etiquetas de los pendientes (`missing`) que devuelve el backend. */
export const ONBOARDING_LABELS: Record<string, string> = {
  contact: 'Contacto',
  spaces: 'Espacios',
  schedules: 'Horarios',
  payment_mode: 'Modalidad de cobro',
  billing: 'Suscripción o Mercado Pago',
  profile: 'Imagen del centro',
};
