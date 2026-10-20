import { router, useFocusEffect, useNavigation } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, BackHandler, Keyboard } from "react-native";

export function closeTask() {
  if (router.canGoBack()) router.back();
  else router.replace("/trips");
}

/** Drafts stay mounted across steps/backgrounding. Actual exit explicitly discards them. */
export function useTaskNavigation({ dirty, pending = false, step = 0, previous, exit = closeTask }: {
  dirty: boolean; pending?: boolean; step?: number; previous?: () => void; exit?: () => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [leaving, setLeaving] = useState(false);
  const action = useRef<(() => void) | null>(null);
  const prompting = useRef(false);
  const complete = useCallback((next: () => void) => {
    action.current = next;
    setLeaving(true);
  }, []);
  const requestBack = useCallback((exitAction: () => void = exit) => {
    if (pending || leaving) return;
    if (step > 0 && previous) { previous(); return; }
    if (!dirty) { complete(exitAction); return; }
    if (prompting.current) return;
    prompting.current = true;
    Alert.alert(t("taskFlow.discardTitle"), t("taskFlow.discardDescription"), [
      { text: t("taskFlow.keepEditing"), style: "cancel", onPress: () => { prompting.current = false; } },
      { text: t("taskFlow.discard"), style: "destructive", onPress: () => { prompting.current = false; complete(exitAction); } },
    ], { cancelable: false });
  }, [pending, leaving, step, previous, dirty, complete, exit, t]);
  usePreventRemove(!leaving && (dirty || pending || step > 0), ({ data }) => {
    requestBack(() => navigation.dispatch(data.action));
  });
  // Release the JS and native removal guard before navigating after save/discard.
  useEffect(() => {
    if (!leaving) return;
    const frame = requestAnimationFrame(() => {
      const next = action.current;
      action.current = null;
      next?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [leaving]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (Keyboard.isVisible()) Keyboard.dismiss();
      else requestBack();
      return true;
    });
    return () => subscription.remove();
  }, [requestBack]));
  return { back: () => requestBack(), complete, leaving };
}
