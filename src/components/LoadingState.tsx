import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, space } from '../theme';

type Props = {
  text?: string;
};

// Indicador de carga centrado en el color primario. Se expande si el padre
// tiene alto; inline ocupa solo su contenido.
export function LoadingState({ text }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!!text && <Text style={styles.text}>{text}</Text>}
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
    gap: space.md,
  },
  text: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
