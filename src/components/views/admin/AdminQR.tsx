"use client";
"use client";
import React, { useEffect, useState } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { Download, Copy, Share2, Globe, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useBookingStore } from '@/store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';

interface AdminQRProps {
    sportCenter: any;
}

export const AdminQR: React.FC<AdminQRProps> = ({ sportCenter: initialSportCenter }) => {
    const { getAccessTokenSilently } = useAuth0();
    const fetchSportCenterByID = useBookingStore(state => state.fetchSportCenterByID);
    const [sportCenter, setSportCenter] = useState(initialSportCenter);
    const [isLoading, setIsLoading] = useState(!initialSportCenter);

    useEffect(() => {
        if (!sportCenter && !isLoading) {
            const loadSportCenter = async () => {
                setIsLoading(true);
                try {
                    const center = await fetchSportCenterByID('my', getAccessTokenSilently);
                    if (center) {
                        setSportCenter(center);
                    }
                } catch (error) {
                    console.error('Error fetching sport center:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            loadSportCenter();
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-4" />
                <p>Cargando...</p>
            </div>
        );
    }

    if (!sportCenter) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Info className="w-12 h-12 mb-4 text-slate-300" />
                <p>No se encontró información del centro deportivo para generar el QR.</p>
            </div>
        );
    }

    const slug = sportCenter.slug || '';
    const bookingUrl = `https://reservaloya.cl/${slug}/reservar`;

    const downloadQR = () => {
        const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        const pngUrl = canvas
            .toDataURL("image/png")
            .replace("image/png", "image/octet-stream");

        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr-reservaloya-${slug}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success("QR descargado con éxito");
    };

    const copyToClipboard = async () => {
        const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const item = new ClipboardItem({ "image/png": blob });
                await navigator.clipboard.write([item]);
                toast.success("QR copiado al portapapeles");
            });
        } catch (err) {
            console.error(err);
            toast.error("Error al copiar el QR");
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(bookingUrl);
        toast.success("Link copiado al portapapeles");
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Código QR de Reservas</h2>
                    <p className="text-slate-500 mt-1">Comparte este código para que tus clientes reserven directamente.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* QR Preview Card */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col items-center justify-center space-y-6">
                    <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 relative group">
                        {/* Hidden canvas for export */}
                        <div className="hidden">
                            <QRCodeCanvas
                                id="qr-canvas"
                                value={bookingUrl}
                                size={1024}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        {/* SVG for display */}
                        <QRCodeSVG
                            value={bookingUrl}
                            size={240}
                            level="H"
                            includeMargin={true}
                            className="drop-shadow-sm"
                        />
                    </div>

                    <div className="w-full space-y-3">
                        <button
                            onClick={downloadQR}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            <Download className="w-5 h-5" />
                            Descargar Imagen (PNG)
                        </button>
                        <button
                            onClick={copyToClipboard}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            <Copy className="w-5 h-5" />
                            Copiar QR al Portapapeles
                        </button>
                    </div>
                </div>

                {/* Info & Link Card */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-3 text-slate-900 font-bold border-b border-slate-100 pb-4">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <Globe className="w-5 h-5" />
                            </div>
                            Tu Link de Reservas
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 break-all font-mono text-sm text-slate-600 flex justify-between items-center gap-3">
                            <span className="truncate">{bookingUrl}</span>
                            <button
                                onClick={copyLink}
                                className="shrink-0 p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                title="Copiar link"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>

                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            Ver mi página de reservas
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg shrink-0">
                                <Share2 className="w-5 h-5" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-bold text-amber-900">¿Cómo usarlo?</h4>
                                <ul className="text-sm text-amber-800 space-y-2 list-disc pl-4">
                                    <li><strong>Imprímelo:</strong> Ponlo en el mostrador o recepción de tu club.</li>
                                    <li><strong>Redes Sociales:</strong> Úsalo en tus historias de Instagram o como foto de perfil.</li>
                                    <li><strong>WhatsApp:</strong> Envíalo a tus clientes habituales para que reserven más rápido.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
