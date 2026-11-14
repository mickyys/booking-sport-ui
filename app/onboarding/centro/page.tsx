import type { Metadata } from 'next';

import CenterRegistrationView from '@/components/views/onboarding/CenterRegistrationView';

export const metadata: Metadata = {
  title: 'Registra tu centro deportivo | ReservaloYA',
  description:
    'Crea la página pública de tu centro deportivo, obtén tu propia dirección web y empieza a recibir reservas online.',
};

export default function OnboardingCentroPage() {
  return <CenterRegistrationView />;
}
