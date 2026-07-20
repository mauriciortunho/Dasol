import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon?: IoniconName;
  title?: string;
  message?: string;
  onRetry: () => void;
};

// Estado de error en la voz de la interfaz: claro, humano, sin disculpas.
export function ErrorState({
  icon = 'cloud-offline-outline',
  title = 'No pudimos cargar esto',
  message = 'Revisá tu conexión e intentá de nuevo.',
  onRetry,
}: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={40} color={colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retry, pressed && { opacity: 0.9 }]}
      >
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
    paddingVertical: space.xxxl,
    gap: space.sm,
  },
  title: { ...type.h2, textAlign: 'center', marginTop: space.sm },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  retry: {
    marginTop: space.lg,
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    paddingHorizontal: space.xxl,
    borderRadius: radius.md,
  },
  retryText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
