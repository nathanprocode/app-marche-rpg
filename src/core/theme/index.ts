import { colors } from "./colors";
import { frame, gutter, space } from "./spacing";
import { fitDisplayText, fontFamily, text } from "./typography";

export const theme = {
  colors,
  space,
  gutter,
  frame,
  fontFamily,
  text,
  fitDisplayText,
} as const;

export type AppTheme = typeof theme;
