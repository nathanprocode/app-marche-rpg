import { colors } from "./colors";
import { radius, space } from "./spacing";
import { fitDisplayText, fontFamily, text } from "./typography";

export const theme = {
  colors,
  space,
  radius,
  fontFamily,
  text,
  fitDisplayText,
} as const;

export type AppTheme = typeof theme;
