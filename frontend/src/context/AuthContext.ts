import { createContext } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);