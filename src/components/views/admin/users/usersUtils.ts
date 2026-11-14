export interface CenterUser {
  user_id: string;
  name: string;
  email: string;
  picture: string;
  last_login?: string;
}

export const getDisplayName = (user: CenterUser): string => user.name || user.email || 'Sin nombre';

export const getInitials = (user: CenterUser): string => {
  const parts = getDisplayName(user).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const formatLastLogin = (value?: string): string => {
  if (!value) return 'Sin ingresos';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin ingresos';
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const filterUsers = (users: CenterUser[], query: string): CenterUser[] => {
  const term = query.trim().toLowerCase();
  if (!term) return users;
  return users.filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(term));
};
