"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Check,
    CheckCircle2,
    Clock,
    Loader2,
    Search,
    ShieldCheck,
    ShoppingBag,
    Store,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAdminPanel } from '@/context/AdminPanelContext';
import { useBookingStore } from '@/store/useBookingStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MPConnectCard } from '@/components/admin/MPConnectCard';
import { formatChileanPhone, isValidChileanPhone } from '@/utils/phone';
import {
    SpaceTemplatesEditor,
    type SpaceTemplate,
} from './SpaceTemplatesEditor';

const STEPS = [
    { n: 1, label: 'Contacto' },
    { n: 2, label: 'Espacios' },
    { n: 3, label: 'Modelo de cobro' },
    { n: 4, label: 'Imagen y oferta' },
    { n: 5, label: 'Finalizar' },
] as const;

const PAYMENT_OPTIONS = [
    {
        value: 'pay_at_center',
        title: 'Solo reservas',
        description:
            'Tus clientes reservan online y pagan directamente en el centro. Requiere una suscripción mensual.',
        icon: Store,
    },
    {
        value: 'pay_online',
        title: 'Pago anticipado',
        description:
            'Tus clientes pagan online al momento de reservar. Requiere conectar tu cuenta de Mercado Pago.',
        icon: ShoppingBag,
    },
] as const;

interface UnsplashPhoto {
    id: string;
    alt_description?: string;
    urls: { small: string; regular: string };
}

const UNSPLASH_SUGGESTIONS = ['cancha', 'fútbol', 'piscina', 'quincho', 'evento'];

// Convierte los templates del wizard al payload de la API (solo tipos con
// cantidad > 0). Los templates se envían al finalizar para materializar los
// espacios en la colección `spaces`.
const templatesPayload = (templates: SpaceTemplate[]) =>
    templates
        .filter((p) => p.cantidad > 0)
        .map((p) => ({
            tipo: p.tipo,
            cantidad: p.cantidad,
            cancha: p.cancha,
            rules: p.cancha ? p.rules ?? [] : undefined,
            price_all_day: p.price_all_day,
            price_half_day: p.price_half_day,
            price_per_day: p.price_per_day,
            price_per_month: p.price_per_month,
        }));

