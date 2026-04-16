import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';

import { Palette } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { IconSymbol } from '@/components/ui/icon-symbol';

// ─── Mock data (substituir pela API quando disponível) ───────────────────────

const CATEGORIES = [
  { id: 'all',         label: 'Todos' },
  { id: 'hair',        label: 'Cabelo' },
  { id: 'nails',       label: 'Unhas' },
  { id: 'makeup',      label: 'Maquiagem' },
  { id: 'brows',       label: 'Sobrancelha' },
  { id: 'skincare',    label: 'Skincare' },
  { id: 'massage',     label: 'Massagem' },
];

const PROS = [
  {
    id: '1',
    initial: 'A',
    name: 'Ana Carolina',
    specialty: 'Cabelo · Coloração · Escova',
    rating: '4,9',
    reviews: 128,
    available: true,
    tags: ['Cabelo'],
  },
  {
    id: '2',
    initial: 'M',
    name: 'Mariana Lima',
    specialty: 'Unhas · Manicure · Pedicure',
    rating: '4,8',
    reviews: 94,
    available: true,
    tags: ['Unhas'],
  },
  {
    id: '3',
    initial: 'J',
    name: 'Juliana Reis',
    specialty: 'Maquiagem · Make social',
    rating: '5,0',
    reviews: 61,
    available: false,
    tags: ['Maquiagem'],
  },
  {
    id: '4',
    initial: 'P',
    name: 'Patricia Souza',
    specialty: 'Sobrancelha · Design · Henna',
    rating: '4,7',
    reviews: 203,
    available: true,
    tags: ['Sobrancelha'],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(name: string): string {
  return name.trim().split(' ')[0];
}

function initials(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

function today(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useAuth();
  const scheme = useColorScheme();
  const dark   = scheme === 'dark';
  const { width } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState('all');

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
    accentText:    dark ? Palette.rose[300]     : Palette.rose[700],
    gold:          dark ? Palette.gold[300]     : Palette.gold[400],
    success:       dark ? '#6EC97A'             : '#2D7A3A',
    successBg:     dark ? 'rgba(45,122,58,0.2)' : '#EAF5EC',
    avatarText:    dark ? Palette.rose[300]     : Palette.rose[700],
  };

  const filteredPros = activeCategory === 'all'
    ? PROS
    : PROS.filter(p => p.tags.includes(
        CATEGORIES.find(cat => cat.id === activeCategory)?.label ?? ''
      ));

  // Dois cards por linha quando a tela for larga o suficiente
  const cardWidth = Math.min((width - 20 * 2 - 12) / 2, 220);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.greetingLabel, { color: c.textSecondary }]}>
            {greeting()},
          </Text>
          <Text style={[styles.greetingName, { color: c.textPrimary }]}>
            {profile?.name ? firstName(profile.name) : 'bem-vinda'} ✦
          </Text>
          <Text style={[styles.dateText, { color: c.textTertiary }]}>
            {today()}
          </Text>
        </View>

        {/* Avatar pequeno */}
        <TouchableOpacity
          style={[styles.headerAvatar, { borderColor: c.accent }]}
          onPress={() => router.push('/(tabs)/perfil')}
          activeOpacity={0.8}>
          {profile?.photoUrl ? (
            <Image
              source={{ uri: profile.photoUrl }}
              style={styles.headerAvatarImg}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.headerAvatarFallback, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.headerAvatarInitial, { color: c.avatarText }]}>
                {profile?.name ? initials(profile.name) : '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Search bar ── */}
      <TouchableOpacity
        style={[styles.searchBar, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={() => router.push('/(tabs)/agenda')}
        activeOpacity={0.7}>
        <IconSymbol name="magnifyingglass" size={16} color={c.textTertiary} />
        <Text style={[styles.searchPlaceholder, { color: c.textTertiary }]}>
          Buscar profissionais...
        </Text>
      </TouchableOpacity>

      {/* ── Categorias ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={styles.categoriesScroll}>
        {CATEGORIES.map(cat => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: active ? c.accent       : c.surface,
                  borderColor:     active ? c.accent       : c.border,
                },
              ]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.75}>
              <Text style={[
                styles.categoryText,
                { color: active ? '#fff' : c.textSecondary },
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Em destaque ── */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Em destaque</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/agenda')} activeOpacity={0.7}>
          <Text style={[styles.sectionLink, { color: c.accent }]}>Ver todas</Text>
        </TouchableOpacity>
      </View>

      {filteredPros.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: c.subtle, borderColor: c.border }]}>
          <Text style={[styles.emptyIcon, { color: c.textTertiary }]}>✦</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Nenhuma profissional nessa categoria ainda.
          </Text>
        </View>
      ) : (
        <View style={styles.proGrid}>
          {filteredPros.map(pro => (
            <ProCard
              key={pro.id}
              pro={pro}
              width={cardWidth}
              colors={c}
            />
          ))}
        </View>
      )}

      {/* ── CTA banner ── */}
      <View style={[styles.banner, { backgroundColor: c.accentLight, borderColor: c.accent }]}>
        <View style={styles.bannerContent}>
          <Text style={[styles.bannerTitle, { color: c.accent }]}>
            Seu próximo momento de beleza
          </Text>
          <Text style={[styles.bannerBody, { color: c.accentText }]}>
            Explore profissionais perto de você e agende com facilidade.
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.bannerBtn, { backgroundColor: c.accent }]}
          onPress={() => router.push('/(tabs)/agenda')}
          activeOpacity={0.85}>
          <Text style={styles.bannerBtnText}>Explorar</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

