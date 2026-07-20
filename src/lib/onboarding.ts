import AsyncStorage from '@react-native-async-storage/async-storage';

// Marca de que el usuario ya vio la bienvenida. Versionada por si más adelante
// cambiamos el contenido y queremos volver a mostrarla.
const KEY = 'onboarding_seen_v1';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function markOnboardingSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, 'true');
  } catch {
    // Si falla el guardado, no es crítico: en el peor caso se vuelve a mostrar.
  }
}
