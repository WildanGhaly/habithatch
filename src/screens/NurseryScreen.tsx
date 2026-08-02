import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Txt, Btn } from '../components/ui';
import { Icon } from '../components/Icon';
import { Art } from '../components/Art';
import { PetView } from '../components/PetView';
import { useStore } from '../store/store';
import { spec } from '../domain/catalogs';

const STEP_COPY = [
  { h: 'Something is moving', p: 'Three days of showing up. The egg can feel it.' },
  { h: 'A first crack', p: 'Whatever is in there really wants to meet you.' },
  { h: 'Almost…', p: 'Hold on.' },
];
const NAMES = ['Pip', 'Sprig', 'Moss', 'Juniper', 'Bramble', 'Nori', 'Clover', 'Tuck', 'Willow', 'Fern', 'Hazel', 'Poppy', 'Ember', 'Cricket'];

// The signature egg -> crack -> hatch -> star burst -> name-your-companion moment.
export function NurseryScreen() {
  const insets = useSafeAreaInsets();
  const commitHatch = useStore((s) => s.commitHatch);
  const showReward = useStore((s) => s.showReward);
  const showToast = useStore((s) => s.showToast);
  const st = useStore((s) => s.state!);
  const sp = spec(st.pet.species);

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // egg + glow + reveal animation values
  const shake = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    timers.current = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3400),
      setTimeout(() => setStep(3), 5300),
    ];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const skip = () => { timers.current.forEach(clearTimeout); setStep(3); };

  useEffect(() => {
    if (step === 1) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 140, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start();
    }
    if (step === 2) {
      Animated.timing(glow, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(burst, { toValue: 1, duration: 230, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(burst, { toValue: 0, duration: 270, useNativeDriver: true }),
      ]).start();
    }
    if (step === 3) {
      Animated.timing(glow, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 1.06, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
      Animated.spring(reveal, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    }
  }, [step]);

  const finish = () => {
    const v = name.trim();
    if (!v) { showToast('Give them a name first'); return; }
    commitHatch(v); // flips state + names + closes overlay
    const glyph = sp.kind === 'svg' ? { type: 'art' as const, name: sp.art! } : { type: 'img' as const, name: sp.img! };
    showReward({
      title: `Meet ${v}`,
      sub: `Your ${sp.name.toLowerCase()} is home.`,
      glyph,
      note: `${v} starts at full health. Keep your habits and it stays that way. Miss a day and it just gets a little hungry.`,
      goal: 'Growth stage: Baby · reach a 7 day streak for Young',
    });
  };

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [1, 1.13] });
  const pronoun = sp.name === 'Fox' || sp.name === 'Cat' ? 'her' : 'them';

  return (
    <LinearGradient colors={['#16657D', '#0C4C60', '#08394A']} style={styles.root}>
      {step < 3 && (
        <Pressable onPress={skip} style={[styles.skip, { top: insets.top + 16 }]}>
          <Txt weight={700} size={12.5} color="#BFE3F3">Skip</Txt>
        </Pressable>
      )}
      <View style={styles.nurs}>
        <View style={styles.stage}>
          <Animated.View style={[styles.glow, { opacity: step >= 2 ? 1 : 0, transform: [{ scale: glow.interpolate({ inputRange: [0, 1, 1.06], outputRange: [0.94, 1, 1.06] }) }] }]}>
            <LinearGradient colors={['rgba(255,218,124,0.55)', 'rgba(255,218,124,0)']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0.5 }} end={{ x: 1, y: 1 }} />
          </Animated.View>

          {step === 3 && <StarBurst />}

          {step < 3 ? (
            <Animated.View style={{ transform: [{ rotate }, { scale: burstScale }] }}>
              <Art name={step === 0 ? 'eggWhole' : 'eggCrack'} height={250} />
            </Animated.View>
          ) : (
            <Animated.View style={{ opacity: reveal, transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
              <PetView species={st.pet.species} clothesId={0} height={230} speed={1.25} />
            </Animated.View>
          )}
        </View>

        <View style={styles.txt}>
          {step < 3 ? (
            <>
              <Txt weight={700} size={25} color="#fff" style={{ textAlign: 'center', lineHeight: 30 }}>{STEP_COPY[step]?.h}</Txt>
              <Txt weight={600} size={14} color="#BFE3F3" style={{ textAlign: 'center', marginTop: 8, lineHeight: 21 }}>{STEP_COPY[step]?.p}</Txt>
            </>
          ) : (
            <>
              <Txt weight={700} size={25} color="#fff" style={{ textAlign: 'center', lineHeight: 30 }}>It's a {sp.name.toLowerCase()}!</Txt>
              <Txt weight={600} size={14} color="#BFE3F3" style={{ textAlign: 'center', marginTop: 8, lineHeight: 21 }}>Born from a three day streak.{'\n'}What should we call {pronoun}?</Txt>
            </>
          )}
        </View>

        {step === 3 && (
          <View style={styles.foot}>
            <TextInput
              style={styles.field}
              placeholder="e.g. Pip"
              placeholderTextColor="#BDB8AB"
              maxLength={16}
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <Btn title="That's the one" block style={{ marginTop: 12 }} onPress={finish} />
            <Pressable onPress={() => setName(NAMES[Math.floor((Date.now() / 1000) % NAMES.length)])} style={{ alignSelf: 'center', marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Icon name="sparkle" size={13} color="#8FC0CC" />
              <Txt weight={700} size={12.5} color="#8FC0CC">Surprise me</Txt>
            </Pressable>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

function StarBurst() {
  const stars = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    const dist = 110 + ((i * 37) % 60);
    return { sx: Math.cos(a) * dist, sy: Math.sin(a) * dist, art: `star${(i % 3) + 1}`, delay: i * 45 };
  }), []);
  return (
    <View style={styles.starburst} pointerEvents="none">
      {stars.map((s, i) => <Star key={i} {...s} />)}
    </View>
  );
}
function Star({ sx, sy, art, delay }: { sx: number; sy: number; art: string; delay: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 1100, delay, easing: Easing.bezier(0.2, 0.8, 0.3, 1), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -19, marginTop: -19, opacity: t.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 0] }), transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, sx] }) }, { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, sy] }) }, { scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.1] }) }, { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '220deg'] }) }] }}>
      <Art name={art} height={38} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  skip: { position: 'absolute', right: 16, zIndex: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  nurs: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 26, paddingHorizontal: 24 },
  stage: { width: 250, height: 280, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, overflow: 'hidden' },
  starburst: { position: 'absolute', top: -30, left: -30, right: -30, bottom: -30, zIndex: 1 },
  txt: { alignItems: 'center', marginTop: 6, zIndex: 4 },
  foot: { width: '100%', maxWidth: 330, marginTop: 22, zIndex: 4 },
  field: { width: '100%', backgroundColor: '#fff', borderWidth: 2, borderColor: '#EFE6D6', borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, fontSize: 17, fontFamily: 'Poppins-Bold', color: '#2D2F41', textAlign: 'center' },
});
