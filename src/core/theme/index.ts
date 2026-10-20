import { colors } from "./colors";
import { frame, gutter, radius, space } from "./spacing";
import { fitDisplayText, fontFamily, text } from "./typography";

export const theme = {
  colors,
  space,
  gutter,
  frame,
  radius,
  fontFamily,
  text,
  fitDisplayText,
} as const;

export type AppTheme = typeof theme;
