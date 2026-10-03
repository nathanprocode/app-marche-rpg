import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../../core/theme";

type ChoiceRowProps<T extends number | string> = {
  options: readonly { value: T; label: string }[];
  selected: T;
  onSelect: (value: T) => void;
  /** Début de ce que lit TalkBack : « Objectif quotidien, 3 000 pas ». */
  accessibilityPrefix: string;
  disabled?: boolean;
};

/** Rangée de choix exclusifs (un seul sélectionné), du même style que les onglets des Quêtes. */
export function ChoiceRow<T extends number | string>({
  options,
  selected,
  onSelect,
  accessibilityPrefix,
  disabled = false,
}: ChoiceRowProps<T>) {
  return (
    <View accessibilityRole="radiogroup" style={[styles.row, disabled && styles.disabled]}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityLabel={`${accessibilityPrefix}, ${option.label}`}
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onSelect(option.value)}
            style={[styles.choice, isSelected && styles.choiceSelected]}
          >
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    minHeight: 48,
    borderWidth: 1,
    borderColor: theme.colors.ash,
    borderRadius: theme.radius[4],
    overflow: "hidden",
  },
  disabled: { opacity: 0.4 },
  choice: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: theme.space[8] },
  choiceSelected: { backgroundColor: theme.colors.bone },
  label: { ...theme.text.label, fontSize: 14, lineHeight: 20, color: theme.colors.boneDim, textAlign: "center" },
  labelSelected: { color: theme.colors.ink },
});
