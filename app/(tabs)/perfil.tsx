import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { showAlert, showConfirm } from '@/platform/alert';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { LoginWall } from '@/components/login-wall';

function formatPhone(raw: string | null): string {
  if (!raw) return '—';
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ts));
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function PerfilScreen() {
  const { profile, signOut, deleteAccount } = useAuth();
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';
  const { top: topInset } = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);

  const c = {
    bg:            dark ? Palette.neutral[900]  : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]  : '#FFFFFF',
    border:        dark ? Palette.neutral[700]  : Palette.neutral[200],
    textPrimary:   dark ? '#F5F2EE'             : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]  : Palette.neutral[500],
    textTertiary:  dark ? Palette.neutral[500]  : Palette.neutral[400],
    accent:        dark ? Palette.rose[400]     : Palette.rose[500],
    accentLight:   dark ? 'rgba(196,92,88,0.15)': Palette.rose[100],
    avatarFrom:    dark ? 'rgba(196,92,88,0.30)': Palette.rose[200],
    avatarTo:      dark ? 'rgba(196,92,88,0.15)': Palette.rose[300],
    avatarText:    dark ? Palette.rose[300]     : Palette.rose[700],
    danger:        '#C45858',
    dangerLight:   dark ? 'rgba(196,88,88,0.15)': '#FDF0F0',
  };

  function handleSignOut() {
    showConfirm(
      'Sair da conta',
      'Deseja encerrar sua sessão?',
      () => signOut(),
    );
  }

  function handleDeleteAccount() {
    showConfirm(
      'Excluir conta e dados',
      'Todos os seus dados serão apagados permanentemente. Essa ação não pode ser desfeita.\n\nVocê precisará confirmar sua identidade para prosseguir.',
      () => {
        showConfirm(
          'Tem certeza absoluta?',
          'Sua conta e todos os dados pessoais serão excluídos agora.',
          async () => {
            setDeleting(true);
            try {
              await deleteAccount();
            } catch (err) {
              setDeleting(false);
              const msg =
                err instanceof Error ? err.message : 'Erro desconhecido.';
              showAlert('Não foi possível excluir', msg);
            }
          },
        );
      },
    );
  }

  if (!profile) {
    return (
      <ScrollView
        style={[styles.root, { backgroundColor: c.bg }]}
        contentContainerStyle={[styles.content, { paddingTop: topInset + 24 }]}>
        <LoginWall
          title="Seu perfil"
          body="Entre na sua conta para acessar seu perfil, gerenciar seus dados e preferências."
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: topInset + 24 }]}
      showsVerticalScrollIndicator={false}>

      {/* ── Hero ── */}
      <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.avatarWrap}>
          {profile.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={[styles.avatarImg, { borderColor: c.surface }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: c.avatarFrom }]}>
              <Text style={[styles.avatarInitials, { color: c.avatarText }]}>
                {initials(profile.name || profile.email)}
              </Text>
            </View>
          )}
          <View style={[styles.avatarRing, { borderColor: c.accent }]} />
        </View>

        <Text style={[styles.name, { color: c.textPrimary }]}>
          {profile.name || 'Sem nome'}
        </Text>
        <Text style={[styles.email, { color: c.textSecondary }]}>
          {profile.email}
        </Text>
      </View>

      {/* ── Informações ── */}
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Text style={[styles.cardLabel, { color: c.textTertiary }]}>INFORMAÇÕES</Text>

        <InfoRow
          label="Telefone"
          value={formatPhone(profile.phone)}
          colors={c}
        />
        <View style={[styles.separator, { backgroundColor: c.border }]} />
        <InfoRow
          label="E-mail"
          value={profile.email}
          colors={c}
        />
        <View style={[styles.separator, { backgroundColor: c.border }]} />
        <InfoRow
          label="Membro desde"
          value={formatDate(profile.createdAt)}
          colors={c}
        />
      </View>

      {/* ── Ações ── */}
      <TouchableOpacity
        style={[styles.signOutBtn, { backgroundColor: c.dangerLight, borderColor: c.danger }]}
        onPress={handleSignOut}
        activeOpacity={0.75}>
        <Text style={[styles.signOutText, { color: c.danger }]}>Sair da conta</Text>
      </TouchableOpacity>

      {/* ── Zona de perigo ── */}
      <View style={[styles.dangerCard, { backgroundColor: c.surface, borderColor: c.danger }]}>
        <Text style={[styles.dangerCardLabel, { color: c.danger }]}>ZONA DE PERIGO</Text>
        <Text style={[styles.dangerCardDesc, { color: c.textSecondary }]}>
          A exclusão da conta remove permanentemente todos os seus dados pessoais. Essa ação é irreversível.
        </Text>
        <TouchableOpacity
          style={[styles.deleteBtn, { backgroundColor: c.danger }, deleting && styles.deleteBtnDisabled]}
          onPress={handleDeleteAccount}
          activeOpacity={0.8}
          disabled={deleting}>
          {deleting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.deleteBtnText}>Excluir minha conta e dados</Text>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const AVATAR_SIZE = 88;

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 16,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 28,
    paddingHorizontal: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginBottom: 12,
    position: 'relative',
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 32,
    lineHeight: 36,
  },
  avatarRing: {
    position: 'absolute',
    inset: -4,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    borderWidth: 2,
  },
  name: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 26,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  email: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    letterSpacing: 0.1,
  },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.12,
    marginBottom: 8,
  },
  separator: {
    height: 1,
    marginLeft: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
  },
  infoLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    flexShrink: 0,
  },
  infoValue: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    textAlign: 'right',
    flex: 1,
  },

  // Sign out
  signOutBtn: {
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signOutText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    letterSpacing: 0.2,
  },

  // Danger zone
  dangerCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    marginTop: 8,
  },
  dangerCardLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  dangerCardDesc: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  deleteBtn: {
    borderRadius: 999,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  deleteBtnDisabled: {
    opacity: 0.6,
  },
  deleteBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
