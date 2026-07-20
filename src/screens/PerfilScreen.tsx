import React from 'react';
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { useAuth } from '../lib/auth';
import { sendTestNotification } from '../lib/notifications';
import { colors, radius, space, type } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Perfil'>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const { user, profile, signOut } = useAuth();
  const isModerator = profile?.role === 'moderator' || profile?.role === 'admin';

  const name = profile?.fullName?.trim() || 'Tu cuenta';
  const initial = (profile?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();

  const confirmSignOut = () => {
    Alert.alert(
      '¿Cerrar sesión?',
      'Vas a tener que volver a entrar para crear campañas o avisar pagos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              nav.navigate('Feed');
            } catch (e) {
              console.warn('No se pudo cerrar la sesión:', e);
            }
          },
        },
      ]
    );
  };

  const onTestNotification = async () => {
    try {
      await sendTestNotification();
    } catch (e) {
      if (e instanceof Error && e.message === 'sin-permiso') {
        Alert.alert(
          'Notificaciones desactivadas',
          'Activá las notificaciones para esta app desde los ajustes del teléfono.'
        );
      } else {
        console.warn('No se pudo enviar la notificación de prueba:', e);
      }
    }
  };

  const rows: { icon: IoniconName; label: string; onPress: () => void }[] = [
    { icon: 'albums-outline', label: 'Mis campañas', onPress: () => nav.navigate('MisCampanas') },
    { icon: 'heart-outline', label: 'Siguiendo', onPress: () => nav.navigate('Siguiendo') },
  ];
  if (isModerator) {
    rows.push({
      icon: 'shield-checkmark-outline',
      label: 'Panel de moderación',
      onPress: () => nav.navigate('Moderation'),
    });
  }
  rows.push({
    icon: 'help-circle-outline',
    label: 'Cómo funciona',
    onPress: () => nav.navigate('Onboarding', { fromProfile: true }),
  });

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Pressable onPress={() => nav.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          {isModerator && (
            <View style={styles.modBadge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.primary} />
              <Text style={styles.modBadgeText}>Moderador</Text>
            </View>
          )}

          {!!user?.email && (
            <View style={styles.dataRow}>
              <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dataText}>{user.email}</Text>
            </View>
          )}
          {!!profile?.phone && (
            <View style={styles.dataRow}>
              <Ionicons name="call-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dataText}>{profile.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.list}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={r.onPress}
              style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && { opacity: 0.7 }]}
            >
              <Ionicons name={r.icon} size={20} color={colors.primary} />
              <Text style={styles.rowLabel}>{r.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={onTestNotification}
          style={({ pressed }) => [styles.testNotif, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="notifications-outline" size={16} color={colors.textMuted} />
          <Text style={styles.testNotifText}>Probar notificación</Text>
        </Pressable>

        <Pressable
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.9 }]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...type.h2, flex: 1 },
  content: { paddingHorizontal: space.lg, paddingTop: space.md },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    gap: space.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontSize: 30, fontWeight: '700' },
  name: { ...type.h1, textAlign: 'center', marginTop: space.xs },
  modBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary + '14',
  },
  modBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  dataRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.xs },
  dataText: { fontSize: 14, color: colors.textMuted },
  list: {
    marginTop: space.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  testNotif: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.xl,
    paddingVertical: space.sm,
  },
  testNotifText: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingVertical: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  signOutText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
