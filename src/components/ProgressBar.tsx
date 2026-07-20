import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, space, formatBs } from '../theme';
import { isCompleted } from '../types';

type Props = {
  current: number;
  goal: number;
  large?: boolean; // versión grande para la pantalla de detalle
};

export function ProgressBar({ current, goal, large }: Props) {
  // Cap visual al 100% aunque el monto supere la meta (no debe desbordar).
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const completed = isCompleted({ currentAmount: current, goalAmount: goal });
  const exceeded = goal > 0 && current > goal;

  return (
    <View>
      <View style={styles.row}>
        <Text style={[styles.raised, large && styles.raisedLarge, completed && styles.raisedDone]}>
          Bs {formatBs(current)}
        </Text>
        <Text style={[styles.pct, large && styles.pctLarge, completed && styles.pctDone]}>
          {pct}%
        </Text>
      </View>

      <View style={[styles.track, large && styles.trackLarge]}>
        <View style={[styles.fill, completed && styles.fillDone, { width: `${pct}%` }]} />
      </View>

      <Text style={styles.goal}>
        de Bs {formatBs(goal)} como meta
      </Text>
      {exceeded && <Text style={styles.exceeded}>Superó la meta</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  raised: { fontSize: 18, fontWeight: '700', color: colors.primary },
  raisedLarge: { fontSize: 26 },
  raisedDone: { color: colors.success },
  pct: { fontSize: 14, fontWeight: '700', color: colors.accent },
  pctLarge: { fontSize: 18 },
  pctDone: { color: colors.success },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  trackLarge: { height: 14 },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  fillDone: { backgroundColor: colors.success },
  goal: { marginTop: space.sm, fontSize: 13, color: colors.textMuted },
  exceeded: { marginTop: 2, fontSize: 12, fontWeight: '600', color: colors.success },
});
