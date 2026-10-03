import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { shareCardImage } from "../../features/share/shareImage";
import { useShareStore } from "../../store/useShareStore";
import { ShareCard } from "./ShareCard";

/** Si l'illustration tarde à charger, on photographie quand même au bout de ce délai. */
const READY_TIMEOUT_MS = 2000;
/** Laisse le temps au dernier rendu d'être dessiné avant de photographier. */
const PAINT_DELAY_MS = 150;

/**
 * Monté une fois à la racine : quand une carte est demandée, la dessine hors écran,
 * la photographie, ouvre la feuille de partage, puis la retire.
 */
export function ShareImageHost() {
  const request = useShareStore((state) => state.request);
  const clearShare = useShareStore((state) => state.clearShare);
  const cardRef = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const isSharingRef = useRef(false);

  const handleReady = useCallback(() => setReady(true), []);

  // Une nouvelle demande repart d'une carte pas encore prête.
  useEffect(() => {
    setReady(false);
  }, [request]);

  useEffect(() => {
    if (!request) return;
    const timeout = setTimeout(() => setReady(true), READY_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, [request]);

  useEffect(() => {
    if (!request || !ready || isSharingRef.current) return;

    const timer = setTimeout(async () => {
      isSharingRef.current = true;
      try {
        await shareCardImage(cardRef, request.text);
      } finally {
        isSharingRef.current = false;
        clearShare();
      }
    }, PAINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [request, ready, clearShare]);

  if (!request) return null;

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={styles.offscreen}
      testID="share-card-host"
    >
      <ShareCard ref={cardRef} card={request} onReady={handleReady} />
    </View>
  );
}

const styles = StyleSheet.create({
  offscreen: { position: "absolute", top: 0, left: -5000 },
});
