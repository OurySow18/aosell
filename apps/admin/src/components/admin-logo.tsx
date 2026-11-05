import { Image, StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/hooks/use-theme';

const mark = require('../../assets/images/aosell-mark-official.png');

export function AdminLogo({ theme, onDark = false }: { theme: AppTheme; onDark?: boolean }) {
  if (onDark) {
    return (
      <View style={styles.darkRow}>
        <View style={[styles.swatch, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.sm }]} />
        <Text style={styles.darkWordmark}>AoSell</Text>
        <View style={[styles.badge, { borderColor: 'rgba(255,180,0,.5)', borderRadius: theme.radii.pill }]}>
          <Text style={[styles.badgeText, { color: theme.colors.accent }]}>Admin</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.markFrame, { borderColor: theme.colors.accentTintBorder, backgroundColor: theme.colors.surface }]}>
        <Image resizeMode="contain" source={mark} style={styles.mark} />
      </View>
      <View>
        <Text style={[styles.wordmark, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.headingHeavy }]}>
          AoSell
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.bodySemi }]}>
          Admin
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  markFrame: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 30, height: 32 },
  wordmark: { fontSize: 17, lineHeight: 20, letterSpacing: -0.3 },
  subtitle: { fontSize: 11, lineHeight: 13, letterSpacing: 0.3, textTransform: 'uppercase' },

  darkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8 },
  swatch: { width: 30, height: 30 },
  darkWordmark: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#FFFFFF' },
  badge: { borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
});
