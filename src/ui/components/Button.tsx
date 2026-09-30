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

export function Button({ label, onPress, variant = "primary", disabled = false, loading = false }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles[variant], pressed && styles.pressed, isDisabled && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.bone} />
      ) : (
        <Text style={[styles.label, variant === "danger" && styles.labelDanger]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radius[4],
    borderWidth: 1,
    paddingHorizontal: theme.space[16],
  },
  primary: { backgroundColor: theme.colors.blood, borderColor: theme.colors.bloodGlow },
  secondary: { backgroundColor: "transparent", borderColor: theme.colors.iron },
  danger: { backgroundColor: "transparent", borderColor: theme.colors.bloodGlow },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  label: { ...theme.text.bodyStrong, color: theme.colors.bone },
  labelDanger: { color: theme.colors.bloodEmber },
});
