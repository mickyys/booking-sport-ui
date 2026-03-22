import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useBookingStore } from '../../store/useBookingStore';
import { useAuth0 } from '@auth0/auth0-react';

interface AdminSettingsProps {
    sportCenter: any;
    onSave?: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ sportCenter, onSave }) => {
    const [name, setName] = useState(sportCenter?.name || '');
    const [slug, setSlug] = useState(sportCenter?.slug || '');
    const { updateSportCenter, isLoading } = useBookingStore();
    const { getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        if (sportCenter) {
            setName(sportCenter.name || '');
            setSlug(sportCenter.slug || '');
        }
    }, [sportCenter]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sportCenter?.id && !sportCenter?._id) return;

        try {
            const id = sportCenter.id || sportCenter._id;
            await updateSportCenter(id, { name, slug }, getAccessTokenSilently);
            toast.success("Configuración actualizada con éxito");
            if (onSave) onSave();
        } catch (error) {
            toast.error("Error al actualizar la configuración");
        }
    };

    if (!sportCenter) return <div>No se encontró información del centro deportivo.</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Configuración General del Club</h3>
                </div>

                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nombre del Club
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            placeholder="Ej: Club Orellana"
                            required
                        />
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

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" />
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
