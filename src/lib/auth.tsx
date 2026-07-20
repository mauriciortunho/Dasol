import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from './supabase';
import { registerForPushNotifications, savePushToken } from './notifications';
import { Profile } from '../types';

type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  phone: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  // Devuelve needsConfirmation=true si Supabase exige confirmar el email
  // (no se crea sesión hasta confirmar).
  signUp: (params: SignUpParams) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, role, is_verified')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    phone: data.phone,
    avatarUrl: data.avatar_url,
    role: data.role,
    isVerified: data.is_verified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;

    // Resolver la sesión guardada al arrancar.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // Mantener la sesión sincronizada. Importante: el callback NO debe await-ear
    // otras llamadas de supabase (puede deadlockear); sólo guardamos la sesión y
    // el profile se trae en el efecto de abajo.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Traer (o limpiar) el profile cuando cambia el usuario logueado.
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    let active = true;
    if (!userId) {
      setProfile(null);
      return;
    }
    fetchProfile(userId).then((p) => {
      if (active) setProfile(p);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  // Con sesión iniciada, registrar el push token (si hay permiso y dispositivo
  // físico). Sin sesión no se hace nada; si el permiso está denegado, register
  // devuelve null sin insistir y no rompe el arranque.
  useEffect(() => {
    if (!userId) return;
    let active = true;
    registerForPushNotifications()
      .then((token) => {
        if (active && token) return savePushToken(token);
      })
      .catch((e) => console.warn('Push: registro fallido (se ignora):', e));
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  };

  const signUp = async ({ email, password, fullName, phone }: SignUpParams) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim(), phone: phone.trim() } },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
