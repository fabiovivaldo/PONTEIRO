'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  name: string;
  matricula: string;
  email: string;
}

interface UserSettings {
  fainas_favoritas: string[];
  notificacoes_ativas: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  settings: UserSettings | null;
  loading: boolean;
  login: (matricula: string) => Promise<void>;
  register: (name: string, matricula: string, email: string) => Promise<void>;
  logout: () => void;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('ponteiro_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchSettings(parsedUser.id);
    }
    setLoading(false);
  }, []);

  const fetchSettings = async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      setSettings(data);
    } else if (error && error.code === 'PGRST116') {
      // Configuração não existe, cria uma padrão
      const defaultSettings = { user_id: userId, fainas_favoritas: [], notificacoes_ativas: true };
      const { data: newData } = await supabase.from('user_settings').insert(defaultSettings).select().single();
      if (newData) setSettings(newData);
    }
  };

  const login = async (matricula: string) => {
    if (!supabase) throw new Error("Supabase não configurado");
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('matricula', matricula)
      .single();

    if (error || !data) throw new Error("Matrícula não encontrada");

    setUser(data);
    localStorage.setItem('ponteiro_user', JSON.stringify(data));
    await fetchSettings(data.id);
  };

  const register = async (name: string, matricula: string, email: string) => {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from('profiles')
      .insert([{ name, matricula, email }])
      .select()
      .single();

    if (error) throw new Error("Erro ao cadastrar. Verifique se a matrícula ou e-mail já existem.");

    setUser(data);
    localStorage.setItem('ponteiro_user', JSON.stringify(data));
    await fetchSettings(data.id);
  };

  const logout = () => {
    setUser(null);
    setSettings(null);
    localStorage.removeItem('ponteiro_user');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!supabase || !user) return;

    const { error } = await supabase
      .from('user_settings')
      .update(newSettings)
      .eq('user_id', user.id);

    if (!error) {
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, register, logout, updateSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  return context;
};
