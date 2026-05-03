export type BrandState = "idle" | "active" | "bleeding";

export type BrandVisualState = {
  state: BrandState;
  intensity: number;
};
