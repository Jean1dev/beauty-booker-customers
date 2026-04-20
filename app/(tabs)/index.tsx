import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { useProfessionals } from '@/hooks/useProfessionals';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Professional } from '@/types/professional';

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'hair',     label: 'Cabelo' },
  { id: 'nails',    label: 'Unhas' },
  { id: 'makeup',   label: 'Maquiagem' },
  { id: 'brows',    label: 'Sobrancelha' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'massage',  label: 'Massagem' },
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

function proDisplayName(pro: Professional): string {
  return pro.displayName ?? pro.name ?? pro.userLink;
}

function proInitial(pro: Professional): string {
  return proDisplayName(pro).charAt(0).toUpperCase();
}

function proMatchesCategory(pro: Professional, categoryLabel: string): boolean {
  if (!pro.serviceCategory) return false;
  return pro.serviceCategory
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .includes(categoryLabel.toLowerCase());
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile } = useAuth();
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState('all');
  const { professionals, favorites, loading, toggleFavorite } = useProfessionals();

  const c = {
    bg:            dark ? Palette.neutral[900]   : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]   : '#FFFFFF',
    subtle:        dark ? Palette.neutral[700]   : Palette.neutral[100],
    border:        dark ? Palette.neutral[700]   : Palette.neutral[200],
    textPrimary:   dark ? '#F5F2EE'              : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]   : Palette.neutral[500],
    textTertiary:  dark ? Palette.neutral[500]   : Palette.neutral[400],
    accent:        dark ? Palette.rose[400]      : Palette.rose[500],
    accentLight:   dark ? 'rgba(196,92,88,0.15)' : Palette.rose[100],
    accentText:    dark ? Palette.rose[300]      : Palette.rose[700],
    avatarText:    dark ? Palette.rose[300]      : Palette.rose[700],
    favActive:     '#E53935',
  };

  const favPros = professionals.filter((p) => favorites.has(p.userLink));

  const filteredPros = activeCategory === 'all'
    ? professionals
    : professionals.filter((p) =>
        proMatchesCategory(p, CATEGORIES.find((c) => c.id === activeCategory)?.label ?? ''),
      );

  const cardWidth = Math.min((width - 20 * 2 - 12) / 2, 220);

  const openBooking = async (userLink: string) => {
    await WebBrowser.openBrowserAsync(`https://bookpro.me/book/${userLink}`);
  };

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

      {/* ── Favoritas ── */}
      {favPros.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Favoritas</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favRow}
            style={styles.favScroll}>
            {favPros.map((pro) => (
              <FavoriteBubble
                key={pro.id}
                pro={pro}
                colors={c}
                onPress={() => openBooking(pro.userLink)}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Categorias ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesRow}
        style={styles.categoriesScroll}>
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: active ? c.accent  : c.surface,
                  borderColor:     active ? c.accent  : c.border,
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
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginVertical: 32 }} />
      ) : filteredPros.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: c.subtle, borderColor: c.border }]}>
          <Text style={[styles.emptyIcon, { color: c.textTertiary }]}>✦</Text>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            {professionals.length === 0
              ? 'Nenhuma profissional disponível ainda.'
              : 'Nenhuma profissional nessa categoria.'}
          </Text>
        </View>
      ) : (
        <View style={styles.proGrid}>
          {filteredPros.map((pro) => (
            <ProCard
              key={pro.id}
              pro={pro}
              width={cardWidth}
              colors={c}
              isFav={favorites.has(pro.userLink)}
              onFavPress={() => toggleFavorite(pro.userLink)}
              onPress={() => openBooking(pro.userLink)}
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

// ─── Favorite Bubble ─────────────────────────────────────────────────────────

type ProColors = Record<string, string>;

function FavoriteBubble({
  pro,
  colors: c,
  onPress,
}: {
  pro: Professional;
  colors: ProColors;
  onPress: () => void;
}) {
  const bgColor = pro.theme?.primary ?? c.accentLight;
  const textColor = pro.theme?.accent ?? c.avatarText;

  return (
    <TouchableOpacity style={styles.favBubble} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.favBubbleAvatar, { borderColor: pro.theme?.accent ?? c.accent }]}>
        {pro.logoUrl ? (
          <Image source={{ uri: pro.logoUrl }} style={styles.favBubbleImg} contentFit="cover" />
        ) : (
          <View style={[styles.favBubbleFallback, { backgroundColor: bgColor }]}>
            <Text style={[styles.favBubbleInitial, { color: textColor }]}>
              {proInitial(pro)}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.favBubbleName, { color: c.textSecondary }]} numberOfLines={1}>
        {proDisplayName(pro)}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Pro Card ─────────────────────────────────────────────────────────────────

function ProCard({
  pro,
  width,
  colors: c,
  isFav,
  onFavPress,
  onPress,
}: {
  pro: Professional;
  width: number;
  colors: ProColors;
  isFav: boolean;
  onFavPress: () => void;
  onPress: () => void;
}) {
  const cardBg      = pro.theme?.primary ? `${pro.theme.primary}18` : c.accentLight;
  const accentColor = pro.theme?.accent  ?? c.accent;
  const textColor   = pro.theme?.accent  ?? c.avatarText;
  const borderColor = pro.theme?.accent  ? `${pro.theme.accent}40` : c.border;

  return (
    <TouchableOpacity
      style={[styles.proCard, { width, backgroundColor: c.surface, borderColor }]}
      onPress={onPress}
      activeOpacity={0.85}>

      {/* Avatar area */}
      <View style={[styles.proCardImg, { backgroundColor: cardBg }]}>
        {pro.logoUrl ? (
          <Image source={{ uri: pro.logoUrl }} style={styles.proCardLogo} contentFit="cover" />
        ) : (
          <Text style={[styles.proCardImgText, { color: accentColor }]}>
            {proInitial(pro)}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.favBtn, { backgroundColor: c.surface }]}
          onPress={onFavPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}>
          <IconSymbol
            name={isFav ? 'heart.fill' : 'heart'}
            size={14}
            color={isFav ? c.favActive : c.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.proCardBody}>
        <Text style={[styles.proCardName, { color: c.textPrimary }]}>
          {proDisplayName(pro)}
        </Text>
        <Text style={[styles.proCardLink, { color: accentColor }]} numberOfLines={1}>
          @{pro.userLink}
        </Text>
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

  // Favorites row
  favScroll: { marginHorizontal: -20 },
  favRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  favBubble: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  favBubbleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
  },
  favBubbleImg: { width: '100%', height: '100%' },
  favBubbleFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBubbleInitial: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    fontSize: 22,
  },
  favBubbleName: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    letterSpacing: 0.1,
    textAlign: 'center',
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
  proCardLogo: {
    width: '100%',
    height: '100%',
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
  proCardLink: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    letterSpacing: 0.1,
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
