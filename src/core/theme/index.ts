import { colors } from "./colors";
import { typography } from "./typography";

export const theme = {
  colors,
  typography,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,
  },
} as const;

export type AppTheme = typeof theme;
