import { useCallback, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getMyPhone, saveMyPhone } from '../api/bookingApi';

const tokenOptions = () => ({
  authorizationParams: { audience: process.env.NEXT_PUBLIC_APP_AUTH0_AUDIENCE },
});

// Teléfono guardado del usuario logeado. Para invitados no consulta nada:
// `phone` queda vacío y `savePhone` no hace nada.
export const useSavedPhone = (enabled: boolean) => {
  const { getAccessTokenSilently } = useAuth0();
  const [phone, setPhone] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setPhone('');
      setLoaded(false);
      return;
    }
    let cancelled = false;
    getAccessTokenSilently(tokenOptions())
      .then((token) => getMyPhone(token))
      .then((saved) => { if (!cancelled) setPhone(saved); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [enabled, getAccessTokenSilently]);

  const savePhone = useCallback(async (value: string) => {
    if (!enabled || !value) return;
    try {
      const token = await getAccessTokenSilently(tokenOptions());
      setPhone(await saveMyPhone(token, value));
    } catch (error) {
      console.error('No se pudo guardar el teléfono', error);
    }
  }, [enabled, getAccessTokenSilently]);

  return { phone, loaded, savePhone };
};
