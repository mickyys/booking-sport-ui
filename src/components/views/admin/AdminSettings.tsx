"use client";
"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Settings, Save, Globe, Clock, Percent, AlertTriangle, CheckCircle, Info, CreditCard, Upload, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';
import { uploadImageToCloudinary } from '@/components/booking/CourtImageUpload';

interface AdminSettingsProps {
    sportCenter: any;
    onSave?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ sportCenter, onSave }) => {
    const [slug, setSlug] = useState('');
    const [cancellationHours, setCancellationHours] = useState<number>(3);
    const [retentionPercent, setRetentionPercent] = useState<number>(10);
    const [partialPaymentEnabled, setPartialPaymentEnabled] = useState<boolean>(false);
    const [partialPaymentPercent, setPartialPaymentPercent] = useState<number>(50);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [localImagePreview, setLocalImagePreview] = useState<string | null>(null);
    const [localImageFile, setLocalImageFile] = useState<File | null>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const { updateSportCenterSettings, updateSportCenter, fetchSportCenterByID, isLoading } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no puede superar 5MB');
            return;
        }
        setLocalImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setLocalImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setLocalImageFile(null);
        setLocalImagePreview(null);
    };

    useEffect(() => {
        const loadSportCenter = async () => {
            const id = sportCenter?.id || sportCenter?._id;
            if (!id) return;
            setLoadingData(true);
            try {
                const center = await fetchSportCenterByID(id, getAccessTokenSilently);
                if (center) {
                    setSlug(center.slug || '');
                    setCancellationHours(center.cancellation_hours ?? 3);
                    setRetentionPercent(center.retention_percent ?? 10);
                    setPartialPaymentEnabled(center.partialPaymentEnabled ?? false);
                    setPartialPaymentPercent(center.partialPaymentPercent ?? 50);
                    setImageUrl(center.image_url || '');
                }
            } finally {
                setLoadingData(false);
            }
        };
        loadSportCenter();
    }, [sportCenter?.id, sportCenter?._id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sportCenter?.id && !sportCenter?._id) return;

        try {
            const id = sportCenter.id || sportCenter._id;
            let finalImageUrl = imageUrl;

            if (localImageFile) {
                setIsUploading(true);
                toast.info('Subiendo imagen...');
                finalImageUrl = await uploadImageToCloudinary(localImageFile);
            }

            await updateSportCenterSettings(id, {
                image_url: finalImageUrl,
                slug: slug,
                cancellation_hours: cancellationHours,
                retention_percent: retentionPercent,
                partialPaymentEnabled: partialPaymentEnabled,
                partialPaymentPercent: partialPaymentPercent,
            }, getAccessTokenSilently);

            setLocalImageFile(null);
            setLocalImagePreview(null);
            setImageUrl(finalImageUrl);
            toast.success("Configuración actualizada con éxito");
            if (onSave) onSave();
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error al actualizar la configuración");
        } finally {
            setIsUploading(false);
        }
    };

    if (!sportCenter) return <div>No se encontró información del centro deportivo.</div>;
    if (loadingData) return <div className="flex justify-center p-8 text-slate-500">Cargando configuración...</div>;

    const refundPercent = 100 - retentionPercent;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* General Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Configuración General del Club</h3>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Imagen del Club
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
                            className="hidden"
                            id="club-image-upload"
                        />
                        
                        {localImagePreview || imageUrl ? (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                <img 
                                    src={localImagePreview || imageUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label
                                htmlFor="club-image-upload"
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all"
                            >
                                <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Haz clic para subir una imagen</span>
                                <span className="text-xs text-slate-400 mt-1">PNG, JPG hasta 5MB</span>
                            </label>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                            Esta imagen se visualiza en la página principal del club
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Subdominio (Slug)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Globe className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-mono text-sm"
                                placeholder="ej: orellana"
                                required
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                            Esto se usará para acceder directamente via <span className="font-bold">{slug || 'tu-club'}.reservaloya.cl</span>
                        </p>
                    </div>

                    {/* Cancellation Policy Section */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <h4 className="text-base font-bold text-slate-900">Política de Cancelación y Devolución</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">
                            Configura las reglas de devolución cuando un usuario cancela una reserva.
                        </p>

                        <div className="space-y-5">
                            {/* Cancellation Hours */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Clock className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Horas límite para devolución completa
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={168}
                                        value={cancellationHours}
                                        onChange={(e) => setCancellationHours(Math.max(0, Math.min(168, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">horas antes del partido</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Si el usuario cancela con {cancellationHours} horas o más de anticipación, recibirá el <strong>100%</strong> de devolución.
                                </p>
                            </div>

                            {/* Retention Percent */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Percent className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Porcentaje de retención por cancelación tardía
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={retentionPercent}
                                        onChange={(e) => setRetentionPercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">% de retención</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Si el usuario cancela con menos de {cancellationHours} horas, se retiene el <strong>{retentionPercent}%</strong> del pago {retentionPercent === 100 ? '(sin devolución)' : `y se devuelve el ${refundPercent}%`}.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Policy Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-bold text-slate-700">Vista previa — Lo que verá el usuario</span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-slate-700">
                                    <span className="font-bold text-slate-900">Cancelación con {cancellationHours}+ horas de anticipación:</span>{' '}
                                    Devolución del <span className="font-bold text-emerald-600">100%</span> del pago.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                                <p className="text-sm text-slate-700">
                                    <span className="font-bold text-slate-900">Cancelación con menos de {cancellationHours} horas:</span>{' '}
                                    {retentionPercent === 100 ? (
                                        <span className="font-bold text-red-600">Sin devolución (retención del 100%).</span>
                                    ) : retentionPercent === 0 ? (
                                        <span className="font-bold text-emerald-600">Devolución del 100% (sin retención).</span>
                                    ) : (
                                        <>
                                            Se retiene el <span className="font-bold text-amber-600">{retentionPercent}%</span> y se devuelve el <span className="font-bold text-emerald-600">{refundPercent}%</span>.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>


                    {/* Partial Payment Settings */}
                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-blue-500" />
                            <h4 className="text-base font-bold text-slate-900">Pagos Parciales (Abonos)</h4>
                        </div>
                        <p className="text-sm text-slate-500 mb-5">
                            Permite que los usuarios paguen solo un porcentaje de la reserva online y el resto en el local.
                        </p>

                        <div className="space-y-5">
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-bold text-slate-900">Activar pagos parciales</label>
                                    <p className="text-xs text-slate-500 text-balance">Los usuarios podrán elegir pagar un abono al reservar.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPartialPaymentEnabled(!partialPaymentEnabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                        partialPaymentEnabled ? 'bg-slate-900' : 'bg-slate-200'
                                    }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            partialPaymentEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>

                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    <Percent className="w-4 h-4 inline mr-1.5 text-slate-400" />
                                    Porcentaje de abono requerido
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min={1}
                                        max={99}
                                        value={partialPaymentPercent}
                                        onChange={(e) => setPartialPaymentPercent(Math.max(1, Math.min(99, Number(e.target.value))))}
                                        className="w-28 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all text-center text-lg font-bold"
                                    />
                                    <span className="text-sm text-slate-600">% del total</span>
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    El usuario pagará el {partialPaymentPercent}% al momento de reservar y el {100 - partialPaymentPercent}% restante en el club.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isLoading || isUploading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
