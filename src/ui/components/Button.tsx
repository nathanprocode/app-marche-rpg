import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../../core/theme";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Bouton posé sur du noir (case inversée, écran d'événement) : les couleurs s'inversent. */
  onDark?: boolean;
};

/** Bouton encré : plein (principal), cadré (secondaire) ou cadré de rouge (action destructrice). */
export function Button({ label, onPress, variant = "primary", disabled = false, loading = false, onDark = false }: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === "primary";
  const tone = onDark ? dark : light;
  const isFilled = isPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        tone[variant],
        pressed && (isFilled ? tone.pressedFilled : tone.pressedFramed),
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={(isFilled ? tone.labelFilled : tone.label).color} />
      ) : (
        <Text style={[styles.label, tone.label, isFilled && tone.labelFilled, variant === "danger" && tone.labelDanger]}>
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
  disabled: { opacity: 0.4 },
  label: { ...theme.text.bodyStrong, textAlign: "center" },
});

/** Sur papier : principal noir plein, secondaire cadré de noir. */
const light = StyleSheet.create({
  primary: { backgroundColor: theme.colors.black, borderColor: theme.colors.black },
  secondary: { backgroundColor: theme.colors.paper, borderColor: theme.colors.black },
  danger: { backgroundColor: theme.colors.paper, borderColor: theme.colors.red },
  pressedFilled: { backgroundColor: theme.colors.blackSoft, borderColor: theme.colors.blackSoft },
  pressedFramed: { backgroundColor: theme.colors.toneLight },
  label: { color: theme.colors.black },
  labelFilled: { color: theme.colors.paper },
  labelDanger: { color: theme.colors.red },
});

/** Sur noir : principal papier plein, secondaire cadré de papier. */
const dark = StyleSheet.create({
  primary: { backgroundColor: theme.colors.paper, borderColor: theme.colors.paper },
  secondary: { backgroundColor: theme.colors.black, borderColor: theme.colors.paper },
  danger: { backgroundColor: theme.colors.black, borderColor: theme.colors.redOnBlack },
  pressedFilled: { backgroundColor: theme.colors.toneLight, borderColor: theme.colors.toneLight },
  pressedFramed: { backgroundColor: theme.colors.toneDark },
  label: { color: theme.colors.paper },
  labelFilled: { color: theme.colors.black },
  labelDanger: { color: theme.colors.redOnBlack },
});
