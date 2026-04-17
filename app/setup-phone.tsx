import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

import { Palette } from '@/constants/theme';
import { updateCustomerPhone } from '@/services/customers';
import { useAuthStore } from '@/store/authStore';
import { maskPhone, rawDigits } from '@/utils/phoneMask';

export default function SetupPhoneScreen() {
  const scheme    = useColorScheme();
  const dark      = scheme === 'dark';
  const { width } = useWindowDimensions();

  const { user, setProfile } = useAuthStore();

  const [masked,  setMasked]  = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const colors = {
    bg:            dark ? Palette.neutral[900]  : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]  : '#FFFFFF',
    textPrimary:   dark ? '#F5F2EE'             : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]  : Palette.neutral[500],
    textTertiary:  dark ? Palette.neutral[500]  : Palette.neutral[400],
    border:        dark ? Palette.neutral[700]  : Palette.neutral[200],
    borderFocus:   dark ? Palette.rose[400]     : Palette.rose[500],
    accent:        dark ? Palette.rose[400]     : Palette.rose[500],
    accentLight:   dark ? 'rgba(196,92,88,0.15)': Palette.rose[100],
    accentShadow:  dark ? 'rgba(217,126,122,0.20)' : 'rgba(196,92,88,0.25)',
    error:         '#C45858',
  };

  function handleChange(text: string) {
    setError('');
    setMasked(maskPhone(text));
  }

  async function handleConfirm() {
    const digits = rawDigits(masked);

    if (digits.length < 10) {
      setError('Informe um número de telefone válido.');
      return;
    }

    if (!user) return;

    setSaving(true);
    setError('');
    try {
      const updated = await updateCustomerPhone(user.uid, digits);
      setProfile(updated);
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const isReady = rawDigits(masked).length >= 10;

  return (
    <>
      {/* Impede voltar para esta tela após cadastro */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />

      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.topBar, { backgroundColor: colors.accent }]} />

        <View style={[styles.inner, { maxWidth: Math.min(width, 440) }]}>

          {/* ── Header ── */}
          <View style={styles.headerArea}>
            <Text style={[styles.logo, { color: colors.textPrimary }]}>
              Beauty<Text style={[styles.logoItalic, { color: colors.accent }]}>Book</Text>
            </Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Seu número de telefone
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              As profissionais usam seu número para confirmar agendamentos.
              Não compartilhamos com terceiros.
            </Text>
          </View>

          {/* ── Input ── */}
          <View style={styles.fieldArea}>
            <Text style={[styles.label, { color: colors.textTertiary }]}>TELEFONE</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: error ? colors.error : (masked ? colors.borderFocus : colors.border),
                  color: colors.textPrimary,
                },
              ]}
              value={masked}
              onChangeText={handleChange}
              placeholder="(11) 99999-9999"
              placeholderTextColor={colors.textTertiary}
              keyboardType="phone-pad"
              maxLength={16}
              autoFocus
            />
            {error ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            ) : (
              <Text style={[styles.hint, { color: colors.textTertiary }]}>
                DDD + número com 9 dígitos
              </Text>
            )}
          </View>

          {/* ── Button ── */}
          <TouchableOpacity
            style={[
              styles.btnPrimary,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accentShadow,
                opacity: isReady && !saving ? 1 : 0.5,
              },
            ]}
            onPress={handleConfirm}
            disabled={!isReady || saving}
            activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>Confirmar</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </>
  );
}

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
    paddingTop: 72,
    paddingBottom: 48,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  headerArea: {
    marginBottom: 48,
  },
  logo: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 36,
    letterSpacing: -0.3,
    marginBottom: 24,
  },
  logoItalic: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 36,
  },
  title: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 28,
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.1,
  },

  // Field
  fieldArea: {
    marginBottom: 32,
  },
  label: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.12,
    marginBottom: 8,
  },
  input: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 20,
    letterSpacing: 0.5,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.02,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
  },

  // Button
  btnPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    height: 52,
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
});
