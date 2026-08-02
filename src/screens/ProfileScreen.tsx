import React, { ReactNode, useState } from 'react';
import { View, Pressable, Image, StyleSheet, TextInput, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OverlayScreen } from '../components/OverlayScreen';
import { BottomSheet } from '../components/BottomSheet';
import { useC } from '../theme/ThemeContext';
import { radius, shadowSm } from '../theme/tokens';
import { Txt, Card, CoinPill, Btn } from '../components/ui';
import { Icon, IconName } from '../components/Icon';
import { Art } from '../components/Art';
import { useStore } from '../store/store';
import { levelInfo } from '../domain/mechanics';
import { ACHIEVEMENTS, GARDEN, THEMES, spec } from '../domain/catalogs';
import { today, daysBetween } from '../domain/dates';
import { img } from '../assets/registry';

const money = (n: number) => Number(n || 0).toLocaleString('en-US');

// Settings toggle metadata (icon + label + sub copy, verbatim from the prototype).
const TOGGLES: { key: 'notif' | 'evening' | 'hunger' | 'sound'; icon: IconName; title: string; sub: string }[] = [
  { key: 'notif', icon: 'bell', title: 'Reminders', sub: 'Per-habit nudges at the time you set' },
  { key: 'evening', icon: 'clock', title: 'Evening sweep', sub: 'A 20:00 ping if habits are still due' },
  { key: 'hunger', icon: 'heart', title: 'Care alerts', sub: 'When your companion gets hungry' },
  { key: 'sound', icon: 'bell', title: 'Sound effects', sub: 'Small chimes on check-off' },
];

