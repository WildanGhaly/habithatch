import React, { ReactNode } from 'react';
import {
  Text as RNText, TextProps, View, ViewStyle, Pressable, Image, StyleProp, TextStyle,
} from 'react-native';
import { fontFor, radius, shadowCard, shadowSm, MAX_CONTENT } from '../theme/tokens';
import { useC } from '../theme/ThemeContext';
import { img } from '../assets/registry';

type Weight = 400 | 500 | 600 | 700 | 800;

// Centered, width-capped content column. Full width on phones; capped + centered on
// large screens (proto's phone frame is max-width 440).
export function Bounded({
  children, pad = false, style,
}: { children: ReactNode; pad?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        { width: '100%', maxWidth: pad ? MAX_CONTENT : MAX_CONTENT, alignSelf: 'center' },
        pad && { paddingHorizontal: 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Text that always uses Poppins; weight picks Regular/Bold from the two shipped ttf.
export function Txt({
  weight = 400, color, size = 14, style, children, ...rest
}: TextProps & { weight?: Weight; color?: string; size?: number; style?: StyleProp<TextStyle>; children?: ReactNode }) {
  const c = useC();
  return (
    <RNText {...rest} style={[{ fontFamily: fontFor(weight), color: color ?? c.ink, fontSize: size }, style]}>
      {children}
    </RNText>
  );
}

type BtnVariant = 'orange' | 'teal' | 'ghost';

// The prototype's signature 3D "brick" button: a colored shade sits under the face;
// pressing pushes the face down onto it.
export function Btn({
  title, onPress, variant = 'orange', block, disabled, sm, style, left,
}: {
  title: string; onPress?: () => void; variant?: BtnVariant; block?: boolean;
  disabled?: boolean; sm?: boolean; style?: StyleProp<ViewStyle>; left?: ReactNode;
}) {
  const c = useC();
  const FACE: Record<BtnVariant, string> = { orange: c.orange, teal: c.teal, ghost: c.white };
  const SHADE: Record<BtnVariant, string> = { orange: c.orange2, teal: c.tealShade, ghost: c.line2 };
  const face = FACE[variant];
  const shade = SHADE[variant];
  const textColor = variant === 'ghost' ? c.teal : c.white;
  const lip = sm ? 4 : 6;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[block && { width: '100%' }, style, disabled && { opacity: 0.5 }]}>
      {({ pressed }) => (
        <View style={{ borderRadius: sm ? radius.sm : radius.md, backgroundColor: variant === 'ghost' ? 'transparent' : shade, paddingBottom: disabled ? 0 : lip }}>
          <View
            style={{
              borderRadius: sm ? radius.sm : radius.md, backgroundColor: face,
              paddingVertical: sm ? 9 : 14, paddingHorizontal: sm ? 14 : 18,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              transform: [{ translateY: pressed && !disabled ? lip - 2 : 0 }],
              borderWidth: variant === 'ghost' ? 1.5 : 0, borderColor: c.line2,
            }}
          >
            {left}
            <Txt weight={700} color={textColor} size={sm ? 13 : 15}>{title}</Txt>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Card({ children, style, onPress }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useC();
  const content = (
    <View style={[{ backgroundColor: c.card, borderRadius: radius.lg, borderWidth: 1, borderColor: c.line, ...shadowCard(c) }, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => (pressed ? { opacity: 0.97 } : undefined)}>
        {content}
      </Pressable>
    );
  }
  return content;
}

export function CoinPill({ amount, style, onPress }: { amount: number; style?: StyleProp<ViewStyle>; onPress?: () => void }) {
  const c = useC();
  const inner = (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.white, borderWidth: 1.5, borderColor: c.line2, paddingVertical: 6, paddingLeft: 7, paddingRight: 12, borderRadius: radius.pill, ...shadowSm(c) },
        style,
      ]}
    >
      <Image source={img.coin} style={{ width: 22, height: 22 }} />
      <Txt weight={700} color={c.coinInk}>{amount.toLocaleString('en-US')}</Txt>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

export function Chip({ label, color, tone = 'neutral', left }: { label: string; color?: string; tone?: 'neutral' | 'good' | 'warn'; left?: ReactNode }) {
  const c = useC();
  const bg = tone === 'good' ? c.tint2 : tone === 'warn' ? '#FFF4E7' : c.cream;
  const border = tone === 'good' ? '#CFE2E8' : tone === 'warn' ? '#F6DFC4' : c.line2;
  const fg = color ?? (tone === 'good' ? c.good : tone === 'warn' ? c.orange2 : c.teal);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 9, borderRadius: radius.pill, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      {left}
      <Txt weight={600} size={11.5} color={fg}>{label}</Txt>
    </View>
  );
}
