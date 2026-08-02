import React from 'react';
import { SvgXml } from 'react-native-svg';
import { colors } from '../theme/tokens';
import { ICONS, IconName } from '../art/icons';

export type { IconName };

// Renders a 24x24 line/fill icon from the prototype ICONS map. `stroke` icons use
// currentColor for the outline (SvgXml `color`); `fill` icons are solid currentColor.
export function Icon({
  name,
  size = 16,
  color = colors.ink,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const entry = ICONS[name];
  if (!entry) return null;
  const [kind, inner] = entry;
  const attrs =
    kind === 'stroke'
      ? `fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"`
      : `fill="currentColor" stroke="none"`;
  const xml = `<svg viewBox="0 0 24 24" ${attrs}>${inner}</svg>`;
  return <SvgXml xml={xml} width={size} height={size} color={color} />;
}
