export const colors = {
  bg: {
    primary: "#0B0B0D",
    secondary: "#15171B",
  },
  metal: "#5E6472",
  blood: {
    base: "#8A0303",
    glow: "#C1121F",
  },
  text: {
    primary: "#E5E7EB",
    muted: "#9CA3AF",
  },
} as const;

export type AppColors = typeof colors;
