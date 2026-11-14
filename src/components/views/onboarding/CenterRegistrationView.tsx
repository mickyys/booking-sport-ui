"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'sonner';
import {
    AlertTriangle,
    Building2,
    CheckCircle2,
    Eye,
    EyeOff,
    Globe,
    Loader2,
    Pencil,
} from 'lucide-react';

import api from '@/api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/components/ui/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    useFormField,
} from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cleanRUT, formatRUT, validateRUT } from '@/utils/rut';
import { generateSlug } from '@/utils/slug';
import { buildTenantSiteUrl, platformDomain } from '@/utils/host';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const ADDRESS_MIN_QUERY_LENGTH = 4;
const SUGGESTIONS_DEBOUNCE_MS = 300;
const EMAIL_CHECK_DEBOUNCE_MS = 600;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Política mínima de clave, alineada con validarClave del backend.
const CLAVE_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

// Estados del correo durante el registro: sin revisar, revisando contra
// Auth0/Mongo, disponible para registrar un centro, o bloqueado por ya
// pertenecer a un centro deportivo.
type EmailCheckState = 'idle' | 'checking' | 'available' | 'blocked';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

interface MapboxContextItem {
    id: string;
    text?: string;
}

interface MapboxFeature {
    id?: string;
    text?: string;
    place_name?: string;
    center?: number[];
    context?: MapboxContextItem[];
}

interface AddressSelection {
    placeName: string;
    lat: number;
    lng: number;
}

interface OnboardRequest {
    nombre: string;
    rut: string;
    direccion: string;
    email: string;
    slug?: string;
    ciudad?: string;
    latitud?: number;
    longitud?: number;
    clave?: string;
}

interface OnboardResponse {
    id: string;
    slug: string;
    name: string;
    city?: string;
    coordinates?: { lat: number; lng: number };
    message?: string;
}

interface AccountStatusResponse {
    exists: boolean;
    verified: boolean;
    has_center: boolean;
}

const centerRegistrationSchema = z.object({
    nombre: z
        .string()
        .min(1, 'El nombre del centro es requerido')
        .max(100, 'El nombre no puede superar los 100 caracteres'),
    rut: z
        .string()
        .min(1, 'El RUT es requerido')
        .max(12, 'RUT demasiado largo')
        .refine(
            (value) => {
                const cleaned = cleanRUT(value);
                if (cleaned.length === 0) return value.trim().length === 0;
                if (cleaned.length < 8) return true;
                return validateRUT(cleaned);
            },
            'Ingresa un RUT válido (ej: 12.345.678-5)',
        ),
    direccion: z.string().min(1, 'La dirección es requerida'),
    slug: z.string().optional(),
    clave: z.string().optional(),
});

type CenterRegistrationValues = z.infer<typeof centerRegistrationSchema>;

interface CreatedCenter {
    id: string;
    slug: string;
    name: string;
}

function FieldError() {
    const { error, formMessageId } = useFormField();
    if (!error?.message) return null;
    return (
        <p id={formMessageId} role="alert" className="text-sm font-medium text-red-600">
            {error.message}
        </p>
    );
}

const inputClassName =
    'h-11 border-slate-300 focus:border-emerald-500 focus:ring-emerald-500';

