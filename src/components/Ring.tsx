import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useC } from '../theme/ThemeContext';

// The Today day-ring. With 2..10 due habits it draws one rounded arc per goal unit, lit up
// to `done` (proto ringSVG segmentation). Otherwise a single sweeping arc for `done/goal`.
export function DayRing({
  size = 88, done, goal, children,
}: { size?: number; done: number; goal: number; children?: React.ReactNode }) {
  const c = useC();
  const r = size / 2 - 6;
  const cx = size / 2;
  const C = 2 * Math.PI * r;
  const total = goal;
  const segmented = total > 1 && total <= 10;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {segmented ? (
          (() => {
            const gap = total <= 8 ? 16 : 11;
            const step = 360 / total;
            const arc = step - gap;
            const arcFrac = arc / 360;
            return Array.from({ length: total }).map((_, i) => {
              const startA = i * step + gap / 2;
              return (
                <Circle
                  key={i}
                  cx={cx}
                  cy={cx}
                  r={r}
                  stroke={i < done ? c.teal : c.line}
                  strokeWidth={8}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${arcFrac * C} ${C - arcFrac * C}`}
                  strokeDashoffset={-(startA / 360) * C}
                  transform={`rotate(-90 ${cx} ${cx})`}
                />
              );
            });
          })()
        ) : (
          <>
            <Circle cx={cx} cy={cx} r={r} stroke={c.line} strokeWidth={8} fill="none" />
            {done > 0 && (
              <Circle
                cx={cx}
                cy={cx}
                r={r}
                stroke={c.orange}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - Math.min(1, done / Math.max(1, goal)))}
                transform={`rotate(-90 ${cx} ${cx})`}
              />
            )}
          </>
        )}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// The per-habit progress ring drawn inside the check control when not yet done. Shows the
// streak tier (cur % 3 of 3) filling toward the next coin bonus.
export function HabitProgressRing({ size = 48, cur }: { size?: number; cur: number }) {
  const c = useC();
  const vb = 100;
  const r = 38;
  const cxy = 50;
  const C = 2 * Math.PI * r;
  const tier = cur % 3;
  const pct = tier / 3;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${vb} ${vb}`}>
      <Circle cx={cxy} cy={cxy} r={r} stroke={c.line} strokeWidth={11} fill="none" />
      {pct > 0 && (
        <Circle cx={cxy} cy={cxy} r={r} stroke={c.orange} strokeWidth={11} strokeLinecap="round" fill="none" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} transform={`rotate(-90 ${cxy} ${cxy})`} />
      )}
      <Circle cx={cxy} cy={cxy} r={24} fill={c.cream} stroke={c.line2} strokeWidth={1} />
    </Svg>
  );
}
