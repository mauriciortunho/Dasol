import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { markOnboardingSeen } from '../lib/onboarding';
import { colors, radius, space, type } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
type OnboardingRoute = RouteProp<RootStackParamList, 'Onboarding'>;
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Slide = {
  icon: IoniconName;
  color: string;
  title: string;
  text: string;
};

const SLIDES: Slide[] = [
  {
    icon: 'heart-outline',
    color: colors.primary,
    title: 'Ayudá a quien lo necesita, cerca tuyo',
    text: 'En Santa Cruz la gente se ayuda. Acá las campañas reales están todas en un solo lugar.',
  },
  {
    icon: 'qr-code-outline',
    color: colors.accent,
    title: 'Vos aportás directo',
    text: 'Escaneás el QR de la campaña y pagás a la cuenta del organizador desde tu banco. La app no recibe ni guarda tu dinero: solo te conecta con la causa.',
  },
  {
    icon: 'shield-checkmark-outline',
    color: colors.primary,
    title: 'Casos revisados',
    text: 'Cada campaña pasa por revisión antes de publicarse. Y si algo no te cierra, podés reportarla.',
  },
  {
    icon: 'add-circle-outline',
    color: colors.primary,
    title: 'También podés crear la tuya',
    text: 'Si conocés un caso, levantás una campaña en minutos.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const nav = useNavigation<Nav>();
  const fromProfile = useRoute<OnboardingRoute>().params?.fromProfile ?? false;

  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  // Cerrar: desde el perfil solo vuelve (modo lectura); en el arranque marca la
  // bienvenida como vista y reemplaza la pila para no dejarla en el back stack.
  const finish = async () => {
    if (fromProfile) {
      nav.goBack();
      return;
    }
    await markOnboardingSeen();
    nav.reset({ index: 0, routes: [{ name: 'Feed' }] });
  };

  const onNext = () => {
    if (isLast) {
      finish();
      return;
    }
    // Actualizamos el índice al toque (no dependemos del evento de scroll, que
    // en web no siempre llega) y movemos el carrusel.
    const next = index + 1;
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  // Mantiene el índice sincronizado cuando se arrastra. Usamos onScroll (que sí
  // dispara en web) además del fin de momentum en nativo.
  const onScrollEnd = (offsetX: number) => {
    const i = Math.round(offsetX / width);
    if (i !== index) setIndex(i);
  };

  return (
    <View style={styles.screen}>
      <Pressable
        onPress={finish}
        hitSlop={8}
        style={[styles.skip, { top: insets.top + space.sm }]}
      >
        <Text style={styles.skipText}>{fromProfile ? 'Cerrar' : 'Saltar'}</Text>
      </Pressable>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        scrollEventThrottle={16}
        onScroll={(e) => onScrollEnd(e.nativeEvent.contentOffset.x)}
        onMomentumScrollEnd={(e) => onScrollEnd(e.nativeEvent.contentOffset.x)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.iconWrap, { backgroundColor: item.color + '14' }]}>
              <Ionicons name={item.icon} size={56} color={item.color} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.title} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          onPress={onNext}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.ctaText}>
            {isLast ? (fromProfile ? 'Listo' : 'Empezar') : 'Siguiente'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  skip: { position: 'absolute', right: space.lg, zIndex: 2, padding: space.sm },
  skipText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xxl,
  },
  iconWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xxl,
  },
  title: { ...type.display, fontSize: 26, textAlign: 'center', lineHeight: 32 },
  text: {
    marginTop: space.md,
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { paddingHorizontal: space.lg, gap: space.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  dotActive: { width: 22, backgroundColor: colors.primary },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: space.lg,
    borderRadius: radius.md,
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '600' },
});
