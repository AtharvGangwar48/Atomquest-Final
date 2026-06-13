import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'customer';
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (token && user) {
    useAuthStore.setState({ token, user: JSON.parse(user) });
  }
}
