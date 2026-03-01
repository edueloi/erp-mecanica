import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('mecaerp_user') || 'null'),
  token: localStorage.getItem('mecaerp_token'),
  isAuthenticated: !!localStorage.getItem('mecaerp_token'),
  login: (user, token) => {
    localStorage.setItem('mecaerp_token', token);
    localStorage.setItem('mecaerp_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('mecaerp_token');
    localStorage.removeItem('mecaerp_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
