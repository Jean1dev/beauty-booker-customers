import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import { Palette } from '@/constants/theme';

export function LoginWall({ title, body }: { title: string; body: string }) {
  const dark = useColorScheme() === 'dark';

  const c = {
    textPrimary:   dark ? '#F5F2EE'              : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]   : Palette.neutral[500],
    accent:        dark ? Palette.rose[400]      : Palette.rose[500],
    border:        dark ? Palette.neutral[700]   : Palette.neutral[200],
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.symbol, { color: c.accent }]}>✦</Text>
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      <Text style={[styles.body, { color: c.textSecondary }]}>{body}</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: c.accent }]}
        onPress={() => router.push('/welcome')}
        activeOpacity={0.85}>
        <Text style={styles.btnText}>Entrar / Criar conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 12,
  },
  symbol: {
    fontSize: 32,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 26,
    letterSpacing: -0.2,
    textAlign: 'center',
    lineHeight: 30,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  btn: {
    borderRadius: 999,
    height: 50,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