export const CenterRegistrationView: React.FC = () => {
    const [createdCenter, setCreatedCenter] = useState<CreatedCenter | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [city, setCity] = useState('');
    const [selection, setSelection] = useState<AddressSelection | null>(null);
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
    const [isSlugEditing, setIsSlugEditing] = useState(false);

    const [email, setEmail] = useState('');
    const [emailState, setEmailState] = useState<EmailCheckState>('idle');
    // true cuando el correo ya tiene cuenta en Auth0 (con o sin centro):
    // en ese caso no se define clave nueva.
    const [emailExists, setEmailExists] = useState(false);
    const [showClave, setShowClave] = useState(false);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const emailCheckControllerRef = useRef<AbortController | null>(null);
    const slugInputRef = useRef<HTMLInputElement>(null);
    // El resolver se crea una vez; el ref mantiene fresco el flag para la
    // validación condicional de la clave.
    const emailExistsRef = useRef(false);
    emailExistsRef.current = emailExists;

    const reactId = useId();
    const fieldIdBase = reactId.replace(/:/g, '');
    const listboxId = `lb-${fieldIdBase}`;
    const claveInputId = `clave-${fieldIdBase}`;

    const form = useForm<CenterRegistrationValues>({
        resolver: zodResolver(
            centerRegistrationSchema.superRefine((values, ctx) => {
                if (!emailExistsRef.current && !CLAVE_PATTERN.test(values.clave ?? '')) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['clave'],
                        message:
                            'La clave debe tener al menos 8 caracteres, con mayúscula, minúscula y número',
                    });
                }
            }),
        ),
        mode: 'onChange',
        defaultValues: {
            nombre: '',
            rut: '',
            direccion: '',
            slug: '',
            clave: '',
        },
    });

    const watchedNombre = form.watch('nombre');
    const watchedSlug = form.watch('slug');

    const isEmailValid = EMAIL_PATTERN.test(normalizeEmail(email));

    useEffect(() => {
        if (!slugManuallyEdited) {
            form.setValue('slug', generateSlug(watchedNombre));
        }
    }, [watchedNombre, slugManuallyEdited, form]);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            abortControllerRef.current?.abort();
            emailCheckControllerRef.current?.abort();
        };
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsSuggesting(true);
        try {
            const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=cl&language=es&limit=5&autocomplete=true`,
                { signal: controller.signal },
            );
            if (!res.ok) throw new Error(`Mapbox respondió ${res.status}`);
            const data = await res.json();
            if (controller.signal.aborted) return;
            const features: MapboxFeature[] = Array.isArray(data?.features)
                ? data.features
                : [];
            setSuggestions(features);
            setActiveIndex(features.length > 0 ? 0 : -1);
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                console.error('Error buscando direcciones:', err);
                setSuggestions([]);
                setActiveIndex(-1);
                toast.error('No se pudo determinar la ciudad');
            }
        } finally {
            if (!controller.signal.aborted) setIsSuggesting(false);
        }
    }, []);

    const handleDireccionChange = (value: string) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        const query = value.trim();
        if (!MAPBOX_TOKEN || query.length < ADDRESS_MIN_QUERY_LENGTH) {
            abortControllerRef.current?.abort();
            setSuggestions([]);
            setActiveIndex(-1);
            return;
        }
        debounceTimerRef.current = setTimeout(
            () => fetchSuggestions(query),
            SUGGESTIONS_DEBOUNCE_MS,
        );
    };

    const closeSuggestions = () => {
        setSuggestions([]);
        setActiveIndex(-1);
    };

    const selectSuggestion = useCallback(
        (feature: MapboxFeature) => {
            abortControllerRef.current?.abort();
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

            const placeName = feature.place_name ?? '';
            if (placeName) {
                form.setValue('direccion', placeName, { shouldValidate: true });
            }

            const cityContext = feature.context?.find(
                (c) => c.id.startsWith('place.') || c.id.startsWith('locality.'),
            );
            const extractedCity =
                cityContext?.text ?? placeName.split(',')[0]?.trim() ?? '';
            const center = feature.center;
            if (!extractedCity || !center || center.length < 2) {
                setCity('');
                setSelection(null);
                toast.error('No se pudo determinar la ciudad');
            } else {
                setCity(extractedCity);
                // Mapbox entrega center como [lng, lat] (orden GeoJSON).
                setSelection({
                    placeName,
                    lat: center[1],
                    lng: center[0],
                });
            }
            closeSuggestions();
        },
        [form],
    );

    const handleDireccionKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') {
            closeSuggestions();
            return;
        }
        if (suggestions.length === 0) return;
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) => (prev + 1) % suggestions.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(
                (prev) => (prev - 1 + suggestions.length) % suggestions.length,
            );
        } else if (event.key === 'Enter' && activeIndex >= 0) {
            event.preventDefault();
            selectSuggestion(suggestions[activeIndex]);
        }
    };

    const handleSlugInputChange = (rawValue: string) => {
        setSlugManuallyEdited(true);
        form.clearErrors('slug');
        form.setValue('slug', rawValue.toLowerCase().replace(/[^a-z0-9-]/g, ''), {
            shouldValidate: false,
        });
    };

    const toggleSlugEditing = () => {
        setIsSlugEditing((prev) => {
            const next = !prev;
            if (next) setTimeout(() => slugInputRef.current?.focus(), 0);
            return next;
        });
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        setEmailState('idle');
        setEmailExists(false);
        form.clearErrors('clave');
    };

    // Validación del correo contra Auth0 + centros: al escribir un correo
    // válido se consulta con debounce si existe y si ya administra un centro.
    useEffect(() => {
        if (!EMAIL_PATTERN.test(normalizeEmail(email))) return;
        const timer = setTimeout(() => {
            void handleCheckEmail();
        }, EMAIL_CHECK_DEBOUNCE_MS);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    const handleCheckEmail = async () => {
        const normalized = normalizeEmail(email);
        if (!EMAIL_PATTERN.test(normalized)) return;

        emailCheckControllerRef.current?.abort();
        const controller = new AbortController();
        emailCheckControllerRef.current = controller;

        setEmailState('checking');
        try {
            const { data } = await api.get<AccountStatusResponse>(
                '/sport-centers/onboard/verification-status',
                { params: { email: normalized }, signal: controller.signal },
            );
            if (controller.signal.aborted) return;
            if (data.exists && data.has_center) {
                setEmailExists(true);
                setEmailState('blocked');
                setGlobalError(null);
            } else {
                setEmailExists(data.exists);
                setEmailState('available');
                setGlobalError(null);
            }
        } catch (err) {
            if (
                controller.signal.aborted ||
                axios.isCancel(err) ||
                (err as Error)?.name === 'CanceledError' ||
                (err as Error)?.name === 'AbortError'
            ) {
                return;
            }
            setEmailState('idle');
            if (axios.isAxiosError(err) && err.response?.status === 502) {
                toast.error('Servicio no disponible, intenta en unos minutos');
            } else {
                toast.error(
                    'No se pudo validar tu correo. Revisa tu conexión e intenta nuevamente.',
                );
            }
        } finally {
            if (!controller.signal.aborted && emailCheckControllerRef.current === controller) {
                emailCheckControllerRef.current = null;
            }
        }
    };

    const handleEmailKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if ((emailState === 'idle' || emailState === 'checking') && isEmailValid) {
            void handleCheckEmail();
        }
    };

    const onSubmit = async (values: CenterRegistrationValues) => {
        if (emailState !== 'available') {
            toast.error(
                emailState === 'blocked'
                    ? 'Este correo ya está registrado en un centro deportivo'
                    : 'Valida tu correo electrónico para completar el registro',
            );
            return;
        }
        const direccionTrim = values.direccion.trim();
        if (
            !selection ||
            !city ||
            !selection.placeName ||
            direccionTrim !== selection.placeName
        ) {
            toast.error(
                'Selecciona una dirección de las sugerencias para completar la ciudad y ubicación',
            );
            return;
        }
        setGlobalError(null);
        setIsSubmitting(true);
        try {
            const payload: OnboardRequest = {
                nombre: values.nombre.trim(),
                rut: cleanRUT(values.rut),
                direccion: direccionTrim,
                email: normalizeEmail(email),
                ciudad: city,
                latitud: selection.lat,
                longitud: selection.lng,
            };
            const finalSlug = generateSlug(values.slug ?? '');
            if (finalSlug) payload.slug = finalSlug;
            // Solo las cuentas nuevas definen clave en el formulario; si el
            // correo ya existe en Auth0, el backend la ignora.
            if (!emailExists && values.clave) payload.clave = values.clave;

            const { data } = await api.post<OnboardResponse>(
                '/sport-centers/onboard',
                payload,
            );
            setCreatedCenter({
                id: data.id,
                slug: data.slug,
                name: data.name || values.nombre.trim(),
            });
            closeSuggestions();
            toast.success('¡Centro deportivo registrado con éxito!');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const serverMessage =
                    typeof err.response?.data?.error === 'string'
                        ? err.response.data.error
                        : null;
                if (status === 409) {
                    const message =
                        serverMessage ?? 'Este correo o slug ya está registrado';
                    if (serverMessage?.includes('correo')) {
                        // El correo ya administra otro centro: bloquear.
                        setEmailState('blocked');
                        setEmailExists(true);
                    } else {
                        form.setError('slug', {
                            type: 'manual',
                            message: 'Este slug ya está en uso',
                        });
                    }
                    setGlobalError(message);
                    toast.error(message);
                } else if (
                    status === 400 &&
                    serverMessage?.includes('clave')
                ) {
                    form.setError('clave', {
                        type: 'manual',
                        message: serverMessage,
                    });
                    toast.error(serverMessage);
                } else if (status === 422) {
                    const message =
                        serverMessage ??
                        'Ya existe un centro registrado con ese nombre y RUT';
                    setGlobalError(message);
                    toast.error(message);
                } else if (status === 502) {
                    const message =
                        'Servicio temporalmente no disponible, intenta en unos minutos.';
                    setGlobalError(message);
                    toast.error(message);
                } else if (status === 400 && serverMessage) {
                    setGlobalError(serverMessage);
                    toast.error(serverMessage);
                } else {
                    setGlobalError(
                        'No se pudo registrar el centro. Por favor intenta nuevamente.',
                    );
                    toast.error('No se pudo registrar el centro. Por favor intenta nuevamente.');
                }
            } else {
                setGlobalError(
                    'Ocurrió un error inesperado. Por favor intenta nuevamente.',
                );
                toast.error('Ocurrió un error inesperado. Por favor intenta nuevamente.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRegisterAnother = () => {
        setCreatedCenter(null);
        setCity('');
        setSelection(null);
        setSlugManuallyEdited(false);
        setIsSlugEditing(false);
        setGlobalError(null);
        setEmail('');
        setEmailState('idle');
        setEmailExists(false);
        setShowClave(false);
        form.reset({
            nombre: '',
            rut: '',
            direccion: '',
            slug: '',
            clave: '',
        });
    };

    if (createdCenter) {
        const tenantUrl = buildTenantSiteUrl(createdCenter.slug);
        return (
            <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
                <div className="mx-auto w-full max-w-xl px-4">
                    <Card className="w-full overflow-hidden border-slate-200 shadow-xl">
                        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                        <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
                            <div className="rounded-full bg-emerald-100 p-3">
                                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                                    ¡Tu centro está listo!
                                </h2>
                                <p className="text-slate-600">
                                    <span className="font-semibold text-slate-800">
                                        {createdCenter.name}
                                    </span>{' '}
                                    fue registrado con éxito en ReservaloYA.
                                </p>
                            </div>

                            <dl className="w-full space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Slug creado
                                    </dt>
                                    <dd className="mt-1">
                                        <code className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-sm text-white">
                                            {createdCenter.slug}
                                        </code>
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        La dirección de tu centro será
                                    </dt>
                                    <dd className="mt-1 break-all font-mono text-sm text-slate-700">
                                        {tenantUrl}
                                    </dd>
                                </div>
                            </dl>

                            <Button
                                asChild
                                className="h-12 w-full bg-slate-900 text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98]"
                            >
                                <a
                                    href={tenantUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Ir a mi panel
                                </a>
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                className="h-11 text-sm font-medium text-slate-600 hover:text-slate-900"
                                onClick={handleRegisterAnother}
                            >
                                Registrar otro centro
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 sm:py-14">
            <div className="mx-auto w-full max-w-xl px-4">
                <header className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-4 rounded-2xl bg-emerald-100 p-3">
                        <Building2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Regístrate como{' '}
                        <span className="text-emerald-600">Centro Deportivo</span>
                    </h1>
                    <p className="mt-3 text-lg text-slate-600">
                        Completa los datos de tu centro y obtén tu propia página para
                        recibir reservas online.
                    </p>
                </header>

                <Card className="w-full overflow-hidden border-slate-200 shadow-xl">
                    <div className="h-2 w-full bg-gradient-to-r from-emerald-500 to-teal-600" />
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-slate-900">
                            Datos del centro
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Esta información construirá la página pública de tu centro
                            deportivo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Form {...form}>
                            <form
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-6"
                                noValidate
                            >
                                <FormField
                                    control={form.control}
                                    name="nombre"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className="flex items-center justify-between gap-2">
                                                <FormLabel className="font-semibold text-slate-700">
                                                    Nombre del centro
                                                    <span
                                                        aria-hidden="true"
                                                        className="text-red-500"
                                                    >
                                                        *
                                                    </span>
                                                </FormLabel>
                                                <span
                                                    className={cn(
                                                        'text-xs tabular-nums',
                                                        watchedNombre.length >= 90
                                                            ? 'font-medium text-amber-600'
                                                            : 'text-slate-400',
                                                    )}
                                                >
                                                    {watchedNombre.length}/100
                                                </span>
                                            </div>
                                            <FormControl>
                                                <Input
                                                    placeholder="Ej: Centro Deportivo Los Andes"
                                                    autoComplete="organization"
                                                    aria-required="true"
                                                    maxLength={100}
                                                    className={inputClassName}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FieldError />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="rut"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-slate-700">
                                                RUT del centro
                                                <span
                                                    aria-hidden="true"
                                                    className="text-red-500"
                                                >
                                                    *
                                                </span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="12.345.678-5"
                                                    inputMode="text"
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                    aria-required="true"
                                                    maxLength={12}
                                                    className={cn(inputClassName, 'font-mono')}
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(formatRUT(e.target.value))
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Se formatea automáticamente y se valida en tiempo
                                                real.
                                            </FormDescription>
                                            <FieldError />
                                        </FormItem>
                                    )}
                                />

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label
                                            htmlFor="onboarding-email"
                                            className="font-semibold text-slate-700"
                                        >
                                            Correo electrónico
                                            <span
                                                aria-hidden="true"
                                                className="text-red-500"
                                            >
                                                *
                                            </span>
                                        </Label>
                                        {emailState === 'available' && (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                                <CheckCircle2
                                                    className="h-4 w-4"
                                                    aria-hidden="true"
                                                />
                                                {emailExists
                                                    ? 'Cuenta encontrada'
                                                    : 'Correo disponible'}
                                            </span>
                                        )}
                                        {emailState === 'checking' && (
                                            <span
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"
                                                role="status"
                                            >
                                                <Loader2
                                                    className="h-4 w-4 animate-spin"
                                                    aria-hidden="true"
                                                />
                                                Validando...
                                            </span>
                                        )}
                                    </div>
                                    <div aria-live="polite">
                                        {emailState === 'blocked' && (
                                            <div
                                                role="alert"
                                                className="mb-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                                            >
                                                <AlertTriangle
                                                    className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                                                    aria-hidden="true"
                                                />
                                                <p className="text-sm font-medium text-red-700">
                                                    El correo{' '}
                                                    <span className="break-all font-semibold">
                                                        {normalizeEmail(email)}
                                                    </span>{' '}
                                                    ya está registrado en un
                                                    centro deportivo. No es
                                                    posible registrar otro
                                                    centro con esta cuenta.
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="onboarding-email"
                                                type="email"
                                                placeholder="tu@club.cl"
                                                autoComplete="email"
                                                required
                                                value={email}
                                                disabled={emailState === 'blocked'}
                                                aria-invalid={emailState === 'blocked'}
                                                aria-describedby="onboarding-email-hint"
                                                className={cn(
                                                    inputClassName,
                                                    emailState === 'blocked' &&
                                                        'cursor-not-allowed border-red-300 bg-slate-100 text-slate-500',
                                                )}
                                                onChange={(e) =>
                                                    handleEmailChange(e.target.value)
                                                }
                                                onKeyDown={handleEmailKeyDown}
                                            />
                                            {(emailState === 'idle' ||
                                              emailState === 'blocked') && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={!isEmailValid}
                                                    onClick={() =>
                                                        void handleCheckEmail()
                                                    }
                                                    className="h-11 shrink-0 border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Validar
                                                </Button>
                                            )}
                                        </div>
                                        <p
                                            id="onboarding-email-hint"
                                            className="mt-2 text-xs text-slate-500"
                                        >
                                            {emailState === 'available'
                                                ? emailExists
                                                  ? 'Tu cuenta ya existe en ReservaloYA. Al completar asociaremos tu centro a ella.'
                                                  : 'Tu correo está disponible. Definiremos tu cuenta al presionar Completar.'
                                                : 'Verificaremos si el correo ya pertenece a ReservaloYA.'}
                                        </p>
                                    </div>
                                </div>

                                {!emailExists && (
                                    <FormField
                                        control={form.control}
                                        name="clave"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel
                                                    htmlFor={claveInputId}
                                                    className="font-semibold text-slate-700"
                                                >
                                                    Clave de acceso
                                                    <span
                                                        aria-hidden="true"
                                                        className="text-red-500"
                                                    >
                                                        *
                                                    </span>
                                                </FormLabel>
                                                <div className="relative">
                                                    <FormControl>
                                                        <Input
                                                            id={claveInputId}
                                                            type={
                                                                showClave
                                                                    ? 'text'
                                                                    : 'password'
                                                            }
                                                            placeholder="Crea tu clave de acceso"
                                                            autoComplete="new-password"
                                                            aria-required="true"
                                                            className={cn(
                                                                inputClassName,
                                                                'pr-11',
                                                            )}
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowClave(
                                                                (prev) => !prev,
                                                            )
                                                        }
                                                        aria-label={
                                                            showClave
                                                                ? 'Ocultar clave'
                                                                : 'Mostrar clave'
                                                        }
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                                                    >
                                                        {showClave ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                                <FormDescription>
                                                    Mínimo 8 caracteres, con
                                                    mayúscula, minúscula y
                                                    número. La usarás para
                                                    iniciar sesión.
                                                </FormDescription>
                                                <FieldError />
                                            </FormItem>
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="direccion"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-slate-700">
                                                Dirección
                                                <span
                                                    aria-hidden="true"
                                                    className="text-red-500"
                                                >
                                                    *
                                                </span>
                                            </FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input
                                                        placeholder="Av. Providencia 1234, Santiago"
                                                        autoComplete="off"
                                                        role="combobox"
                                                        aria-expanded={suggestions.length > 0}
                                                        aria-controls={
                                                            suggestions.length > 0
                                                                ? listboxId
                                                                : undefined
                                                        }
                                                        aria-autocomplete="list"
                                                        aria-activedescendant={
                                                            suggestions.length > 0 &&
                                                            activeIndex >= 0
                                                                ? `${listboxId}-opt-${activeIndex}`
                                                                : undefined
                                                        }
                                                        aria-busy={isSuggesting}
                                                        aria-required="true"
                                                        className={inputClassName}
                                                        {...field}
                                                        onChange={(e) => {
                                                            field.onChange(e.target.value);
                                                            handleDireccionChange(e.target.value);
                                                        }}
                                                        onBlur={() =>
                                                            setTimeout(closeSuggestions, 150)
                                                        }
                                                        onKeyDown={handleDireccionKeyDown}
                                                    />
                                                </FormControl>
                                                {suggestions.length > 0 && (
                                                    <ul
                                                        id={listboxId}
                                                        role="listbox"
                                                        aria-label="Sugerencias de dirección"
                                                        className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                                                    >
                                                        {suggestions.map((feature, i) => (
                                                            <li
                                                                key={feature.id ?? `${i}`}
                                                                id={`${listboxId}-opt-${i}`}
                                                                role="option"
                                                                aria-selected={i === activeIndex}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    selectSuggestion(feature);
                                                                }}
                                                                onMouseEnter={() =>
                                                                    setActiveIndex(i)
                                                                }
                                                                className={cn(
                                                                    'cursor-pointer px-4 py-2.5 transition-colors',
                                                                    i === activeIndex
                                                                        ? 'bg-emerald-50'
                                                                        : 'bg-white',
                                                                )}
                                                            >
                                                                <span className="block truncate text-sm font-medium text-slate-800">
                                                                    {feature.text ??
                                                                        feature.place_name}
                                                                </span>
                                                                {feature.place_name && (
                                                                    <span className="block truncate text-xs text-slate-500">
                                                                        {feature.place_name}
                                                                    </span>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                            <FormDescription>
                                                Escribe al menos 4 caracteres y elige una
                                                sugerencia para autocompletar la ciudad.
                                            </FormDescription>
                                            <FieldError />
                                        </FormItem>
                                    )}
                                />

                                <div>
                                    <Label
                                        htmlFor="onboarding-ciudad"
                                        className="font-semibold text-slate-700"
                                    >
                                        Ciudad
                                    </Label>
                                    <Input
                                        id="onboarding-ciudad"
                                        value={city}
                                        readOnly
                                        placeholder="Se completa al elegir una dirección"
                                        aria-readonly="true"
                                        aria-describedby="onboarding-ciudad-hint"
                                        className="mt-2 h-11 cursor-not-allowed border-slate-200 bg-slate-100 text-slate-500"
                                    />
                                    <p
                                        id="onboarding-ciudad-hint"
                                        className="mt-2 text-xs text-slate-500"
                                    >
                                        Se detecta automáticamente desde la dirección
                                        seleccionada.
                                    </p>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="slug"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-semibold text-slate-700">
                                                Dirección web (slug)
                                            </FormLabel>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                    <Input
                                                        readOnly={!isSlugEditing}
                                                        placeholder="mi-centro-deportivo"
                                                        autoComplete="off"
                                                        spellCheck={false}
                                                        className={cn(
                                                            inputClassName,
                                                            'pl-10 font-mono',
                                                            !isSlugEditing &&
                                                                'cursor-not-allowed bg-slate-50 text-slate-600',
                                                            slugManuallyEdited &&
                                                                'border-amber-400 focus:border-amber-500 focus-visible:ring-amber-200',
                                                        )}
                                                        {...field}
                                                        ref={slugInputRef}
                                                        onChange={(e) =>
                                                            handleSlugInputChange(e.target.value)
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    aria-pressed={isSlugEditing}
                                                    onClick={toggleSlugEditing}
                                                    className="h-11 shrink-0 border-slate-300 px-3 font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    {isSlugEditing ? 'Editando' : 'Editar'}
                                                </Button>
                                            </div>
                                            <div className="flex items-start gap-1.5">
                                                {slugManuallyEdited && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                aria-label="Slug modificado manualmente"
                                                                className="mt-0.5 inline-flex"
                                                            >
                                                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            Slug modificado manualmente
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {slugManuallyEdited ? (
                                                    <FormDescription className="font-medium text-amber-600">
                                                        Slug modificado manualmente: ya no se
                                                        actualizará al cambiar el nombre.
                                                    </FormDescription>
                                                ) : (
                                                    <FormDescription>
                                                        Se genera automáticamente desde el nombre
                                                        del centro.
                                                    </FormDescription>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500">
                                                Tu centro estará disponible en{' '}
                                                <span className="font-semibold text-slate-700">
                                                    {(watchedSlug || 'mi-centro')}.
                                                    {platformDomain()}
                                                </span>
                                            </p>
                                            <FieldError />
                                        </FormItem>
                                    )}
                                />

                                {globalError && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                                    >
                                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                                        <p className="text-sm font-medium text-red-700">
                                            {globalError}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || emailState !== 'available'}
                                        className="h-12 w-full bg-slate-900 text-base font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98]"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2
                                                    className="animate-spin"
                                                    aria-hidden="true"
                                                />
                                                Completando registro...
                                            </>
                                        ) : (
                                            'Completar'
                                        )}
                                    </Button>
                                    {emailState !== 'available' && (
                                        <p className="text-center text-xs text-slate-500">
                                            {emailState === 'blocked'
                                                ? 'Usa otro correo para registrar un centro.'
                                                : 'Valida tu correo electrónico para habilitar el registro.'}
                                        </p>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CenterRegistrationView;
