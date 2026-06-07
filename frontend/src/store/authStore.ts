import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    kycStatus: string;
    referralCode: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loginModalOpen: boolean;
  buyModalOpen: 'token' | 'coin' | null;
  
  // Actions
  setAuth: (user: User, token: string, refreshToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  setLoginModal: (open: boolean) => void;
  setBuyModal: (type: 'token' | 'coin' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage if client-side
  let initialUser = null;
  let initialToken = null;
  let initialRefresh = null;
  
  if (typeof window !== 'undefined') {
    try {
      initialUser = localStorage.getItem('mero_user') 
        ? JSON.parse(localStorage.getItem('mero_user')!) 
        : null;
      initialToken = localStorage.getItem('mero_token');
      initialRefresh = localStorage.getItem('mero_refresh_token');
    } catch (e) {
      console.error('Error reading auth state from localStorage', e);
    }
  }

  return {
    user: initialUser,
    token: initialToken,
    refreshToken: initialRefresh,
    isAuthenticated: !!initialToken,
    loginModalOpen: false,
    buyModalOpen: null,

    setAuth: (user, token, refreshToken) => {
      localStorage.setItem('mero_user', JSON.stringify(user));
      localStorage.setItem('mero_token', token);
      localStorage.setItem('mero_refresh_token', refreshToken);
      set({ user, token, refreshToken, isAuthenticated: true });
    },

    updateUser: (userData) => {
      set((state) => {
        if (!state.user) return state;
        const updated = { ...state.user, ...userData };
        localStorage.setItem('mero_user', JSON.stringify(updated));
        return { user: updated };
      });
    },

    logout: () => {
      localStorage.removeItem('mero_user');
      localStorage.removeItem('mero_token');
      localStorage.removeItem('mero_refresh_token');
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
    },

    setLoginModal: (open) => set({ loginModalOpen: open }),
    setBuyModal: (type) => set({ buyModalOpen: type }),
  };
});