export function ProfileScreen() {
  const c = useC();
  const st = useStore((s) => s.state!);
  const openOverlay = useStore((s) => s.openOverlay);
  const closeAllOverlays = useStore((s) => s.closeAllOverlays);
  const setTab = useStore((s) => s.setTab);
  const setName = useStore((s) => s.setName);
  const resetData = useStore((s) => s.resetData);
  const showToast = useStore((s) => s.showToast);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [resetOpen, setResetOpen] = useState(false);

  const P = st.profile;
  const L = levelInfo(st);
  const xpPct = Math.min(100, Math.round((L.xp / L.need) * 100));
  const totalKept = st.habits.reduce(
    (a, h) => a + Object.values(h.logs).filter((v) => v === 'done').length,
    0,
  );
  const histKeys = Object.keys(st.history).sort();
  const firstDay = histKeys.length ? histKeys[0] : today();
  const trackedDays = daysBetween(firstDay, today()) + 1;

  const hatched = st.pet.hatchState === 'hatched';
  const sp = spec(st.pet.species);
  const petName = st.pet.name;
  const speciesWord = hatched ? sp.name.toLowerCase() : 'unhatched';
  const subtitle = `Level ${L.lvl} · ${petName || 'egg'} the ${speciesWord}`;
  const themeName = (THEMES.find((t) => t.id === P.theme) || THEMES[0]).name;

  const avatarInner = !hatched ? (
    <Art name="eggWhole" height={78} />
  ) : sp.kind === 'svg' ? (
    <Art name={sp.art!} height={78} />
  ) : (
    <Image source={img[(sp.img || 'dogThumb') as keyof typeof img]} style={{ width: 64, height: 64, resizeMode: 'cover' }} />
  );

  const openEdit = () => { setDraft(P.name); setEditOpen(true); };
  const saveName = () => {
    const v = draft.trim();
    if (v) setName(v);
    setEditOpen(false);
  };
  const goGarden = () => { closeAllOverlays(); setTab('garden'); };
  const doReset = async () => { setResetOpen(false); await resetData(); };

  return (
    <OverlayScreen title="Profile" right={<CoinPill amount={P.coins} />}>
      {/* ── Header: avatar, name, level + XP ── */}
      <LinearGradient colors={[c.teal, c.teal2]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.profhead}>
        <View style={styles.profav}>
          <View style={styles.avwrap}>
            <View style={styles.avin}>{avatarInner}</View>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight={800} size={19} color="#fff" numberOfLines={1}>{P.name || 'You'}</Txt>
            <Txt weight={600} size={12} color={c.sky} numberOfLines={1} style={{ marginTop: 2 }}>{subtitle}</Txt>
          </View>
          <Pressable onPress={openEdit} style={styles.editbtn}>
            <Icon name="edit" size={14} color="#fff" />
            <Txt weight={700} size={13} color="#fff">Edit</Txt>
          </Pressable>
        </View>
        <View style={styles.xpbar}><View style={[styles.xpfill, { width: `${xpPct}%`, backgroundColor: c.yellow }]} /></View>
        <View style={styles.xpmeta}>
          <Txt weight={700} size={11} color={c.sky}>{money(L.xp)} of {money(L.need)} XP</Txt>
          <Txt weight={700} size={11} color={c.sky}>Level {L.lvl + 1} next</Txt>
        </View>
      </LinearGradient>

      {/* ── Lifetime stat tiles ── */}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <Tile icon="flame" v={money(P.streak)} l="Streak" />
        <Tile icon="medal" v={money(P.best)} l="Best" />
        <Tile icon="check" v={money(totalKept)} l="Kept" />
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
        <Tile icon="trophy" v={money(st.achievements.length)} l="Badges" />
        <Tile coin v={money(P.lifetimeCoins)} l="Earned" />
        <Tile icon="sparkle" v={money(L.lvl)} l="Level" />
      </View>

      {/* ── Your progress ── */}
      <SectionHead title="Your progress" />
      <Card style={{ paddingHorizontal: 16 }}>
        <LinkRow icon="chart" title="Insights" sub={`${trackedDays} days tracked across 30 metrics`} onPress={() => openOverlay('insights')} />
        <LinkRow icon="trophy" title="Achievements" sub={`${st.achievements.length} of ${ACHIEVEMENTS.length} badges`} onPress={() => openOverlay('achievements')} />
        <LinkRow icon="gift" title="Weekly recap" sub="Your week, side by side with last week" onPress={() => openOverlay('recap')} />
        <LinkRow icon="sprout" title="Habit Garden" sub={`${st.garden.length} of ${GARDEN.length} plots grown`} onPress={goGarden} last />
      </Card>

      {/* ── HabitHatch+ promo ── */}
      <Pressable onPress={() => openOverlay('premium')} style={({ pressed }) => [{ marginTop: 18 }, pressed && { transform: [{ scale: 0.99 }] }]}>
        <View style={styles.plusrow}>
          <LinearGradient colors={['#FFDA7C', '#F4B942']} style={styles.plusic}>
            <Icon name="crown" size={24} color="#7A4B00" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Txt weight={800} size={15.5} color={c.tealInk}>HabitHatch+</Txt>
              {P.premium && (
                <View style={[styles.plusb, { backgroundColor: c.good }]}><Txt weight={800} size={8.5} color="#fff">ACTIVE</Txt></View>
              )}
            </View>
            <Txt weight={600} size={11.5} color="#8A7550" style={{ marginTop: 3, lineHeight: 16 }}>
              {P.premium ? 'Themes, the full collection and every dashboard are yours.' : 'Five themes, every companion and outfit, 30 metrics.'}
            </Txt>
          </View>
          <View style={[styles.pluscta, { backgroundColor: c.yellow }]}>
            <Txt weight={800} size={12} color="#7A4B00">{P.premium ? 'Manage' : 'See plans'}</Txt>
          </View>
        </View>
      </Pressable>

      {/* ── Appearance ── */}
      <SectionHead title="Appearance" />
      <Card style={{ paddingHorizontal: 16 }}>
        <LinkRow icon="sparkle" title="Themes" sub={`${themeName} theme · ${P.premium ? 'all 5 unlocked' : '1 of 5 free'}`} onPress={() => openOverlay('appearance')} last />
      </Card>

      {/* ── Shop and extras ── */}
      <SectionHead title="Shop and extras" />
      <Card style={{ paddingHorizontal: 16 }}>
        <LinkRow icon="bag" title="Shop" sub="Food, companions, wardrobe" onPress={() => openOverlay('shop', { tab: 'food' })} />
        <LinkRow icon="users" title="Invite a friend" sub="You both get a Streak Freeze" onPress={() => openOverlay('referral')} last />
      </Card>

      {/* ── Settings ── */}
      <SectionHead title="Settings" />
      <Card style={{ paddingHorizontal: 16 }}>
        {TOGGLES.map((t, i) => (
          <ToggleRow key={t.key} icon={t.icon} title={t.title} sub={t.sub} settingKey={t.key} last={i === TOGGLES.length - 1} />
        ))}
      </Card>

      {/* ── Data ── */}
      <SectionHead title="Data" />
      <Card style={{ paddingHorizontal: 16 }}>
        <LinkRow icon="offline" title="Everything is offline" sub="Your habits live on this device only" onPress={() => showToast('Nothing here leaves your phone.')} />
        <LinkRow icon="trash" title="Reset all data" sub="Start over from a fresh egg" onPress={() => setResetOpen(true)} last danger />
      </Card>

      <Txt weight={500} size={11.5} color={c.muted} style={styles.note}>
        HabitHatch v1.0. Health never reaches zero and nothing here can die. A missed day only makes your companion a little hungry.
      </Txt>

      {/* ── Edit name sheet ── */}
      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title="What should we call you?" subtitle="Only used to say hello.">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          maxLength={18}
          autoFocus
          placeholder="Your name"
          placeholderTextColor={c.muted}
          style={[styles.field, { borderColor: c.line, color: c.ink }]}
          onSubmitEditing={saveName}
          returnKeyType="done"
        />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <View style={{ flex: 1 }}><Btn title="Cancel" variant="ghost" block onPress={() => setEditOpen(false)} /></View>
          <View style={{ flex: 1 }}><Btn title="Save" block onPress={saveName} /></View>
        </View>
      </BottomSheet>

      {/* ── Reset confirm sheet ── */}
      <BottomSheet visible={resetOpen} onClose={() => setResetOpen(false)} title="Reset all data" subtitle="This wipes every habit, your companion, coins and all progress on this device and starts you over from a fresh egg. It cannot be undone.">
        <Pressable onPress={doReset} style={({ pressed }) => [styles.dangerBtn, { backgroundColor: c.danger }, pressed && { opacity: 0.9 }]}>
          <Icon name="trash" size={16} color="#fff" />
          <Txt weight={700} size={15} color="#fff">Reset everything</Txt>
        </Pressable>
        <View style={{ marginTop: 10 }}><Btn title="Cancel" variant="ghost" block onPress={() => setResetOpen(false)} /></View>
      </BottomSheet>
    </OverlayScreen>
  );
}

