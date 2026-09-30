import { colors } from "./colors";
import { radius, space } from "./spacing";
import { fontFamily, text } from "./typography";

export const theme = {
  colors,
  space,
  radius,
  fontFamily,
  text,
} as const;

export type AppTheme = typeof theme;
