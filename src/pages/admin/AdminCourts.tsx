import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
// @ts-ignore
import CourtFormModal from '../../components/booking/CourtFormModal';
import { Court } from '../../types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface AdminCourtsProps {
    courts: Court[];
    onSaveCourt: (court: Court) => void;
    onDeleteCourt: (courtId: number | string) => void;
}

export const AdminCourts: React.FC<AdminCourtsProps> = ({ 
    courts, 
    onSaveCourt, 
    onDeleteCourt 
}) => {
    const [editingCourt, setEditingCourt] = useState<Court | null>(null);
    const [showCourtForm, setShowCourtForm] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [courtIdToDelete, setCourtIdToDelete] = useState<number | string | null>(null);

    const handleSaveCourt = (court: Court) => {
        onSaveCourt(court);
        setShowCourtForm(false);
        setEditingCourt(null);
    };

    const handleEditCourt = (court: Court) => {
        setEditingCourt(court);
        setShowCourtForm(true);
    };

    const handleDeleteCourt = (courtId: number | string) => {
        setCourtIdToDelete(courtId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (courtIdToDelete) {
            onDeleteCourt(courtIdToDelete);
            setIsDeleteDialogOpen(false);
            setCourtIdToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">Gestión de Canchas</h3>
                <button
                    onClick={() => { setEditingCourt(null); setShowCourtForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Cancha
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courts.map((court: any) => (
                    <div key={court.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <img src={court.image} alt={court.name} className="w-full h-40 object-cover" />
                        <div className="p-6">
                            <h4 className="font-bold text-lg text-slate-900 mb-1">{court.name}</h4>
                            <p className="text-sm text-slate-500 mb-4">{court.type}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEditCourt(court)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDeleteCourt(court.id)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {showCourtForm && (
                    <CourtFormModal
                        court={editingCourt}
                        onClose={() => { setShowCourtForm(false); setEditingCourt(null); }}
                        onSave={handleSaveCourt}
                    />
                )}
            </AnimatePresence>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="bg-white rounded-2xl border-slate-200 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-500" />
                            ¿Confirmar eliminación?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500">
                            Esta acción no se puede deshacer. Se eliminará la cancha y toda su disponibilidad asociada de forma permanente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3">
                        <AlertDialogCancel className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDelete}
                            className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Eliminar ahora
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