// ─── Pro Card ─────────────────────────────────────────────────────────────────

type ProColors = Record<string, string>;

function ProCard({
  pro,
  width,
  colors: c,
}: {
  pro: typeof PROS[number];
  width: number;
  colors: ProColors;
}) {
  return (
    <TouchableOpacity
      style={[styles.proCard, { width, backgroundColor: c.surface, borderColor: c.border }]}
      activeOpacity={0.85}>

      {/* Imagem / placeholder */}
      <View style={[styles.proCardImg, { backgroundColor: c.accentLight }]}>
        <Text style={[styles.proCardImgText, { color: c.accent }]}>{pro.initial}</Text>
        <View style={[styles.favBtn, { backgroundColor: c.surface }]}>
          <IconSymbol name="heart" size={14} color={c.textTertiary} />
        </View>
      </View>

      {/* Corpo */}
      <View style={styles.proCardBody}>
        <Text style={[styles.proCardName, { color: c.textPrimary }]}>{pro.name}</Text>
        <Text style={[styles.proCardSpecialty, { color: c.textSecondary }]} numberOfLines={1}>
          {pro.specialty}
        </Text>

        <View style={styles.proCardMeta}>
          <View style={styles.ratingRow}>
            <Text style={[styles.star, { color: c.gold }]}>★</Text>
            <Text style={[styles.ratingText, { color: c.textSecondary }]}>
              {pro.rating}{' '}
              <Text style={{ color: c.textTertiary }}>({pro.reviews})</Text>
            </Text>
          </View>

          <View style={[
            styles.availBadge,
            {
              backgroundColor: pro.available ? c.successBg : c.subtle,
              borderColor:     pro.available ? 'transparent' : c.border,
            },
          ]}>
            <Text style={[
              styles.availText,
              { color: pro.available ? c.success : c.textTertiary },
            ]}>
              {pro.available ? '● Hoje' : '○ Indisponível'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 48,
    gap: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: { gap: 2 },
  greetingLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    letterSpacing: 0.1,
  },
  greetingName: {
    fontFamily: 'CormorantGaramond_300Light',
    fontSize: 30,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  dateText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
    marginTop: 4,
  },
  headerAvatarImg: { width: '100%', height: '100%' },
  headerAvatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 18,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchPlaceholder: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    letterSpacing: 0.1,
  },

  // Categories
  categoriesScroll: { marginHorizontal: -20 },
  categoriesRow: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    letterSpacing: 0.1,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 22,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    letterSpacing: 0.1,
  },

  // Pro grid
  proGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  proCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  proCardImg: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  proCardImgText: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 44,
    opacity: 0.6,
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  proCardBody: {
    padding: 12,
    gap: 3,
  },
  proCardName: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 17,
    lineHeight: 20,
  },
  proCardSpecialty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  proCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  star: { fontSize: 12 },
  ratingText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
  },
  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  availText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.05,
  },

  // Empty state
  emptyState: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 24 },
  emptyText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Banner
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  bannerContent: { gap: 4 },
  bannerTitle: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 20,
    lineHeight: 24,
  },
  bannerBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: 0.1,
  },
  bannerBtn: {
    borderRadius: 999,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
  },
  bannerBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
