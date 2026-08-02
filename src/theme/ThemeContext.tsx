import React, { createContext, useContext, ReactNode } from 'react';
import { Palette, paletteFor, ThemeId } from './tokens';
import { useStore } from '../store/store';

// Active-theme palette, derived from profile.theme. The prototype's themes only move
// the accent family, so switching theme just changes these ~12 values app-wide.
const ThemeCtx = createContext<Palette>(paletteFor('hatch'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => (s.state?.profile.theme as ThemeId | undefined) ?? 'hatch');
  const palette = paletteFor(theme);
  return <ThemeCtx.Provider value={palette}>{children}</ThemeCtx.Provider>;
}

// The active palette. Screens/components build their styles from this so a theme
// change re-renders them with the new accent family.
export function useC(): Palette {
  return useContext(ThemeCtx);
}
