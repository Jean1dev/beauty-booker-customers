import { router } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Palette } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type Work = {
  id: string;
  img: string | null;
  service: string;
  category: string;
  grad: [string, string];
  pro: { name: string; initial: string; specialty: string; rating: string };
};

// ─── Data ─────────────────────────────────────────────────────────────────────
// Modelado para mapear com GET /works do backend.
// Troque img:null pela URL real da API para exibir as fotos.

const WORKS: Work[] = [
  { id: 'w1',  img: null, service: 'Nail art floral',        category: 'Unhas',     grad: ['#E8A8A3','#7A2422'], pro: { name: 'Beatriz Lemos',  initial: 'B', specialty: 'Nail designer',          rating: '4,8' } },
  { id: 'w2',  img: null, service: 'Loiro iluminado',        category: 'Cabelo',    grad: ['#E6D8C4','#4A3A28'], pro: { name: 'Ana Carolina',   initial: 'A', specialty: 'Cabelo · Coloração',     rating: '4,9' } },
  { id: 'w3',  img: null, service: 'Make de noiva',          category: 'Maquiagem', grad: ['#E2C9D2','#5A2230'], pro: { name: 'Camila Rocha',   initial: 'C', specialty: 'Maquiadora · Noivas',    rating: '5,0' } },
  { id: 'w4',  img: null, service: 'Alongamento em fibra',   category: 'Unhas',     grad: ['#F2CDCA','#8A2927'], pro: { name: 'Beatriz Lemos',  initial: 'B', specialty: 'Nail designer',          rating: '4,8' } },
  { id: 'w5',  img: null, service: 'Glow pele madura',       category: 'Estética',  grad: ['#E2C56A','#6B4A12'], pro: { name: 'Daniela Souza',  initial: 'D', specialty: 'Esteticista · Skincare', rating: '4,7' } },
  { id: 'w6',  img: null, service: 'Mechas acobreadas',      category: 'Cabelo',    grad: ['#D97E7A','#5A1715'], pro: { name: 'Ana Carolina',   initial: 'A', specialty: 'Cabelo · Coloração',     rating: '4,9' } },
  { id: 'w7',  img: null, service: 'Make social',            category: 'Maquiagem', grad: ['#EAD7C4','#5C4631'], pro: { name: 'Camila Rocha',   initial: 'C', specialty: 'Maquiadora · Noivas',    rating: '5,0' } },
  { id: 'w8',  img: null, service: 'Spa dos pés',            category: 'Unhas',     grad: ['#E8E2DA','#3A352F'], pro: { name: 'Beatriz Lemos',  initial: 'B', specialty: 'Nail designer',          rating: '4,8' } },
  { id: 'w9',  img: null, service: 'Design de sobrancelha',  category: 'Estética',  grad: ['#E0CFC0','#4A3326'], pro: { name: 'Daniela Souza',  initial: 'D', specialty: 'Esteticista · Skincare', rating: '4,7' } },
  { id: 'w10', img: null, service: 'Escova modelada',        category: 'Cabelo',    grad: ['#EDD9CC','#5A3A2A'], pro: { name: 'Ana Carolina',   initial: 'A', specialty: 'Cabelo · Coloração',     rating: '4,9' } },
  { id: 'w11', img: null, service: 'Francesinha clássica',   category: 'Unhas',     grad: ['#EEDCD8','#7A2C2A'], pro: { name: 'Beatriz Lemos',  initial: 'B', specialty: 'Nail designer',          rating: '4,8' } },
  { id: 'w12', img: null, service: 'Corte chanel',           category: 'Cabelo',    grad: ['#E2D2C0','#463424'], pro: { name: 'Ana Carolina',   initial: 'A', specialty: 'Cabelo · Coloração',     rating: '4,9' } },
  { id: 'w13', img: null, service: 'Cílios volume russo',    category: 'Estética',  grad: ['#E4C9CF','#5A2330'], pro: { name: 'Daniela Souza',  initial: 'D', specialty: 'Esteticista · Skincare', rating: '4,7' } },
  { id: 'w14', img: null, service: 'Make festa dourada',     category: 'Maquiagem', grad: ['#E6CB72','#6B4A12'], pro: { name: 'Camila Rocha',   initial: 'C', specialty: 'Maquiadora · Noivas',    rating: '5,0' } },
  { id: 'w15', img: null, service: 'Babyliss ondulado',      category: 'Cabelo',    grad: ['#E9D6C8','#553828'], pro: { name: 'Ana Carolina',   initial: 'A', specialty: 'Cabelo · Coloração',     rating: '4,9' } },
  { id: 'w16', img: null, service: 'Encapsulada geométrica', category: 'Unhas',     grad: ['#F0CFCB','#8A2927'], pro: { name: 'Beatriz Lemos',  initial: 'B', specialty: 'Nail designer',          rating: '4,8' } },
  { id: 'w17', img: null, service: 'Limpeza de pele',        category: 'Estética',  grad: ['#E0CFC0','#403022'], pro: { name: 'Daniela Souza',  initial: 'D', specialty: 'Esteticista · Skincare', rating: '4,7' } },
  { id: 'w18', img: null, service: 'Pele de porcelana',      category: 'Maquiagem', grad: ['#E5D0C2','#5C4631'], pro: { name: 'Camila Rocha',   initial: 'C', specialty: 'Maquiadora · Noivas',    rating: '5,0' } },
];

