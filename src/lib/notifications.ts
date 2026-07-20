import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { getSupabase } from './supabase';

// Verde de la marca para el color de acento de las notificaciones en Android.
const BRAND_GREEN = '#1B5E4A';

// Mostrar la notificación aunque la app esté en primer plano (banner + lista).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// El projectId de EAS hace falta para emitir el push token. Lo leemos de la
// config; si no está, devolvemos null y avisamos (hay que correr `eas init`).
function getProjectId(): string | null {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEas = (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return fromExtra ?? fromEas ?? null;
}

// Pide permiso sin insistir: si el usuario ya lo denegó y no se puede volver a
// preguntar (canAskAgain=false), no molestamos en cada arranque.
async function ensurePermissionGranted(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === 'granted') return true;
  if (!perm.canAskAgain) return false;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

// Android necesita un canal para mostrar notificaciones.
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND_GREEN,
  });
}

// Pide permiso y, si se concede, devuelve el Expo push token. Devuelve null sin
// romper en cualquier caso que no aplique: emulador/web, permiso denegado o
// falta de projectId.
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null; // en web no aplica el push nativo
  if (!Device.isDevice) return null; // emulador no recibe push reales

  await ensureAndroidChannel();

  const granted = await ensurePermissionGranted();
  if (!granted) return null;

  const projectId = getProjectId();
  if (!projectId) {
    console.warn(
      'Sin projectId de EAS: corré `eas init` para poder obtener el push token.'
    );
    return null;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (e) {
    console.warn('No se pudo obtener el push token:', e);
    return null;
  }
}

// Guarda el token del usuario actual. upsert por `token` (unique) para no
// duplicar y para reasignar el token si cambia de cuenta en el mismo equipo.
export async function savePushToken(token: string): Promise<void> {
  const supabase = getSupabase();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from('push_tokens')
    .upsert({ user_id: userId, token }, { onConflict: 'token' });
  if (error) console.warn('No se pudo guardar el push token:', error.message);
}

// Dispara una notificación LOCAL inmediata para verificar permiso y
// visualización sin depender del servidor. Lanza 'sin-permiso' si no se concede.
export async function sendTestNotification(): Promise<void> {
  const granted = await ensurePermissionGranted();
  if (!granted) throw new Error('sin-permiso');
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Notificación de prueba',
      body: 'Si ves esto, las notificaciones están funcionando.',
    },
    trigger: null, // inmediata
  });
}
