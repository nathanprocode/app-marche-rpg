export type BrandState = "idle" | "active" | "bleeding";

export type BrandVisualState = {
  state: BrandState;
  intensity: number;
};

export type BrandStatus = {
  streakDays: number;
  sedentaryDays: number;
  lastActiveDateISO: string;
  visual: BrandVisualState;
};
