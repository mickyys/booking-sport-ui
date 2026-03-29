import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Grid, List, CheckCircle, CreditCard } from 'lucide-react';
import { format, startOfToday, addDays, setHours, setMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { TimeSlot, UserProfile, SportCenter, Court, CourtWithSchedule } from '../types';
import { useBookingStore } from '../store/useBookingStore';

interface BookingViewProps {
  onBookSlot: (slot: TimeSlot) => void;
  user: UserProfile | null;
  slots: TimeSlot[];
  selectedCenter: string | null;
  onCenterChange: (centerId: string | null) => void;
  sportCenters: SportCenter[];
  courts: Court[];
}

export const BookingView: React.FC<BookingViewProps> = ({
  onBookSlot,
  user,
  slots: mockSlots,
  selectedCenter,
  onCenterChange,
  sportCenters,
  courts
}) => {
  const { schedules, isLoading, fetchSchedules } = useBookingStore();
  const [selectedDay, setSelectedDay] = useState<Date>(startOfToday());

  // Efecto para recargar horarios cuando cambia el día o el centro
  useEffect(() => {
    if (selectedCenter) {
      const formattedDate = format(selectedDay, 'yyyy-MM-dd');
      console.log('Fetching schedules for center:', selectedCenter, 'and date:', formattedDate);  
      fetchSchedules(selectedCenter, formattedDate);
    }
  }, [selectedDay, selectedCenter, fetchSchedules]);

  const courtsForCenter = useMemo(() =>
    courts.filter(c => c.centerId === selectedCenter),
    [courts, selectedCenter]
  );

  const [selectedCourtId, setSelectedCourtId] = useState<string>(courtsForCenter[0]?.id || '');
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  // Actualizar la cancha seleccionada si cambia el centro
  useEffect(() => {
    if (courtsForCenter.length > 0 && (!selectedCourtId || !courtsForCenter.find(c => c.id === selectedCourtId))) {
      setSelectedCourtId(courtsForCenter[0].id);
    }
  }, [courtsForCenter, selectedCourtId]);

  const apiSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    schedules.forEach(courtSchedule => {
      courtSchedule.schedule.forEach(slot => {
        const date = setMinutes(setHours(selectedDay, slot.hour), 0);
        let status = slot.status;

        // Check if the slot has already passed
        if (date < new Date() && status === 'available') {
          status = 'passed';
        }

        slots.push({
          id: `${courtSchedule.id}-${format(date, 'yyyy-MM-dd')}-${slot.hour}`,
          courtId: courtSchedule.id,
          centerId: selectedCenter || '',
          date,
          status: status,
          price: slot.price,
          paymentRequired: slot.paymentRequired,
          paymentOptional: slot.paymentOptional
        });
      });
    });
    return slots;
  }, [schedules, selectedDay, selectedCenter]);

  const filteredSlots = useMemo(() => {
    return apiSlots.filter(s => s.courtId === selectedCourtId);
  }, [apiSlots, selectedCourtId]);

  // Auto-scroll al primer horario disponible
  useEffect(() => {
    if (!isLoading && apiSlots.length > 0) {
      // Pequeño delay para asegurar que el DOM se ha renderizado
      const timer = setTimeout(() => {
        let elementId = '';
        if (viewMode === 'single') {
          const firstAvailable = filteredSlots.find(s => s.status === 'available');
          if (firstAvailable) elementId = `slot-${firstAvailable.id}`;
        } else {
          // En modo 'all' buscamos la primera hora que tenga al menos una cancha disponible
          const firstAvailableHour = hours.find(h =>
            apiSlots.some(s => s.date.getHours() === h && s.status === 'available')
          );
          if (firstAvailableHour !== undefined) elementId = `hour-${firstAvailableHour}`;
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, selectedDay, selectedCenter, viewMode, selectedCourtId]); // Se activa al cargar o cambiar filtros

  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));
  const hours = Array.from({ length: 19 }, (_, i) => 6 + i); // 6 to 24

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    onBookSlot(slot);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Reserva tu Horario</h2>
        {!user && (
          <p className="text-slate-500">
            Puedes reservar como invitado o <button className="text-emerald-600 font-bold hover:underline">iniciar sesión</button> para guardar tu historial.
          </p>
        )}
      </div>

      {/* Center Selector */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {sportCenters.map(center => (
          <button
            key={center.id}
            onClick={() => {
              onCenterChange(center.id);
              const newCourts = courts.filter(c => c.centerId === center.id);
              if (newCourts.length > 0) {
                setSelectedCourtId(newCourts[0].id);
              }
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCenter === center.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-400'
              }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" />
            {center.name}
          </button>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-100 p-1 rounded-xl flex">
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            <Grid className="w-4 h-4" />
            Por Cancha
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'all' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }`}
          >
            <List className="w-4 h-4" />
            Ver Todo
          </button>
        </div>
      </div>

      {/* Selector de días */}
      <div className="flex overflow-x-auto pb-4 gap-3 mb-8 no-scrollbar justify-start md:justify-center px-2">
        {days.map((day) => {
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd');
          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                console.log('Selected day:', day);
                setSelectedDay(day)
              }}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] h-20 rounded-2xl border transition-all ${isSelected
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:bg-slate-50'
                }`}
            >
              <span className="text-xs uppercase font-bold tracking-wider mb-1">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-xl font-bold">
                {format(day, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {viewMode === 'single' ? (
        <>
          {/* Selector de Canchas */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {courtsForCenter.map(court => (
              <button
                key={court.id}
                onClick={() => setSelectedCourtId(court.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all ${selectedCourtId === court.id
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
                  }`}
              >
                <div className="text-left">
                  <span className="block font-bold text-sm">{court.name}</span>
                  <span className="text-xs opacity-75">{court.type}</span>
                </div>
                {selectedCourtId === court.id && <CheckCircle className="w-5 h-5 text-emerald-500" />}
              </button>
            ))}
          </div>

          {/* Grid de Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSlots.map((slot) => {
              return (
                <motion.div
                  key={slot.id}
                  id={`slot-${slot.id}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${slot.status === 'available'
                      ? 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-lg cursor-pointer group'
                      : 'bg-slate-50 border-slate-100 opacity-60 cursor-not-allowed'
                    }`}
                  onClick={() => handleSlotClick(slot)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${slot.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      <Clock className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${slot.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        }`}>
                        {slot.status === 'available' ? 'Disponible' : (slot.status === 'passed' ? 'No disponible' : 'Reservado')}
                      </span>
                      {slot.status === 'available' && slot.paymentRequired && (
                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1 tracking-tighter border border-indigo-100 italic">
                          <CreditCard className="w-3 h-3" /> Pago requerido para reservar
                        </span>
                      )}
                      {slot.status === 'available' && !slot.paymentRequired && slot.paymentOptional && (
                        <span className="text-[10px] font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 tracking-tighter border border-amber-100 italic">
                          <CreditCard className="w-3 h-3" /> Pago opcional
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-1">
                    {format(slot.date, 'HH:mm')}
                  </h3>
                  <p className="text-slate-500 text-sm mb-4">
                    {courts.find(c => c.id === slot.courtId)?.name}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-slate-900 text-lg">${slot.price.toLocaleString('es-CL')}</span>
                    {slot.status === 'available' && (
                      <span className="text-emerald-500 font-medium group-hover:translate-x-1 transition-transform flex items-center">
                        Reservar →
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          {filteredSlots.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              No hay horarios disponibles para este día.
            </div>
          )}
        </>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full text-center">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-slate-500 font-medium w-24">Horario</th>
                {courtsForCenter.map(court => (
                  <th key={court.id} className="p-4 text-slate-900 font-bold min-w-[200px]">
                    {court.shortName}
                    <div className="text-xs font-normal text-slate-500">{court.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hours.map(hour => {
                return (
                  <tr key={hour} id={`hour-${hour}`} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-medium text-slate-500 border-r border-slate-100">
                      <div>{hour}:00</div>
                    </td>
                    {courtsForCenter.map(court => {
                      const slot = apiSlots.find(s => s.courtId === court.id && s.date.getHours() === hour);
                      const isAvailable = slot?.status === 'available';

                      return (
                        <td key={`${court.id}-${hour}`} className="p-2">
                          {slot ? (
                            <button
                              onClick={() => slot && handleSlotClick(slot)}
                              disabled={!isAvailable}
                              className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${isAvailable
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white hover:shadow-md'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                              {isAvailable ? 'Disponible' : (slot?.status === 'passed' ? 'No disp.' : 'Reservado')}
                            </button>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
              <p className="text-emerald-600 font-bold animate-pulse">Cargando Horarios...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
