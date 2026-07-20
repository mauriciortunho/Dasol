import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IoniconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Estado vacío cálido y centrado. Se expande para centrarse si el padre tiene
// alto (pantalla completa) y, si no, ocupa solo su contenido (uso inline).
export function EmptyState({ icon, title, message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          style={({ pressed }) => [styles.action, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
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
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '14',
    marginBottom: space.sm,
  },
  title: { ...type.h2, textAlign: 'center' },
  message: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  action: {
    marginTop: space.lg,
    backgroundColor: colors.primary,
    paddingVertical: space.md,
    paddingHorizontal: space.xxl,
    borderRadius: radius.md,
  },
  actionText: { color: colors.white, fontSize: 15, fontWeight: '600' },
});
