import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";
import { describeTrackingStatus } from "../../features/pedometer/trackingStatus";
import { useTrackingStore } from "../../store/useTrackingStore";
import { Button } from "./Button";

/**
 * Cartouche de papier posé dans la case du jour quand les pas ne sont pas (ou plus entièrement) comptés :
 * la cause, puis ce que le joueur peut faire. Rien quand tout va bien.
 */
export function TrackingNotice() {
  const status = useTrackingStore((tracking) => tracking.status);
  const retry = useTrackingStore((tracking) => tracking.retry);
  const openSettings = useTrackingStore((tracking) => tracking.openSettings);
  const notice = describeTrackingStatus(status);
  if (!notice) return null;

  return (
    <View style={styles.notice} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.head}>
        <Ionicons
          name={notice.blocking ? "alert-circle" : "moon-outline"}
          size={20}
          color={notice.blocking ? theme.colors.red : theme.colors.black}
        />
        <Text style={[styles.title, notice.blocking && styles.titleBlocking]}>{notice.title}</Text>
      </View>
      <Text style={styles.detail}>{notice.detail}</Text>
      {notice.action && notice.actionLabel ? (
        <Button
          label={notice.actionLabel}
          variant="secondary"
          onPress={notice.action === "retry" ? retry : openSettings}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    padding: theme.space[16],
    marginBottom: theme.space[16],
    gap: theme.space[8],
    backgroundColor: theme.colors.paper,
  },
  head: { flexDirection: "row", alignItems: "center", gap: theme.space[8] },
  title: { ...theme.text.bodyStrong, color: theme.colors.black, flex: 1 },
  titleBlocking: { color: theme.colors.red },
  detail: { ...theme.text.small, color: theme.colors.blackSoft },
});