function Tile({ icon, coin, v, l }: { icon?: IconName; coin?: boolean; v: string; l: string }) {
  const c = useC();
  return (
    <View style={[styles.tile, { backgroundColor: '#fff', borderColor: c.line, ...shadowSm(c) }]}>
      <View style={styles.tileic}>
        {coin ? <Image source={img.coin} style={{ width: 18, height: 18 }} /> : <Icon name={icon!} size={18} color={c.teal} />}
      </View>
      <Txt weight={800} size={20} color={c.tealInk}>{v}</Txt>
      <Txt weight={700} size={10.5} color={c.muted} style={styles.tilel}>{l.toUpperCase()}</Txt>
    </View>
  );
}

function SectionHead({ title }: { title: string }) {
  const c = useC();
  return (
    <View style={styles.shead}>
      <Txt weight={700} size={16} color={c.tealInk}>{title}</Txt>
    </View>
  );
}

function LinkRow({ icon, title, sub, onPress, last, danger }: { icon: IconName; title: string; sub: string; onPress: () => void; last?: boolean; danger?: boolean }) {
  const c = useC();
  const fg = danger ? c.danger : c.teal;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.setrow, { borderBottomColor: c.line, borderBottomWidth: last ? 0 : 1 }, pressed && { opacity: 0.6 }]}>
      <View style={[styles.setic, { backgroundColor: c.cream }]}><Icon name={icon} size={18} color={fg} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={600} size={14} color={danger ? c.danger : c.tealInk}>{title}</Txt>
        <Txt weight={500} size={11} color={c.muted} style={{ marginTop: 1 }}>{sub}</Txt>
      </View>
      <Icon name="chevR" size={16} color={c.line2} />
    </Pressable>
  );
}

function ToggleRow({ icon, title, sub, settingKey, last }: { icon: IconName; title: string; sub: string; settingKey: 'notif' | 'evening' | 'hunger' | 'sound'; last?: boolean }) {
  const c = useC();
  const on = useStore((s) => s.state!.settings[settingKey]);
  const toggleSetting = useStore((s) => s.toggleSetting);
  const showToast = useStore((s) => s.showToast);
  const flip = () => { toggleSetting(settingKey); showToast(`${title} ${on ? 'off' : 'on'}`); };
  return (
    <View style={[styles.setrow, { borderBottomColor: c.line, borderBottomWidth: last ? 0 : 1 }]}>
      <View style={[styles.setic, { backgroundColor: c.cream }]}><Icon name={icon} size={18} color={c.teal} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight={600} size={14} color={c.tealInk}>{title}</Txt>
        <Txt weight={500} size={11} color={c.muted} style={{ marginTop: 1 }}>{sub}</Txt>
      </View>
      <Switch value={on} onValueChange={flip} trackColor={{ false: c.line2, true: c.good }} thumbColor="#fff" ios_backgroundColor={c.line2} />
    </View>
  );
}

const styles = StyleSheet.create({
  profhead: { borderRadius: radius.lg, padding: 16, paddingBottom: 18, overflow: 'hidden' },
  profav: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avwrap: { width: 64, height: 64, borderRadius: 32, overflow: 'hidden', borderWidth: 2.5, borderColor: '#fff', backgroundColor: '#DDEDE9', alignItems: 'center', justifyContent: 'flex-end' },
  avin: { height: '122%', alignItems: 'center', justifyContent: 'flex-end' },
  editbtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.16)', paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
  xpbar: { height: 9, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden', marginTop: 14 },
  xpfill: { height: '100%', borderRadius: 9 },
  xpmeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  tile: { flex: 1, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', borderWidth: 1 },
  tileic: { marginBottom: 5 },
  tilel: { marginTop: 4, letterSpacing: 0.3 },
  shead: { marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  setrow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  setic: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  plusrow: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: '#FFF7EC', borderWidth: 1.5, borderColor: '#F1D9A8', borderRadius: radius.lg, padding: 14, paddingHorizontal: 15 },
  plusic: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  plusb: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: radius.pill },
  pluscta: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: '#E8C46A' },
  note: { textAlign: 'center', marginTop: 16, lineHeight: 17 },
  field: { width: '100%', backgroundColor: '#fff', borderWidth: 2, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 16, fontSize: 16, fontFamily: 'Poppins-Bold' },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: radius.md },
});
