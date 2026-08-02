import React from 'react';
import { SvgXml } from 'react-native-svg';
import { ART } from '../art/art';

// Extracts the viewBox aspect (w/h) so we can size art by height and keep proportions.
function aspectOf(xml: string): number {
  const m = xml.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  if (!m) return 1;
  const w = parseFloat(m[1]);
  const h = parseFloat(m[2]);
  return h ? w / h : 1;
}

// Renders a piece of inline SVG art (species, egg stages, garden scenes, category glyphs,
// flame, stars…) from the ART registry. Size by `height` (width follows the viewBox aspect)
// or pass both explicitly.
export function Art({
  name,
  height,
  width,
  size,
  style,
}: {
  name: string;
  height?: number;
  width?: number;
  size?: number; // shorthand: square-ish, sets height and derives width from aspect
  style?: any;
}) {
  const xml = ART[name];
  if (!xml) return null;
  const asp = aspectOf(xml);
  let h = height ?? size;
  let w = width;
  if (h != null && w == null) w = h * asp;
  else if (w != null && h == null) h = w / asp;
  else if (h == null && w == null) {
    h = 24;
    w = 24 * asp;
  }
  return <SvgXml xml={xml} width={w} height={h} style={style} />;
}

export { ART };
