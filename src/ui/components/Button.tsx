import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../../core/theme";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
};

/** Bouton encré : plein noir (principal), cadré (secondaire) ou cadré de rouge (action destructrice). */
export function Button({ label, onPress, variant = "primary", disabled = false, loading = false }: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && (isPrimary ? styles.pressedPrimary : styles.pressedFramed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.colors.paper : theme.colors.black} />
      ) : (
        <Text style={[styles.label, isPrimary && styles.labelPrimary, variant === "danger" && styles.labelDanger]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Hauteur minimale, pas fixe : avec une grande taille de police, le bouton grandit au lieu de couper le texte.
  base: {
    minHeight: 56,
    paddingVertical: theme.space[8],
    paddingHorizontal: theme.space[16],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.frame,
  },
  primary: { backgroundColor: theme.colors.black, borderColor: theme.colors.black },
  secondary: { backgroundColor: theme.colors.paper, borderColor: theme.colors.black },
  danger: { backgroundColor: theme.colors.paper, borderColor: theme.colors.red },
  pressedPrimary: { backgroundColor: theme.colors.blackSoft, borderColor: theme.colors.blackSoft },
  pressedFramed: { backgroundColor: theme.colors.toneLight },
  disabled: { opacity: 0.4 },
  label: { ...theme.text.bodyStrong, color: theme.colors.black, textAlign: "center" },
  labelPrimary: { color: theme.colors.paper },
  labelDanger: { color: theme.colors.red },
});
