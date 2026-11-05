import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { palette, typography } from '@/constants/theme';

const officialMark = require('../../../assets/images/aosell-mark-official.png');

export function AosellLogo({ compact = false }: { compact?: boolean }) {
  if (!compact) {
    return (
      <View style={styles.fullLockup}>
        <View style={styles.markFrameLarge}>
          <Image contentFit="contain" source={officialMark} style={styles.markLarge} />
        </View>
        <Text style={styles.wordmarkLarge}>AoSell</Text>
      </View>
    );
  }

  return (
    <View style={styles.compactLockup}>
      <View style={styles.markFrame}>
        <Image contentFit="contain" source={officialMark} style={styles.mark} />
      </View>
      <Text style={styles.wordmark}>AoSell</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fullLockup: { alignItems: 'flex-start', gap: 12 },
  markFrameLarge: {
    width: 84,
    height: 84,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE4C4',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markLarge: { width: 76, height: 80 },
  wordmarkLarge: {
    color: palette.ink,
    fontFamily: typography.fontFamily.headingHeavy,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1,
  },
  compactLockup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markFrame: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFE4C4',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: { width: 48, height: 50 },
  wordmark: {
    color: palette.ink,
    fontFamily: typography.fontFamily.headingHeavy,
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.8,
  },
});
