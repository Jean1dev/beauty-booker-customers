import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { AppleSignInButton } from '@/platform/apple-sign-in-button';
import { useGoogleSignIn } from '@/platform/google-auth';

export default function WelcomeScreen() {
  const { signIn, loading } = useGoogleSignIn();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const { height } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  const colors = {
    bg:            dark ? Palette.neutral[900]  : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]  : '#FFFFFF',
    textPrimary:   dark ? '#F5F2EE'             : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]  : Palette.neutral[500],
    border:        dark ? Palette.neutral[700]  : Palette.neutral[200],
    accent:        dark ? Palette.rose[400]     : Palette.rose[500],
    accentShadow:  dark ? 'rgba(217,126,122,0.20)' : 'rgba(196,92,88,0.25)',
  };

  async function handleBookingLink() {
    await WebBrowser.openBrowserAsync('https://beautybooker.app');
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: topInset }]}>
      {/* Decorative top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.accent }]} />

      <View style={[styles.inner, { minHeight: height }]}>
        {/* ── Logo ── */}
        <View style={styles.logoArea}>
          <Text style={[styles.logoText, { color: colors.textPrimary }]}>
            Beauty<Text style={[styles.logoItalic, { color: colors.accent }]}>Book</Text>
          </Text>
          <Text style={[styles.tagline, { color: colors.accent }]}>
            Sua beleza, seu tempo
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Encontre as melhores profissionais de beleza{'\n'}e agende com facilidade.
          </Text>
        </View>

        {/* ── Decorative divider ── */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerDot, { color: colors.accent }]}>✦</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* ── Actions ── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accentShadow,
                opacity: loading ? 0.6 : 1,
              },
            ]}
            onPress={signIn}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <GoogleIcon />
                <Text style={styles.btnPrimaryText}>Entrar com Google</Text>
              </>
            )}
          </TouchableOpacity>

          <AppleSignInButton />

          <TouchableOpacity
            style={[styles.btnSecondary, { borderColor: colors.border }]}
            onPress={handleBookingLink}
            activeOpacity={0.7}>
            <Text style={[styles.btnSecondaryText, { color: colors.textSecondary }]}>
              Tenho um link de agendamento
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Ao continuar, você concorda com os{' '}
          <Text style={{ color: colors.accent }}>Termos de Uso</Text>
          {' '}e a{' '}
          <Text style={{ color: colors.accent }}>Política de Privacidade</Text>.
        </Text>
      </View>
    </View>
  );
}

/** Inline Google "G" icon — sem dependência extra */
function GoogleIcon() {
  return (
    <View style={googleIcon.wrapper}>
      <Text style={googleIcon.g}>G</Text>
    </View>
  );
}

const googleIcon = StyleSheet.create({
  wrapper: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  g: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: '#4285F4',
    lineHeight: 16,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    height: 3,
    width: '100%',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 48,
    justifyContent: 'center',
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },

  // Logo
  logoArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 56,
    letterSpacing: -0.5,
    lineHeight: 60,
  },
  logoItalic: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 56,
  },
  tagline: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 22,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  body: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.1,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerDot: {
    fontSize: 12,
    marginHorizontal: 12,
  },

  // Buttons
  actions: {
    gap: 12,
    marginBottom: 32,
  },
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    height: 52,
    paddingHorizontal: 28,
    elevation: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
  },
  btnPrimaryText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    height: 52,
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
});
