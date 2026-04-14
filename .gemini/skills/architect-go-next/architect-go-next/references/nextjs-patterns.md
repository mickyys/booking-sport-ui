# Next.js & React 19 Patterns

Estándares para aplicaciones Next.js escalables.

## 1. Validación con Zod e Inferencias
```typescript
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

export type UserDTO = z.infer<typeof UserSchema>;
```

## 2. Server Action con Validación de Tipos
```typescript
'use server'

import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  const validated = ProfileSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten() };
  }

  // Lógica de negocio/API call
  await api.update(validated.data);
  revalidatePath('/profile');
}
```

## 3. Composición de Componentes (RSC vs Client)
- **Server Component (Default):** Fetching de datos, acceso a DB, secretos.
- **Client Component ('use client'):** Event listeners, Hooks de React (useState, useEffect), Browser APIs.

## 4. State Management (Zustand + Persistencia)
```typescript
interface Store {
  count: number;
  inc: () => void;
}

export const useStore = create<Store>()(
  persist((set) => ({
    count: 0,
    inc: () => set((state) => ({ count: state.count + 1 })),
  }), { name: 'app-storage' })
);
```
