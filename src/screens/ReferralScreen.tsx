import React, { useState } from 'react';
import { View, Pressable, StyleSheet, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { OverlayScreen } from '../components/OverlayScreen';
import { useC } from '../theme/ThemeContext';
import { radius, shadowCard, fontFor } from '../theme/tokens';
import { Txt, Btn, Card, Chip } from '../components/ui';
import { Icon } from '../components/Icon';
import { useStore } from '../store/store';
import { planted } from '../domain/mechanics';

// Referral / invite overlay. Ported from the prototype `renderReferral` (proto-premium-referral.md
// Part B). Faithful copy/layout; the two hero surfaces stay teal in every theme (hardcoded hex),
// while cards/chips retheme via useC(). Sharing and redeeming are the only online paths — redeem is
// parked (offline stub) here, per the task and the offline note at the bottom.
export function ReferralScreen({ param }: { param?: any }) {
  const c = useC();
  const st = useStore((s) => s.state!);
  const showToast = useStore((s) => s.showToast);
  const code = st.profile.code || 'HATCH-4K9Q';
  const hasSapling = planted(st, 'sapling');

  const [entry, setEntry] = useState('');
  const [focused, setFocused] = useState(false);

  const onCopy = async () => {
    try {
      await Clipboard.setStringAsync(code);
    } catch {
      // Clipboard is best-effort; the toast still confirms the intent.
    }
    showToast('Code copied');
  };

  const onShare = async () => {
    try {
      await Share.share({ title: 'HabitHatch', message: `Join me on HabitHatch. My code is ${code}` });
    } catch {
      // User dismissed or the sheet failed — nothing to recover.
    }
    showToast('Share sheet opened');
  };

  const onRedeem = () => {
    const v = entry.trim().toUpperCase();
    if (!v) {
      showToast('Enter a code first');
      return;
    }
    if (v === code.toUpperCase()) {
      showToast('That is your own code');
      return;
    }
    // Redeeming is the one online-only action; parked in this offline build.
    showToast('Redeeming a code needs a connection. Parked for now.');
  };

  return (
    <OverlayScreen title="Invite friends">
      {/* Hero refcard — teal gradient, hardcoded hex (does not retheme). */}
      <LinearGradient
        colors={['#0C4C60', '#12667F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.65 }}
        style={[styles.refcard, { ...shadowCard(c) }]}
      >
        <Txt weight={800} size={15} color="#fff">Give a Freeze, get a Freeze</Txt>
        <Txt weight={500} size={12.5} color="#D6EEF7" style={{ marginTop: 4, lineHeight: 19 }}>
          Share your code. When a friend enters it on their first day, you both get a Streak Freeze, the token that covers one missed day.
        </Txt>

        <Pressable onPress={onCopy} style={styles.refcode}>
          <Txt weight={800} size={18} color="#fff" style={{ textAlign: 'center', letterSpacing: 3 }}>{code}</Txt>
          <View style={styles.copyTag}>
            <View style={styles.copyPill}><Txt weight={800} size={9.5} color="#fff">COPY</Txt></View>
          </View>
        </Pressable>

        <WhiteBrick title="Share invite" onPress={onShare} />
      </LinearGradient>

      {/* Have a code? */}
      <View style={styles.shead}><Txt weight={700} size={16} color={c.tealInk}>Have a code?</Txt></View>

      <TextInput
        value={entry}
        onChangeText={setEntry}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onRedeem}
        placeholder="Enter a friend's code"
        placeholderTextColor="#BDB8AB"
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="done"
        style={[styles.field, { backgroundColor: c.white, borderColor: focused ? c.orange : c.line, color: c.ink, fontFamily: fontFor(600) }]}
      />

      <Btn title="Redeem code" variant="teal" block onPress={onRedeem} style={{ marginTop: 10 }} />

      {/* Freeze wallet */}
      <Card style={styles.freezeCard}>
        <View style={styles.freezeRow}>
          <Txt weight={800} size={14} color={c.tealInk}>Your Streak Freezes</Txt>
          <Chip label={`${st.profile.freezes} in hand`} tone="good" left={<Icon name="snow" size={12} color={c.good} />} />
        </View>
        <Txt weight={600} size={11} color={c.muted} style={{ marginTop: 8, lineHeight: 16 }}>
          A Freeze is spent automatically on a day you would otherwise lose the streak. {hasSapling ? 'Your Young Sapling grants one every week.' : 'Plant the Young Sapling in the Garden to earn one weekly.'}
        </Txt>
      </Card>

      {/* Offline note */}
      <View style={[styles.offnote, { backgroundColor: c.cream, borderColor: c.line2 }]}>
        <View style={{ marginTop: 1 }}><Icon name="offline" size={15} color={c.teal} /></View>
        <Txt weight={600} size={11.5} color={c.muted} style={{ flex: 1, lineHeight: 16 }}>
          Sharing and redeeming are the only things in HabitHatch that need internet, so a code can be checked once. Everything else works offline.
        </Txt>
      </View>
    </OverlayScreen>
  );
}

// The prototype's white "brick" button (white face over a dark 5px shade), used on the teal
// refcard where the shared Btn variants would not read. Mirrors `.btn.block` + inline white style.
function WhiteBrick({ title, onPress }: { title: string; onPress: () => void }) {
  const c = useC();
  return (
    <Pressable onPress={onPress} style={{ width: '100%' }}>
      {({ pressed }) => (
        <View style={{ borderRadius: radius.md, backgroundColor: 'rgba(0,0,0,0.15)', paddingBottom: 5 }}>
          <View
            style={{
              borderRadius: radius.md,
              backgroundColor: '#fff',
              paddingVertical: 14,
              paddingHorizontal: 18,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateY: pressed ? 3 : 0 }],
            }}
          >
            <Txt weight={700} size={15} color={c.teal}>{title}</Txt>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  refcard: { borderRadius: 22, padding: 18 },
  refcode: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginVertical: 12,
    justifyContent: 'center',
  },
  copyTag: { position: 'absolute', right: 9, top: 0, bottom: 0, justifyContent: 'center' },
  copyPill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 3, paddingHorizontal: 7, borderRadius: radius.pill },
  shead: { marginTop: 18, marginBottom: 10, marginHorizontal: 2 },
  field: { width: '100%', borderWidth: 2, borderRadius: radius.md, paddingVertical: 15, paddingHorizontal: 16, fontSize: 16 },
  freezeCard: { paddingVertical: 14, paddingHorizontal: 16, marginTop: 16 },
  freezeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offnote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 14, paddingVertical: 11, paddingHorizontal: 13, borderRadius: radius.sm, borderWidth: 1 },
});
