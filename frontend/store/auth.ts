import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'agent' | 'customer' | 'admin';
  isVerified?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return { user: null, token: null };
  }

  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    try {
      return { token, user: JSON.parse(user) };
    } catch (e) {
      console.error('Failed to parse user:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { user: null, token: null };
    }
  }

  return { user: null, token: null };
};

export const useAuthStore = create<AuthStore>((set) => {
  const initialState = getInitialState();

  return {
    ...initialState,
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
    initialize: () => {
      const state = getInitialState();
      set(state);
    },
  };
});
