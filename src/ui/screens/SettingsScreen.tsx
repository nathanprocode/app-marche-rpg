import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { DAILY_GOAL_OPTIONS } from "../../core/constants/game";
import { formatInt } from "../../core/format";
import { theme } from "../../core/theme";
import { vibrate } from "../../features/haptics/haptics";
import { REMINDER_HOUR_OPTIONS } from "../../features/reminders/eveningReminder";
import { requestReminderPermission } from "../../features/reminders/reminderScheduler";
import { eraseAllProgress } from "../../features/runtime/eraseProgress";
import { useAuthStore } from "../../store/useAuthStore";
import { flushCloudSave, usePlayerStore } from "../../store/usePlayerStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Button } from "../components/Button";
import { ChoiceRow } from "../components/ChoiceRow";
import { Panel } from "../components/Panel";
import { Screen } from "../components/Screen";

/** Interrupteur Material, encré : piste noire quand il est activé. */
const SWITCH_COLORS = {
  thumbColor: theme.colors.paper,
  trackColor: { false: theme.colors.tone, true: theme.colors.black },
} as const;

/** Réglages, ouverts depuis l'engrenage du Profil : objectif, rappels, suivi, compte et remise à zéro. */
export function SettingsScreen() {
  const router = useRouter();
  const isPermanentTrackingEnabled = usePlayerStore((state) => state.isPermanentTrackingEnabled);
  const setPermanentTrackingEnabled = usePlayerStore((state) => state.setPermanentTrackingEnabled);
  const logout = useAuthStore((state) => state.logout);
  const dailyGoal = useSettingsStore((state) => state.dailyGoal);
  const setDailyGoal = useSettingsStore((state) => state.setDailyGoal);
  const reminderEnabled = useSettingsStore((state) => state.eveningReminderEnabled);
  const reminderHour = useSettingsStore((state) => state.eveningReminderHour);
  const setReminderEnabled = useSettingsStore((state) => state.setEveningReminderEnabled);
  const setReminderHour = useSettingsStore((state) => state.setEveningReminderHour);
  const hapticsEnabled = useSettingsStore((state) => state.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((state) => state.setHapticsEnabled);
  const [reminderDenied, setReminderDenied] = useState(false);

  async function handleReminderToggle(enabled: boolean): Promise<void> {
    if (enabled && !(await requestReminderPermission())) {
      setReminderDenied(true);
      return;
    }
    setReminderDenied(false);
    setReminderEnabled(enabled);
  }

  function confirmErase(): void {
    Alert.alert(
      "Recommencer à zéro ?",
      "Ta progression, ta série, tes succès, tes chroniques et ton historique seront effacés, sur ce téléphone et dans le cloud. Tes réglages sont conservés. Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Tout effacer", style: "destructive", onPress: () => void eraseAllProgress() },
      ],
    );
  }

  return (
    <Screen scroll variant="page">
      <Panel reversed style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour au profil"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.paper} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Réglages
        </Text>
      </Panel>

      <Panel>
        <View style={styles.settingBlock}>
          <Text style={styles.settingTitle}>Objectif quotidien</Text>
          <Text style={styles.small}>Les pas à faire chaque jour pour apaiser la Marque et garder ta série.</Text>
          <ChoiceRow
            options={DAILY_GOAL_OPTIONS.map((steps) => ({ value: steps, label: formatInt(steps) }))}
            selected={dailyGoal}
            onSelect={setDailyGoal}
            accessibilityPrefix="Objectif quotidien en pas"
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Rappel du soir</Text>
            <Text style={[styles.small, reminderDenied && styles.warning]}>
              {reminderDenied
                ? "Notifications refusées : autorise-les dans les réglages du téléphone."
                : "Une notification si tu n'as pas atteint ton objectif."}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Rappel du soir"
            value={reminderEnabled}
            onValueChange={(enabled) => void handleReminderToggle(enabled)}
            {...SWITCH_COLORS}
          />
        </View>
        {reminderEnabled ? (
          <View style={styles.settingBlockNoRule}>
            <ChoiceRow
              options={REMINDER_HOUR_OPTIONS.map((hour) => ({ value: hour, label: `${hour} h` }))}
              selected={reminderHour}
              onSelect={setReminderHour}
              accessibilityPrefix="Heure du rappel"
            />
          </View>
        ) : null}
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Vibrations</Text>
            <Text style={styles.small}>Une vibration brève à chaque point franchi, succès ou objectif du jour atteint.</Text>
          </View>
          <Switch
            accessibilityLabel="Vibrations"
            value={hapticsEnabled}
            onValueChange={(enabled) => {
              setHapticsEnabled(enabled);
              // On sent tout de suite ce que fait l'option.
              if (enabled) vibrate("achievement");
            }}
            {...SWITCH_COLORS}
          />
        </View>
        <View style={styles.settingRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Suivi permanent</Text>
            <Text style={styles.small}>Garde le décompte des pas en arrière-plan grâce à une notification permanente.</Text>
          </View>
          <Switch
            accessibilityLabel="Suivi permanent"
            value={isPermanentTrackingEnabled}
            onValueChange={setPermanentTrackingEnabled}
            {...SWITCH_COLORS}
          />
        </View>
      </Panel>

      <Panel style={styles.section}>
        <View style={styles.accountRow}>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>Compte Google</Text>
            <Text style={styles.small}>Ta progression est sauvegardée dans le cloud.</Text>
          </View>
          <Text style={styles.connected}>Connecté</Text>
        </View>
        <Button
          label="Se déconnecter"
          variant="danger"
          onPress={() => {
            // La sauvegarde cloud en attente part avant la déconnexion (le local, lui, est déjà à jour).
            flushCloudSave();
            void logout();
          }}
        />
      </Panel>

      <Panel reversed style={styles.section}>
        <Text style={styles.smallOnBlack}>Efface ta progression, tes succès et ton historique, ici et dans le cloud.</Text>
        <Button label="Recommencer à zéro" variant="danger" onDark onPress={confirmErase} />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
    borderColor: theme.colors.paper,
  },
  backButtonPressed: { backgroundColor: theme.colors.blackSoft },
  title: { ...theme.text.displayL, color: theme.colors.paper, flex: 1 },
  section: { gap: theme.space[16] },
  small: { ...theme.text.small, color: theme.colors.blackSoft },
  smallOnBlack: { ...theme.text.small, color: theme.colors.paperSoft },
  warning: { color: theme.colors.red },
  settingBlock: { gap: theme.space[8], paddingBottom: theme.space[16] },
  settingBlockNoRule: { paddingBottom: theme.space[16] },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space[16],
    paddingVertical: theme.space[16],
    borderTopWidth: 1,
    borderTopColor: theme.colors.black,
  },
  accountRow: { flexDirection: "row", alignItems: "center", gap: theme.space[16] },
  settingText: { flex: 1, gap: 2 },
  settingTitle: { ...theme.text.bodyStrong, color: theme.colors.black },
  connected: { ...theme.text.bodyStrong, color: theme.colors.black },
});
