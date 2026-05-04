import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { LoginWall } from '@/components/login-wall';
import { subscribeAppointments } from '@/services/appointments';
import { Appointment, AppointmentStatus } from '@/types/appointment';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatDuration(duration: number, unit: string): string {
  if (unit === 'min' && duration >= 60) {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${duration}${unit}`;
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; dot: string }> = {
  pending:   { label: 'Pendente',   dot: '●' },
  confirmed: { label: 'Confirmado', dot: '●' },
  completed: { label: 'Concluído',  dot: '●' },
  cancelled: { label: 'Cancelado',  dot: '○' },
};

// ─── Screen ──────────────────────────────────────────────────────────────────

type Tab = 'upcoming' | 'history';

export default function AgendaScreen() {
  const { user, profile } = useAuth();
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';
  const { width } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [activeTab,    setActiveTab]    = useState<Tab>('upcoming');
  const [refreshing,   setRefreshing]   = useState(false);

  const c = {
    bg:            dark ? Palette.neutral[900]  : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]  : '#FFFFFF',
    subtle:        dark ? Palette.neutral[700]  : Palette.neutral[100],
    border:        dark ? Palette.neutral[700]  : Palette.neutral[200],
    textPrimary:   dark ? '#F5F2EE'             : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]  : Palette.neutral[500],
    textTertiary:  dark ? Palette.neutral[500]  : Palette.neutral[400],
    accent:        dark ? Palette.rose[400]     : Palette.rose[500],
    accentLight:   dark ? 'rgba(196,92,88,0.15)': Palette.rose[100],
    gold:          dark ? Palette.gold[300]     : Palette.gold[400],
    goldLight:     dark ? 'rgba(201,168,76,0.12)': Palette.gold[100],
    success:       dark ? '#6EC97A'             : '#2D7A3A',
    successLight:  dark ? 'rgba(45,122,58,0.2)' : '#EAF5EC',
    tabActive:     dark ? Palette.rose[400]     : Palette.rose[500],
    tabInactive:   dark ? Palette.neutral[600]  : Palette.neutral[200],
  };

  // Status badge colors
  const statusColors = {
    pending:   { bg: c.goldLight,    text: dark ? Palette.gold[200]  : Palette.gold[600]  },
    confirmed: { bg: c.accentLight,  text: dark ? Palette.rose[300]  : Palette.rose[700]  },
    completed: { bg: c.successLight, text: c.success },
    cancelled: { bg: c.subtle,       text: c.textTertiary },
  };

  useEffect(() => {
    if (!profile?.phone) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeAppointments(
      profile.phone,
      (data) => {
        setAppointments(data);
        setError('');
        setLoading(false);
        setRefreshing(false);
      },
      (err) => {
        console.error('[agenda] Firestore error:', err);
        setError(`Não foi possível carregar os agendamentos.\n${err.message}`);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return unsubscribe;
  }, [profile?.phone]);

  const now = Date.now();

  const { upcoming, history } = useMemo(() => {
    const upcoming: Appointment[] = [];
    const history:  Appointment[] = [];

    appointments.forEach((a) => {
      const ts = a.dateTime?.toMillis?.() ?? 0;
      if (a.status === 'cancelled' || ts < now) {
        history.push(a);
      } else {
        upcoming.push(a);
      }
    });

    // upcoming: mais próximo primeiro
    upcoming.sort((a, b) => (a.dateTime?.toMillis?.() ?? 0) - (b.dateTime?.toMillis?.() ?? 0));

    return { upcoming, history };
  }, [appointments, now]);

  const list = activeTab === 'upcoming' ? upcoming : history;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={[styles.content, { maxWidth: Math.min(width, 600), paddingTop: topInset + 24 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => setRefreshing(true)}
          tintColor={c.accent}
        />
      }>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Minha Agenda</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          {appointments.length === 0 && !loading
            ? 'Nenhum agendamento encontrado'
            : `${appointments.length} agendamento${appointments.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* ── Tabs ── */}
      <View style={[styles.tabs, { backgroundColor: c.subtle, borderColor: c.border }]}>
        {(['upcoming', 'history'] as Tab[]).map((tab) => {
          const active = activeTab === tab;
          const count  = tab === 'upcoming' ? upcoming.length : history.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                active && { backgroundColor: c.surface, borderColor: c.border },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}>
              <Text style={[
                styles.tabText,
                { color: active ? c.accent : c.textTertiary },
              ]}>
                {tab === 'upcoming' ? 'Próximos' : 'Histórico'}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, { backgroundColor: active ? c.accentLight : c.subtle }]}>
                  <Text style={[styles.tabBadgeText, { color: active ? c.accent : c.textTertiary }]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Login wall for guests ── */}
      {!user ? (
        <LoginWall
          title="Sua agenda está aqui"
          body="Entre na sua conta para ver seus agendamentos e histórico de serviços."
        />
      ) : loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.accent} size="large" />
        </View>
      ) : error ? (
        <View style={[styles.errorBox, { backgroundColor: c.subtle, borderColor: c.border }]}>
          <Text style={[styles.errorText, { color: c.textSecondary }]}>{error}</Text>
        </View>
      ) : list.length === 0 ? (
        <EmptyState tab={activeTab} colors={c} />
      ) : (
        <View style={styles.list}>
          {list.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              colors={c}
              statusColors={statusColors}
            />
          ))}
        </View>
      )}

    </ScrollView>
  );
}

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  colors: c,
  statusColors,
}: {
  appt: Appointment;
  colors: Record<string, string>;
  statusColors: Record<string, { bg: string; text: string }>;
}) {
  const config  = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  const sColors = statusColors[appt.status]  ?? statusColors.pending;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>

      {/* Status badge */}
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: sColors.bg }]}>
          <Text style={[styles.statusText, { color: sColors.text }]}>
            {config.dot} {config.label}
          </Text>
        </View>
        <Text style={[styles.cardTime, { color: c.textTertiary }]}>
          {appt.time} · {formatDuration(appt.duration, appt.durationUnit)}
        </Text>
      </View>

      {/* Service */}
      <Text style={[styles.cardService, { color: c.textPrimary }]}>
        {appt.serviceName}
      </Text>

      {/* Date */}
      <Text style={[styles.cardDate, { color: c.textSecondary }]}>
        {formatDate(appt.date)}
      </Text>

      {/* Divider */}
      <View style={[styles.cardDivider, { backgroundColor: c.border }]} />

    </View>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ tab, colors: c }: { tab: Tab; colors: Record<string, string> }) {
  return (
    <View style={[styles.empty, { borderColor: c.border }]}>
      <Text style={[styles.emptySymbol, { color: c.accent }]}>
        {tab === 'upcoming' ? '✦' : '○'}
      </Text>
      <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>
        {tab === 'upcoming' ? 'Nenhum agendamento próximo' : 'Sem histórico ainda'}
      </Text>
      <Text style={[styles.emptyBody, { color: c.textSecondary }]}>
        {tab === 'upcoming'
          ? 'Use o link da sua profissional para agendar um horário.'
          : 'Seus agendamentos concluídos ou cancelados aparecerão aqui.'}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 20,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header:   { gap: 4 },
  title: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 34,
    letterSpacing: -0.3,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    letterSpacing: 0.1,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },

  // States
  center: {
    paddingVertical: 64,
    alignItems: 'center',
  },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },

  // List
  list: { gap: 12 },

  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.05,
  },
  cardTime: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    letterSpacing: 0.1,
  },
  cardService: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  cardDate: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    letterSpacing: 0.1,
    textTransform: 'capitalize',
  },
  cardDivider: {
    height: 1,
    marginVertical: 4,
  },
  cardClient: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    letterSpacing: 0.1,
  },

  // Empty
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 10,
  },
  emptySymbol: {
    fontSize: 28,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 22,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});
