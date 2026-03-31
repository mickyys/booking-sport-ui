import { SportCenter, Court } from '../types';

export const SPORT_CENTERS: SportCenter[] = [
  {
    id: "1",
    name: "GolazoHub Las Condes",
    slug: "las-condes",
    location: "Las Condes",
    address: "Av. del Deporte 1234, Las Condes, Santiago",
    contact: {
      phone: "+56 9 1234 5678",
      email: "lascondes@golazohub.cl"
    },
    coordinates: { lat: -33.41, lng: -70.58 },
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000",
    services: ["Parking", "Cafe"]
  },
  {
    id: "2",
    name: "GolazoHub Huechuraba",
    slug: "huechuraba",
    location: "Huechuraba",
    address: "Av. Recoleta Norte 456, Huechuraba, Santiago",
    contact: {
      phone: "+56 9 8765 4321",
      email: "huechuraba@golazohub.cl"
    },
    coordinates: { lat: -33.37, lng: -70.67 },
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=1000",
    services: ["Parking", "Showers"]
  },
  {
    id: "3",
    name: "GolazoHub La Florida",
    slug: "la-florida",
    location: "La Florida",
    address: "Av. Vicuña Mackenna 789, La Florida, Santiago",
    contact: {
      phone: "+56 9 5555 9999",
      email: "laflorida@golazohub.cl"
    },
    coordinates: { lat: -33.52, lng: -70.59 },
    image: "https://images.unsplash.com/photo-1647118868186-70d38e10b0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXRzYWwlMjBjb3VydCUyMHNvY2NlciUyMG5pZ2h0JTIwbGlnaHRzfGVufDF8fHx8MTc3MDgyMzk5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    services: ["Cafe", "Shop"]
  }
];

export const COURTS: Court[] = [
  // Las Condes
  { 
    id: "1",
    name: "Cancha Principal (Techada)", 
    shortName: "Cancha 1",
    type: "Pasto Sintético PRO",
    image: "https://images.unsplash.com/photo-1647118868186-70d38e10b0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXRzYWwlMjBjb3VydCUyMHNvY2NlciUyMG5pZ2h0JTIwbGlnaHRzfGVufDF8fHx8MTc3MDgyMzk5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    centerId: "1"
  },
  { 
    id: "2",
    name: "Cancha Exterior Norte", 
    shortName: "Cancha 2",
    type: "Pasto Natural Reforzado",
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=1000",
    centerId: "1"
  },
  { 
    id: "3",
    name: "Cancha Exterior Sur", 
    shortName: "Cancha 3",
    type: "Futbolito 5v5 Rápido",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000",
    centerId: "1"
  },
  // Huechuraba
  { 
    id: "4",
    name: "Cancha Premium", 
    shortName: "Cancha 1",
    type: "Césped Sintético Elite",
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=1000",
    centerId: "2"
  },
  { 
    id: "5",
    name: "Cancha Express", 
    shortName: "Cancha 2",
    type: "Futbolito Rápido 5v5",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000",
    centerId: "2"
  },
  // La Florida
  { 
    id: "6",
    name: "Cancha Central", 
    shortName: "Cancha 1",
    type: "Pasto Sintético Premium",
    image: "https://images.unsplash.com/photo-1647118868186-70d38e10b0dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXRzYWwlMjBjb3VydCUyMHNvY2NlciUyMG5pZ2h0JTIwbGlnaHRzfGVufDF8fHx8MTc3MDgyMzk5OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    centerId: "3"
  },
  { 
    id: "7",
    name: "Cancha Norte", 
    shortName: "Cancha 2",
    type: "Futbolito Techado",
    image: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=1000",
    centerId: "3"
  },
  { 
    id: "8",
    name: "Cancha Sur", 
    shortName: "Cancha 3",
    type: "Pasto Natural Profesional",
    image: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1000",
    centerId: "3"
  },
];
