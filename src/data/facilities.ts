// ─── Tipos de facilities (arriendo de canchas como sedes/piscinas/quinchos) ───
// Los datos vienen del backend (booking-sport) vía GET /sport-centers/slug/{slug}/facilities.

import { getFacilitiesBySlug } from '@/api/bookingApi';

export interface QuinchoFacility {
  id: string;
  name: string;
  description: string;
  image: string;
  capacity: number;
  area: string;
  features: string[];
  priceAllDay: number;
  priceHalfDay: number;
  openHour: number;
  closeHour: number;
}

export type MonthlyFacilityType = 'sede' | 'piscina';

export interface MonthlyFacility {
  id: string;
  type: MonthlyFacilityType;
  name: string;
  description: string;
  image: string;
  capacity: number;
  area: string;
  features: string[];
  pricePerDay: number;
  pricePerMonth: number;
  minMonths: number;
  maxMonths: number;
  availableMonths: number[];
  depositMonths: number;
}

export interface FacilityCatalog {
  quinchos: QuinchoFacility[];
  monthlyFacilities: MonthlyFacility[];
}

// Mapea la entidad plana del backend (con discriminador `type`) al catálogo de la UI.
function mapFacilities(list: any[]): FacilityCatalog {
  const quinchos: QuinchoFacility[] = [];
  const monthlyFacilities: MonthlyFacility[] = [];
  (list || []).forEach((f: any) => {
    if (f.type === 'quincho') {
      quinchos.push({
        id: f.id || f._id,
        name: f.name,
        description: f.description || '',
        image: f.image_url || f.image || '',
        capacity: f.capacity || 0,
        area: f.area || '',
        features: f.features || [],
        priceAllDay: f.price_all_day || 0,
        priceHalfDay: f.price_half_day || 0,
        openHour: f.open_hour || 9,
        closeHour: f.close_hour || 22,
      });
    } else if (f.type === 'sede' || f.type === 'piscina') {
      monthlyFacilities.push({
        id: f.id || f._id,
        type: f.type,
        name: f.name,
        description: f.description || '',
        image: f.image_url || f.image || '',
        capacity: f.capacity || 0,
        area: f.area || '',
        features: f.features || [],
        pricePerDay: f.price_per_day || 0,
        pricePerMonth: f.price_per_month || 0,
        minMonths: f.min_months || 1,
        maxMonths: f.max_months || 12,
        availableMonths: f.available_months || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        depositMonths: f.deposit_months || 1,
      });
    }
  });
  return { quinchos, monthlyFacilities };
}

// Carga facilities reales del backend. Si el centro no tiene facilities o la
// API falla, se devuelve un catálogo vacío (la UI oculta las secciones).
export async function fetchFacilitiesForSlug(slug: string): Promise<FacilityCatalog> {
  try {
    const res = await getFacilitiesBySlug(slug);
    return mapFacilities(res?.facilities || []);
  } catch {
    return { quinchos: [], monthlyFacilities: [] };
  }
}