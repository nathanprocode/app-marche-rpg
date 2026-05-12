import { APP_HEADING_FONT_FAMILY } from "../fonts";

export const typography = {
  fontFamily: {
    regular: "System",
    heading: APP_HEADING_FONT_FAMILY,
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
  },
  weight: {
    regular: "400",
    medium: "500",
    bold: "700",
    extraBold: "800",
  },
} as const;