const SLOTS = ['10:00', '11:30', '14:00', '15:30', '17:00'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Placeholder tile background: two-tone overlay approximating the design's gradient.
function TileBg({ work, style }: { work: Work; style?: object }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: work.grad[0] }, style]}>
      <View style={[StyleSheet.absoluteFill, styles.tileBgOverlay, { backgroundColor: work.grad[1] }]} />
    </View>
  );
}

// Small avatar circle with initial letter.
function ProAvatar({ initial, size = 28 }: { initial: string; size?: number }) {
  return (
    <View style={[styles.proAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.proAvatarText, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

// ─── Grid tile — small (1×1) ──────────────────────────────────────────────────

function SmallTile({
  work,
  size,
  onPress,
}: {
  work: Work;
  size: number;
  onPress: (w: Work) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(work)}
      style={{ width: size, height: size, overflow: 'hidden' }}>
      <TileBg work={work} />
      {/* service label */}
      <View style={styles.smTileLabel}>
        <Text style={styles.smTileLabelText} numberOfLines={1}>{work.service}</Text>
      </View>
      {/* sparkle icon */}
      <Text style={styles.smTileSparkle}>✦</Text>
    </TouchableOpacity>
  );
}

// ─── Grid tile — spotlight (2×2) ─────────────────────────────────────────────

function SpotlightTile({
  work,
  size,
  onPress,
  onAgendar,
  colors: c,
}: {
  work: Work;
  size: number;
  onPress: (w: Work) => void;
  onAgendar: (w: Work) => void;
  colors: ReturnType<typeof makeColors>;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(work)}
      style={{ width: size, height: size, overflow: 'hidden' }}>
      <TileBg work={work} />

      {/* category chip top-left */}
      <View style={styles.spotCatChip}>
        <Text style={styles.spotCatChipText}>{work.category}</Text>
      </View>

      {/* bottom scrim */}
      <View style={styles.spotScrim} />

      {/* bottom info */}
      <View style={styles.spotBottom}>
        <Text style={styles.spotService} numberOfLines={2}>{work.service}</Text>
        <View style={styles.spotFooter}>
          <View style={styles.spotProRow}>
            <ProAvatar initial={work.pro.initial} size={26} />
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.spotProName} numberOfLines={1}>{work.pro.name}</Text>
              <Text style={styles.spotProRating}>★ {work.pro.rating}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation?.(); onAgendar(work); }}
            activeOpacity={0.85}
            style={[styles.agendarPill, { backgroundColor: c.accent }]}>
            <Text style={styles.agendarPillText}>Agendar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Grid block (7 items → 3 rows) ───────────────────────────────────────────
// Pattern A (left): [big 2×2][sm] / [big][sm] / [sm][sm][sm]
// Pattern B (right): [sm][big 2×2] / [sm][big] / [sm][sm][sm]

function GridBlock({
  items,
  isLeft,
  colW,
  gap,
  onOpen,
  onAgendar,
  colors,
}: {
  items: Work[];
  isLeft: boolean;
  colW: number;
  gap: number;
  onOpen: (w: Work) => void;
  onAgendar: (w: Work) => void;
  colors: ReturnType<typeof makeColors>;
}) {
  const bigSize = colW * 2 + gap;
  const [big, sm1, sm2, sm3, sm4, sm5] = items;

  return (
    <View>
      {/* Rows 1-2: big tile + 2 stacked smalls */}
      <View style={[styles.blockRow, { gap, marginBottom: gap }]}>
        {isLeft ? (
          <>
            <SpotlightTile work={big} size={bigSize} onPress={onOpen} onAgendar={onAgendar} colors={colors} />
            <View style={{ gap }}>
              <SmallTile work={sm1} size={colW} onPress={onOpen} />
              <SmallTile work={sm2} size={colW} onPress={onOpen} />
            </View>
          </>
        ) : (
          <>
            <View style={{ gap }}>
              <SmallTile work={sm1} size={colW} onPress={onOpen} />
              <SmallTile work={sm2} size={colW} onPress={onOpen} />
            </View>
            <SpotlightTile work={big} size={bigSize} onPress={onOpen} onAgendar={onAgendar} colors={colors} />
          </>
        )}
      </View>

      {/* Row 3: 3 small tiles */}
      <View style={[styles.blockRow, { gap, marginBottom: gap }]}>
        <SmallTile work={sm3} size={colW} onPress={onOpen} />
        <SmallTile work={sm4} size={colW} onPress={onOpen} />
        <SmallTile work={sm5} size={colW} onPress={onOpen} />
      </View>
    </View>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  work,
  onClose,
  onAgendar,
  colors: c,
}: {
  work: Work | null;
  onClose: () => void;
  onAgendar: (w: Work) => void;
  colors: ReturnType<typeof makeColors>;
}) {
  const { top } = useSafeAreaInsets();
  if (!work) return null;

  return (
    <Modal visible animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={[styles.lightboxRoot, { backgroundColor: '#0B0908' }]}>
        {/* full-screen photo area */}
        <View style={StyleSheet.absoluteFill}>
          <TileBg work={work} />
        </View>

        {/* top controls */}
        <View style={[styles.lightboxTop, { paddingTop: top + 12 }]}>
          <TouchableOpacity onPress={onClose} style={[styles.lightboxBackBtn, { borderColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={{ color: '#fff', fontSize: 20, lineHeight: 22 }}>‹</Text>
          </TouchableOpacity>
          <View style={styles.catChip}>
            <Text style={styles.catChipText}>{work.category}</Text>
          </View>
        </View>

        {/* bottom scrim */}
        <View style={styles.lightboxScrim} />

        {/* bottom info */}
        <View style={styles.lightboxBottom}>
          <View style={styles.lightboxProRow}>
            <ProAvatar initial={work.pro.initial} size={44} />
            <View style={{ minWidth: 0, flex: 1 }}>
              <Text style={styles.lightboxProName} numberOfLines={1}>{work.pro.name}</Text>
              <View style={styles.lightboxMeta}>
                <Text style={styles.lightboxSpecialty}>{work.pro.specialty}</Text>
                <Text style={styles.lightboxRating}>★ {work.pro.rating}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.lightboxServiceLabel}>Serviço</Text>
          <Text style={styles.lightboxService}>{work.service}</Text>

          <TouchableOpacity
            onPress={() => onAgendar(work)}
            activeOpacity={0.85}
            style={[styles.lightboxAgendarBtn, { backgroundColor: c.accent }]}>
            <Text style={styles.lightboxAgendarBtnText}>Agendar com {work.pro.name.split(' ')[0]}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── AgendarSheet ──────────────────────────────────────────────────────────────

function AgendarSheet({
  work,
  onClose,
  colors: c,
}: {
  work: Work | null;
  onClose: () => void;
  colors: ReturnType<typeof makeColors>;
}) {
  const [slot, setSlot] = useState(SLOTS[2]);
  const [done, setDone] = useState(false);
  const { bottom } = useSafeAreaInsets();

  if (!work) return null;

  const handleClose = () => {
    setDone(false);
    setSlot(SLOTS[2]);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent onRequestClose={handleClose}>
      <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={handleClose} />
      <View style={[styles.sheetContainer, { backgroundColor: c.surface, paddingBottom: Math.max(bottom, 24) }]}>
        {/* drag handle */}
        <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />

        {done ? (
          <View style={styles.sheetSuccess}>
            <View style={[styles.sheetSuccessIcon, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.sheetSuccessCheck, { color: c.accent }]}>✓</Text>
            </View>
            <Text style={[styles.sheetSuccessTitle, { color: c.textPrimary }]}>
              Pedido{' '}
              <Text style={[styles.sheetSuccessTitleItalic, { color: c.accent }]}>enviado</Text>
            </Text>
            <Text style={[styles.sheetSuccessBody, { color: c.textSecondary }]}>
              {work.pro.name.split(' ')[0]} vai confirmar seu horário de{' '}
              <Text style={{ color: c.textPrimary, fontFamily: 'DMSans_500Medium' }}>{work.service}</Text>{' '}
              às {slot}. Você recebe um aviso no app.
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.85}
              style={[styles.sheetPrimaryBtn, { backgroundColor: c.accent }]}>
              <Text style={styles.sheetPrimaryBtnText}>Concluir</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* pro header */}
            <View style={[styles.sheetProHeader, { borderBottomColor: c.border }]}>
              <View style={[styles.sheetProThumb, { backgroundColor: work.grad[0] }]}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: work.grad[1], opacity: 0.6 }]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sheetProName, { color: c.textPrimary }]}>{work.pro.name}</Text>
                <Text style={[styles.sheetProSpecialty, { color: c.textSecondary }]}>
                  {work.pro.specialty} · ★ {work.pro.rating}
                </Text>
              </View>
            </View>

            {/* service */}
            <Text style={[styles.sheetSectionLabel, { color: c.textTertiary }]}>Você está agendando</Text>
            <Text style={[styles.sheetServiceName, { color: c.textPrimary }]}>{work.service}</Text>

            {/* slots */}
            <Text style={[styles.sheetSectionLabel, { color: c.textTertiary, marginBottom: 12 }]}>Próximos horários · hoje</Text>
            <View style={styles.sheetSlots}>
              {SLOTS.map((s) => {
                const selected = slot === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSlot(s)}
                    activeOpacity={0.8}
                    style={[
                      styles.sheetSlotPill,
                      {
                        backgroundColor: selected ? c.accent : c.subtle,
                        borderColor: selected ? c.accent : c.border,
                      },
                    ]}>
                    <Text style={[styles.sheetSlotText, { color: selected ? '#fff' : c.textSecondary }]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => setDone(true)}
              activeOpacity={0.85}
              style={[styles.sheetPrimaryBtn, { backgroundColor: c.accent }]}>
              <Text style={styles.sheetPrimaryBtnText}>Confirmar agendamento · {slot}</Text>
            </TouchableOpacity>
            <Text style={[styles.sheetDisclaimer, { color: c.textTertiary }]}>
              Sem cobrança agora — você confirma com a profissional.
            </Text>
          </>
        )}
      </View>
    </Modal>
  );
}

// ─── Colors helper ────────────────────────────────────────────────────────────

function makeColors(dark: boolean) {
  return {
    bg:            dark ? Palette.neutral[900]   : Palette.neutral[50],
    surface:       dark ? Palette.neutral[800]   : '#FFFFFF',
    subtle:        dark ? Palette.neutral[700]   : Palette.neutral[100],
    border:        dark ? Palette.neutral[700]   : Palette.neutral[200],
    textPrimary:   dark ? '#F5F2EE'              : Palette.neutral[900],
    textSecondary: dark ? Palette.neutral[400]   : Palette.neutral[500],
    textTertiary:  dark ? Palette.neutral[500]   : Palette.neutral[400],
    accent:        dark ? Palette.rose[400]      : Palette.rose[500],
    accentLight:   dark ? 'rgba(196,92,88,0.15)' : Palette.rose[100],
  };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InspiracoeScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const c = makeColors(dark);
  const { width } = useWindowDimensions();
  const { top: topInset } = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [lightboxWork, setLightboxWork] = useState<Work | null>(null);
  const [sheetWork, setSheetWork] = useState<Work | null>(null);

  const filtered = search.trim()
    ? WORKS.filter(
        (w) =>
          w.service.toLowerCase().includes(search.toLowerCase()) ||
          w.pro.name.toLowerCase().includes(search.toLowerCase()) ||
          w.category.toLowerCase().includes(search.toLowerCase())
      )
    : WORKS;

  const GAP = 3;
  const colW = Math.floor((width - GAP * 2) / 3);

  // Split works into blocks of 6 (1 spotlight + 5 smalls per block)
  // Remainder smalls are rendered after blocks
  const blocks: Work[][] = [];
  let i = 0;
  while (i + 6 <= filtered.length) {
    blocks.push(filtered.slice(i, i + 6));
    i += 6;
  }
  const remainder = filtered.slice(i);

  const handleAgendar = (work: Work) => {
    setLightboxWork(null);
    setSheetWork(work);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* sticky header */}
      <View style={[styles.header, { backgroundColor: c.bg, borderBottomColor: c.border, paddingTop: topInset + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
            <Text style={[styles.backBtnText, { color: c.textSecondary }]}>‹</Text>
          </TouchableOpacity>
          <View style={[styles.searchBar, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.searchIcon, { color: c.textTertiary }]}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: c.textPrimary }]}
              placeholder="Buscar trabalhos e profissionais…"
              placeholderTextColor={c.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Inspirações</Text>
          <Text style={[styles.headerCount, { color: c.textTertiary }]}>· {filtered.length} trabalhos</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}>

        <View style={{ paddingTop: GAP }}>
          {blocks.map((block, idx) => (
            <GridBlock
              key={block[0].id}
              items={block}
              isLeft={idx % 2 === 0}
              colW={colW}
              gap={GAP}
              onOpen={setLightboxWork}
              onAgendar={handleAgendar}
              colors={c}
            />
          ))}

          {/* remainder row */}
          {remainder.length > 0 && (
            <View style={[styles.blockRow, { gap: GAP, marginBottom: GAP }]}>
              {remainder.map((w) => (
                <SmallTile key={w.id} work={w} size={colW} onPress={setLightboxWork} />
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.footer, { color: c.textTertiary }]}>Sua beleza, seu tempo.</Text>
      </ScrollView>

      <Lightbox work={lightboxWork} onClose={() => setLightboxWork(null)} onAgendar={handleAgendar} colors={c} />
      <AgendarSheet work={sheetWork} onClose={() => setSheetWork(null)} colors={c} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Header ──
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtnText: {
    fontSize: 26,
    lineHeight: 30,
    includeFontPadding: false,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
  },
  searchIcon: { fontSize: 13 },
  searchInput: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    paddingVertical: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 26,
    letterSpacing: -0.2,
  },
  headerCount: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
  },

  // ── Tile backgrounds ──
  tileBgOverlay: {
    top: '40%',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.75,
    position: 'absolute',
  },

  // ── Small tile ──
  smTileLabel: {
    position: 'absolute',
    bottom: 6,
    left: 4,
    right: 4,
    alignItems: 'center',
  },
  smTileLabelText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  smTileSparkle: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Spotlight tile ──
  spotCatChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(20,18,16,0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  spotCatChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 9,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    color: '#fff',
  },
  spotScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '62%',
    backgroundColor: 'transparent',
    // Using a semi-transparent view over the gradient to simulate scrim
  },
  spotBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: 'rgba(13,10,9,0.72)',
  },
  spotService: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 18,
    color: '#fff',
    lineHeight: 20,
    marginBottom: 8,
  },
  spotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  spotProRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
    minWidth: 0,
  },
  spotProName: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 13,
    color: '#fff',
    lineHeight: 15,
  },
  spotProRating: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Agendar pill ──
  agendarPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexShrink: 0,
  },
  agendarPillText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.2,
  },

  // ── Pro avatar ──
  proAvatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  proAvatarText: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
    color: '#fff',
  },

  // ── Grid block ──
  blockRow: {
    flexDirection: 'row',
  },

  // ── Lightbox ──
  lightboxRoot: {
    flex: 1,
  },
  lightboxTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  lightboxBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(20,18,16,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    backgroundColor: 'rgba(11,9,8,0.82)',
  },
  lightboxBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    paddingBottom: 36,
    zIndex: 5,
  },
  lightboxProRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  lightboxProName: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 22,
    color: '#fff',
    lineHeight: 25,
  },
  lightboxMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 3,
  },
  lightboxSpecialty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  lightboxRating: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  lightboxServiceLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  lightboxService: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 30,
    color: '#fff',
    marginBottom: 20,
    lineHeight: 34,
  },
  lightboxAgendarBtn: {
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxAgendarBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    color: '#fff',
    letterSpacing: 0.3,
  },

  // ── Category chip (lightbox) ──
  catChip: {
    backgroundColor: 'rgba(20,18,16,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  catChipText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
    color: '#fff',
  },

  // ── Agendar sheet ──
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetProHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    marginBottom: 18,
  },
  sheetProThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  sheetProName: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 20,
    lineHeight: 23,
  },
  sheetProSpecialty: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
  sheetSectionLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.14,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sheetServiceName: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 26,
    lineHeight: 30,
    marginBottom: 22,
  },
  sheetSlots: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 26,
  },
  sheetSlotPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sheetSlotText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 13,
  },
  sheetPrimaryBtn: {
    borderRadius: 999,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
  sheetDisclaimer: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },

  // ── Success state ──
  sheetSuccess: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 0,
  },
  sheetSuccessIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sheetSuccessCheck: {
    fontSize: 30,
    lineHeight: 34,
  },
  sheetSuccessTitle: {
    fontFamily: 'CormorantGaramond_400Regular',
    fontSize: 28,
    lineHeight: 32,
    marginBottom: 10,
  },
  sheetSuccessTitleItalic: {
    fontFamily: 'CormorantGaramond_400Regular_Italic',
  },
  sheetSuccessBody: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 26,
    maxWidth: 300,
  },

  // ── Footer ──
  footer: {
    fontFamily: 'CormorantGaramond_300Light_Italic',
    fontSize: 18,
    textAlign: 'center',
    paddingVertical: 28,
  },
});
