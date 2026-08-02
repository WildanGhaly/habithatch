import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Dimensions, BackHandler, View } from 'react-native';
import { useStore, OverlayName, OverlayState, isFullOverlay } from '../store/store';

// Overlay screens/sheets registry. Each entry is a component taking { param, visible? }.
// Full overlays slide up from the bottom; sheets render their own BottomSheet. Screens are
// added here as they are built; unknown overlay names simply render nothing.
import { EditorSheet } from '../screens/EditorSheet';
import { GoalSheet } from '../screens/GoalSheet';
import { FeedSheet } from '../screens/FeedSheet';
import { BuySheet } from '../screens/BuySheet';
import { ShopScreen } from '../screens/ShopScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { ReferralScreen } from '../screens/ReferralScreen';
import { RecapScreen } from '../screens/RecapScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AppearanceScreen } from '../screens/AppearanceScreen';
import { NurseryScreen } from '../screens/NurseryScreen';

const FULL: Partial<Record<OverlayName, React.ComponentType<{ param?: any }>>> = {
  shop: ShopScreen,
  insights: InsightsScreen,
  achievements: AchievementsScreen,
  premium: PremiumScreen,
  referral: ReferralScreen,
  recap: RecapScreen,
  profile: ProfileScreen,
  nursery: NurseryScreen,
  appearance: AppearanceScreen,
};

const SHEET: Partial<Record<OverlayName, React.ComponentType<{ param?: any; visible?: boolean }>>> = {
  editor: EditorSheet,
  goal: GoalSheet,
  feed: FeedSheet,
  buy: BuySheet,
};

const H = Dimensions.get('window').height;
const SLIDE_IN = Easing.bezier(0.2, 0.8, 0.2, 1);
const SLIDE_OUT = Easing.bezier(0.4, 0, 0.9, 0.5);

export function OverlayHost() {
  const overlays = useStore((s) => s.overlays);
  const closeOverlay = useStore((s) => s.closeOverlay);
  const translateY = useRef(new Animated.Value(H)).current;
  const prevDepth = useRef(0);

  const [full, setFull] = useState<OverlayState | null>(null);
  const [closing, setClosing] = useState<OverlayState | null>(null);
  const closeY = useRef(new Animated.Value(H)).current;
  const [sheet, setSheet] = useState<OverlayState | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const top = overlays.length ? overlays[overlays.length - 1] : null;
  const topFull = top && isFullOverlay(top.name) && FULL[top.name] ? top : null;
  const topSheet = top && !isFullOverlay(top.name) && SHEET[top.name] ? top : null;

  useEffect(() => {
    const depth = overlays.length;
    const pushed = depth > prevDepth.current;
    prevDepth.current = depth;

    if (topFull && topFull !== full) {
      if (pushed) {
        setFull(topFull);
        translateY.setValue(H);
        Animated.timing(translateY, { toValue: 0, duration: 320, easing: SLIDE_IN, useNativeDriver: true }).start();
      } else {
        const outgoing = full;
        setFull(topFull);
        translateY.setValue(0);
        if (outgoing) {
          setClosing(outgoing);
          closeY.setValue(0);
          Animated.timing(closeY, { toValue: H, duration: 260, easing: SLIDE_OUT, useNativeDriver: true }).start(({ finished }) => finished && setClosing(null));
        }
      }
    } else if (!topFull && full) {
      Animated.timing(translateY, { toValue: H, duration: 260, easing: SLIDE_OUT, useNativeDriver: true }).start(({ finished }) => finished && setFull(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topFull, overlays.length]);

  useEffect(() => {
    if (topSheet && topSheet !== sheet) {
      setSheet(topSheet);
      setSheetVisible(true);
    } else if (!topSheet && sheet) {
      setSheetVisible(false);
      const t = setTimeout(() => setSheet(null), 320);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topSheet]);

  useEffect(() => {
    if (!top) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { closeOverlay(); return true; });
    return () => sub.remove();
  }, [top, closeOverlay]);

  const FullComp = full ? FULL[full.name] : null;
  const ClosingComp = closing ? FULL[closing.name] : null;
  const SheetComp = sheet ? SHEET[sheet.name] : null;

  return (
    <>
      {FullComp && full && (
        <Animated.View style={[styles.full, { transform: [{ translateY }] }]}>
          <FullComp key={full.name} param={full.param} />
        </Animated.View>
      )}
      {ClosingComp && closing && (
        <Animated.View style={[styles.full, styles.closing, { transform: [{ translateY: closeY }] }]}>
          <ClosingComp key={closing.name} param={closing.param} />
        </Animated.View>
      )}
      {SheetComp && sheet && <SheetComp key={sheet.name} param={sheet.param} visible={sheetVisible} />}
    </>
  );
}

const styles = StyleSheet.create({
  full: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  closing: { zIndex: 51 },
});
