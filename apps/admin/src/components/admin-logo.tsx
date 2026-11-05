import { Image, StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/hooks/use-theme';

const mark = require('../../assets/images/aosell-mark-official.png');

export function AdminLogo({ theme }: { theme: AppTheme }) {
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
});
