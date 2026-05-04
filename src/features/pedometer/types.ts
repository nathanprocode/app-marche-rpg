export type PedometerPermissionStatus = "granted" | "denied" | "undetermined";

export type PedometerSnapshot = {
  stepsToday: number;
  updatedAtISO: string;
  source: "sensor" | "simulator";
};
