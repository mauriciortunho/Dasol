import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Las credenciales se leen de variables de entorno públicas de Expo
// (prefijo EXPO_PUBLIC_). Definilas en .env (ver .env.example) y reiniciá
// el servidor de Expo para que las tome.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

// El cliente se crea de forma perezosa (en el primer uso), NO durante la
// evaluación de módulos. Así un problema al construirlo no deja la app
// trabada en el splash: el error cae donde se lo llama (dentro del try/catch
// del feed/detalle) y se puede ver y manejar.
export function getSupabase(): SupabaseClient {
  if (client) return client;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      'Faltan EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Configurá tu archivo .env y reiniciá el servidor de Expo.'
    );
  }

  client = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // no aplica en React Native
    },
  });
  return client;
}