export const CenterOnboardingWizard: React.FC = () => {
    const { currentSportCenter, refreshSportCenter } = useAdminPanel();
    const { getAccessTokenSilently } = useAuth0();
    const router = useRouter();
    const updateSportCenterOnboarding = useBookingStore(
        (state) => state.updateSportCenterOnboarding,
    );

    const center = currentSportCenter as any;

    const [step, setStep] = useState(1);
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);

    // Etapa 1 - Contacto
    const [phone, setPhone] = useState('');
    // Etapa 2 - Espacios (templates por tipo con horarios/valores)
    const [templates, setTemplates] = useState<SpaceTemplate[]>([]);
    // Etapa 3 - Modelo de cobro
    const [paymentMode, setPaymentMode] = useState('');
    // Etapa 4 - Imagen y oferta
    const [imageUrl, setImageUrl] = useState('');
    const [firstMonthFree, setFirstMonthFree] = useState(false);
    const [unsplashResults, setUnsplashResults] = useState<UnsplashPhoto[]>([]);
    const [unsplashLoading, setUnsplashLoading] = useState(false);
    const [unsplashQuery, setUnsplashQuery] = useState('');

    // Inicializar desde el centro cargado (retomar por etapa).
    useEffect(() => {
        if (!center?.id) return;
        setPhone(center.contact?.phone || '');
        // Borrador de espacios persistido en la etapa Espacios (para retomar).
        if (center.space_templates && center.space_templates.length > 0) {
            setTemplates(
                center.space_templates.map((p: any) => ({
                    tipo: p.tipo,
                    cantidad: p.cantidad,
                    cancha: p.tipo === 'cancha',
                    rules: p.rules,
                    price_all_day: p.price_all_day,
                    price_half_day: p.price_half_day,
                    price_per_day: p.price_per_day,
                    price_per_month: p.price_per_month,
                })),
            );
        }
        setPaymentMode(center.payment_mode || '');
        setImageUrl(center.image_url || '');
        setFirstMonthFree(center.first_month_free || false);

        if (center.onboarding_status === 'completed') {
            setCompleted(true);
        } else {
            const resume = Math.min(Math.max((center.onboarding_step || 0) + 1, 1), 5);
            setStep(resume);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center?.id]);

    const getToken = useCallback(
        (options?: any) =>
            getAccessTokenSilently({
                authorizationParams: {
                    audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE,
                    scope: 'openid profile email',
                },
                ...options,
            }) as unknown as Promise<string>,
        [getAccessTokenSilently],
    );

    const isPhoneValid = isValidChileanPhone(phone);
    const totalEspacios = useMemo(
        () => templates.reduce((acc, p) => acc + (p.cantidad ?? 0), 0),
        [templates],
    );
    const hasValidEspacios = totalEspacios >= 1;

    const canContinue = useMemo(() => {
        switch (step) {
            case 1:
                return isPhoneValid;
            case 2:
                return hasValidEspacios;
            case 3:
                return paymentMode !== '';
            default:
                return true;
        }
    }, [step, isPhoneValid, hasValidEspacios, paymentMode]);

    const handlePhoneChange = (value: string) => setPhone(formatChileanPhone(value));

    const searchUnsplash = async (query: string) => {
        const q = query.trim();
        if (!q) return;
        setUnsplashLoading(true);
        try {
            const res = await fetch(
                `/api/unsplash/search?query=${encodeURIComponent(q)}&per_page=9`,
            );
            if (!res.ok) throw new Error('unsplash error');
            const data = await res.json();
            setUnsplashResults(Array.isArray(data.results) ? data.results : []);
        } catch {
            toast.error('No se pudo buscar en Unsplash');
        } finally {
            setUnsplashLoading(false);
        }
    };

    const saveStep = async () => {
        setSaving(true);
        try {
            if (step === 1) {
                await updateSportCenterOnboarding({ step: 1, telefono: phone }, getToken);
            } else if (step === 2) {
                await updateSportCenterOnboarding(
                    { step: 2, templates: templatesPayload(templates) },
                    getToken,
                );
            } else if (step === 3) {
                await updateSportCenterOnboarding(
                    { step: 3, payment_mode: paymentMode },
                    getToken,
                );
            } else if (step === 4) {
                await updateSportCenterOnboarding(
                    { step: 4, image_url: imageUrl, first_month_free: firstMonthFree },
                    getToken,
                );
            }
            toast.success('Progreso guardado');
            setStep((s) => Math.min(s + 1, STEPS.length));
        } catch {
            toast.error('No se pudo guardar tu progreso, intenta nuevamente');
        } finally {
            setSaving(false);
        }
    };

    const finalize = async () => {
        setSaving(true);
        try {
            await updateSportCenterOnboarding(
                { step: 5, finalize: true, templates: templatesPayload(templates) },
                getToken,
            );
            await refreshSportCenter();
            setCompleted(true);
            toast.success('¡Tu centro está listo!');
        } catch (err: any) {
            toast.error(
                err?.response?.data?.error || 'No se pudo completar el onboarding',
            );
        } finally {
            setSaving(false);
        }
    };

    // ---------- Pantalla de completado ----------
    if (completed) {
        return (
            <div className="mx-auto max-w-2xl">
                <Card className="overflow-hidden border-slate-200 shadow-xl">
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center">
                        <div className="rounded-full bg-emerald-100 p-3">
                            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                            ¡Tu centro deportivo está listo!
                        </h2>
                        <p className="text-slate-600">
                            Completaste la configuración de tu centro en ReservaloYA. Ya
                            puedes gestionar espacios, horarios y reservas.
                        </p>
                        {paymentMode === 'pay_online' && (
                            <div className="w-full space-y-2">
                                <p className="text-sm font-semibold text-slate-700">
                                    Conecta Mercado Pago para recibir pagos online
                                </p>
                                <MPConnectCard />
                            </div>
                        )}
                        <Button
                            onClick={() => router.push('/admin')}
                            className="h-12 w-full bg-slate-900 text-base font-bold text-white hover:bg-slate-800"
                        >
                            Ir a mi panel
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!center) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const currentLabel = STEPS[step - 1].label;

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <header className="text-center">
                <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                    <Building2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 lg:text-3xl">
                    Configura tu centro deportivo
                </h1>
                <p className="mt-1 text-slate-500">
                    Completa cada etapa para dejar tu centro listo en ReservaloYA. Tu
                    progreso se guarda por etapa.
                </p>
            </header>

            {/* Stepper */}
            <ol className="flex items-center gap-2" aria-label="Progreso del onboarding">
                {STEPS.map((s) => {
                    const current = s.n === step;
                    const done = s.n < step;
                    return (
                        <li key={s.n} className="flex flex-1 flex-col items-center gap-1">
                            <span
                                aria-hidden="true"
                                className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors',
                                    current && 'border-emerald-600 bg-emerald-600 text-white',
                                    done && 'border-emerald-500 bg-emerald-100 text-emerald-700',
                                    !current && !done && 'border-slate-300 bg-white text-slate-400',
                                )}
                            >
                                {done ? <Check className="h-4 w-4" /> : s.n}
                            </span>
                            <span
                                className={cn(
                                    'text-center text-[11px] font-medium leading-tight',
                                    current ? 'text-slate-900' : 'text-slate-400',
                                )}
                            >
                                {s.label}
                            </span>
                        </li>
                    );
                })}
            </ol>

            <Card className="overflow-hidden border-slate-200 shadow-xl">
                <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-lg font-bold text-slate-900">
                        Paso {step} de {STEPS.length}: {currentLabel}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                    {/* Etapa 1: Contacto */}
                    {step === 1 && (
                        <div className="space-y-1.5">
                            <Label htmlFor="wizard-phone" className="font-semibold text-slate-700">
                                Teléfono de contacto
                                <span aria-hidden="true" className="text-red-500">
                                    *
                                </span>
                            </Label>
                            <Input
                                id="wizard-phone"
                                type="tel"
                                inputMode="tel"
                                placeholder="+56 9 1234 5678"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className="h-11 border-slate-300 font-mono focus:border-emerald-500 focus:ring-emerald-500"
                            />
                            <p className="text-xs text-slate-500">
                                Formato chileno con código de país (+56 9 XXXX XXXX).
                            </p>
                            {phone !== '' && !isPhoneValid && (
                                <p role="alert" className="text-sm font-medium text-red-600">
                                    Ingresa un teléfono chileno válido (ej: +56 9 1234 5678).
                                </p>
                            )}
                        </div>
                    )}

                    {/* Etapa 2: Espacios */}
                    {step === 2 && (
                        <SpaceTemplatesEditor value={templates} onChange={setTemplates} />
                    )}

                    {/* Etapa 3: Modelo de cobro */}
                    {step === 3 && (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {PAYMENT_OPTIONS.map((opt) => {
                                const selected = paymentMode === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setPaymentMode(opt.value)}
                                        aria-pressed={selected}
                                        className={cn(
                                            'flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-colors active:scale-[0.99]',
                                            selected
                                                ? 'border-emerald-600 bg-emerald-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300',
                                        )}
                                    >
                                        <opt.icon
                                            className={cn(
                                                'h-6 w-6',
                                                selected ? 'text-emerald-600' : 'text-slate-400',
                                            )}
                                        />
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {opt.title}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {opt.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Etapa 4: Imagen y oferta */}
                    {step === 4 && (
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="wizard-image" className="font-semibold text-slate-700">
                                    Imagen del centro
                                </Label>
                                <Input
                                    id="wizard-image"
                                    placeholder="https://... (opcional)"
                                    value={imageUrl}
                                    onChange={(e) => setImageUrl(e.target.value)}
                                    className="h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                />

                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Buscar imagen (ej: cancha, piscina)"
                                        value={unsplashQuery}
                                        onChange={(e) => setUnsplashQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                void searchUnsplash(unsplashQuery);
                                            }
                                        }}
                                        className="h-10 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => void searchUnsplash(unsplashQuery)}
                                        disabled={unsplashLoading}
                                        className="h-10 shrink-0 border-slate-300 text-slate-700"
                                    >
                                        {unsplashLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {UNSPLASH_SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => void searchUnsplash(s)}
                                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-slate-300"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>

                                {unsplashResults.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {unsplashResults.map((photo) => (
                                            <button
                                                key={photo.id}
                                                type="button"
                                                onClick={() => setImageUrl(photo.urls.regular)}
                                                className="overflow-hidden rounded-lg border border-slate-200 transition-transform hover:scale-[1.02]"
                                            >
                                                <img
                                                    src={photo.urls.small}
                                                    alt={photo.alt_description || 'Imagen Unsplash'}
                                                    className="h-20 w-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Vista previa del centro"
                                        className="mt-2 h-44 w-full rounded-xl border border-slate-200 object-cover"
                                    />
                                )}
                            </div>

                            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <input
                                    type="checkbox"
                                    checked={firstMonthFree}
                                    onChange={(e) => setFirstMonthFree(e.target.checked)}
                                    className="mt-1 h-4 w-4 accent-emerald-600"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-slate-800">
                                        Ofrecer primer mes gratis
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        Nuevos clientes que reserven en este periodo no pagan su
                                        primera reserva o mensualidad.
                                    </span>
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Etapa 5: Resumen / Final */}
                    {step === 5 && (
                        <div className="space-y-5">
                            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                                <SummaryRow label="Centro" value={center.name} />
                                <SummaryRow label="Teléfono" value={phone || '—'} />
                                <SummaryRow
                                    label="Espacios"
                                    value={`${totalEspacios} espacio${totalEspacios === 1 ? '' : 's'}`}
                                />
                                <SummaryRow
                                    label="Modalidad de cobro"
                                    value={
                                        paymentMode === 'pay_online'
                                            ? 'Pago anticipado'
                                            : paymentMode === 'pay_at_center'
                                              ? 'Solo reservas'
                                              : '—'
                                    }
                                />
                                <SummaryRow
                                    label="Oferta primer mes"
                                    value={firstMonthFree ? 'Activada' : 'No'}
                                />
                            </div>

                            {paymentMode === 'pay_online' && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700">
                                        Conecta Mercado Pago para recibir pagos online
                                    </p>
                                    <MPConnectCard />
                                </div>
                            )}

                            <p className="flex items-center gap-1.5 text-xs text-slate-500">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                                Al finalizar, tu centro quedará operativo en ReservaloYA.
                            </p>
                        </div>
                    )}

                    {/* Navegación */}
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStep((s) => Math.max(s - 1, 1))}
                            disabled={step === 1 || saving}
                            className="h-11 border-slate-300 text-slate-700"
                        >
                            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                            Anterior
                        </Button>

                        {step < STEPS.length ? (
                            <Button
                                type="button"
                                onClick={() => void saveStep()}
                                disabled={!canContinue || saving}
                                className="h-11 bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        Guardar y continuar
                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={() => void finalize()}
                                disabled={saving}
                                className="h-11 bg-slate-900 text-white hover:bg-slate-800"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                        Finalizando...
                                    </>
                                ) : (
                                    <>
                                        Finalizar onboarding
                                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Guardamos tu progreso por etapa; puedes retomar donde quedaste.
            </p>
        </div>
    );
};

const SummaryRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-800">{value}</span>
    </div>
);

export default CenterOnboardingWizard;