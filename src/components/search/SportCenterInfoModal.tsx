import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { MapPin, Phone, Mail, Info, Clock } from 'lucide-react';
import { SportCenter } from '../../types';

interface SportCenterInfoModalProps {
  center: SportCenter;
  isOpen: boolean;
  onClose: () => void;
}

const SportCenterInfoModal: React.FC<SportCenterInfoModalProps> = ({ center, isOpen, onClose }) => {
  // Use coordinates if available, otherwise use address for Google Maps
  const mapUrl = center.coordinates
    ? `https://maps.google.com/maps?q=${center.coordinates.lat},${center.coordinates.lng}&z=15&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(center.address)}&z=15&output=embed`;

  const contactPhone = center.contact?.phone || center.phone;
  const contactEmail = center.contact?.email || center.email;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col">
          {/* Map at the top */}
          <div className="w-full h-64 bg-slate-100 relative">
            <iframe
              title="Google Maps"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              src={mapUrl}
              allowFullScreen
              loading="lazy"
            />
          </div>

          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-bold text-slate-900">{center.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">Dirección</h4>
                  <p className="text-slate-600 leading-relaxed">{center.address}</p>
                </div>
              </div>

              {/* Contact Information */}
              {(contactPhone || contactEmail) && (
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    Información de Contacto
                  </h4>
                  <div className="space-y-3">
                    {contactPhone && (
                      <div className="flex items-center gap-4 group">
                        <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Phone className="w-5 h-5" />
                        </div>
                        <a
                          href={`tel:${contactPhone}`}
                          className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                        >
                          {contactPhone}
                        </a>
                      </div>
                    )}
                    {contactEmail && (
                      <div className="flex items-center gap-4 group">
                        <div className="bg-slate-50 p-2.5 rounded-xl text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                          <Mail className="w-5 h-5" />
                        </div>
                        <a
                          href={`mailto:${contactEmail}`}
                          className="text-slate-600 hover:text-emerald-600 font-medium transition-colors"
                        >
                          {contactEmail}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Política de Cancelación */}
              {(center.cancellationHours !== undefined) && (
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    Política de Cancelación
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {center.retentionPercent === 100 ? (
                        <>
                          Si cancelas con menos de <span className="font-bold text-slate-900">{center.cancellationHours} horas</span> de anticipación, <span className="text-red-600 font-medium">no se realizará el reembolso</span> del pago.
                        </>
                      ) : (
                        <>
                          Si cancelas con menos de <span className="font-bold text-slate-900">{center.cancellationHours} horas</span> de anticipación, recibirás un reembolso del <span className="font-bold text-emerald-600">{100 - (center.retentionPercent || 0)}%</span> del pago.
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 mt-2 italic">
                      Las cancelaciones con más de {center.cancellationHours} horas de antelación reciben el reembolso completo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SportCenterInfoModal;
