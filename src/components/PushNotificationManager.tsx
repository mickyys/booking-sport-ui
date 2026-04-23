'use client';

import { usePushNotifications } from '../hooks/usePushNotifications';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { BellOff, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth0 } from '@auth0/auth0-react';

export function PushNotificationManager() {
  const { permissionStatus } = usePushNotifications();
  const { isAuthenticated } = useAuth0();

  if (!isAuthenticated || permissionStatus !== 'denied') {
    return null;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <Alert variant="destructive" className="shadow-lg border-red-200 bg-white/95 backdrop-blur">
        <BellOff className="h-4 w-4" />
        <AlertTitle className="text-red-800">Notificaciones Bloqueadas</AlertTitle>
        <AlertDescription className="flex flex-col gap-3">
          <p className="text-red-700/90">
            Has bloqueado las notificaciones. Para recibir alertas de nuevas reservas y cambios importantes en tiempo real, por favor habilítalas en la configuración de tu navegador.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs border-red-200 text-red-800 hover:bg-red-50"
              onClick={() => window.open('https://support.google.com/chrome/answer/3220216', '_blank')}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              ¿Cómo habilitarlas?
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
