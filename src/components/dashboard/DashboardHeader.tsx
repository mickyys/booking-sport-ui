import React from 'react';
import { Settings, Star, Info } from 'lucide-react';
import { UserProfile } from '../../types';

interface CancellationPolicy {
    hours: number;
    retention_percent: number;
}

interface DashboardHeaderProps {
    user: UserProfile;
    cancellationPolicy?: CancellationPolicy | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user, cancellationPolicy = null }) => {
    return (
        <div className="flex flex-col gap-4 mb-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-8">
                <div className="relative">
                    <img src={user.avatar} alt={user.name} className="w-32 h-32 rounded-full border-4 border-slate-100" />
                    <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-2 rounded-full border-4 border-white">
                        <Star className="w-5 h-5 fill-current" />
                    </div>
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="capitalize text-3xl font-bold text-slate-900 mb-2">Hola, {user.name}</h2>
                    <p className="text-slate-500 mb-6">{user.email}</p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                            <span className="block text-2xl font-bold text-slate-900">{user.stats?.matchesPlayed || 0}</span>
                            <span className="text-sm text-slate-500">Reservas finalizadas</span>
                        </div>                    
                    </div>
                </div>            
            </div>

           
        </div>
    );
};
