jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("../../features/social/service", () => ({
  createBand: jest.fn(() => Promise.resolve(true)),
  bandExists: jest.fn(() => Promise.resolve(true)),
  publishMember: jest.fn(() => Promise.resolve()),
  leaveBand: jest.fn(() => Promise.resolve()),
  subscribeMembers: jest.fn(() => jest.fn()),
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as service from "../../features/social/service";
import { useSocialStore } from "../useSocialStore";

const me = () => ({ uid: "u1", displayName: "Guts", lap: 1, totalDistanceKm: 12, streakDays: 2 });
const mocked = service as jest.Mocked<typeof service>;

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  useSocialStore.getState().stop();
  await useSocialStore.getState().start("u1", me);
});

describe("useSocialStore", () => {
  it("ne publie rien tant qu'on n'est dans aucune bande", async () => {
    await useSocialStore.getState().publish(me());
    expect(mocked.publishMember).not.toHaveBeenCalled();
  });

  it("crée une bande, s'y inscrit et suit ses membres", async () => {
    await useSocialStore.getState().createBand();
    const { code } = useSocialStore.getState();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
    expect(mocked.createBand).toHaveBeenCalledWith(code, "u1");
    expect(mocked.publishMember).toHaveBeenCalledWith(code, expect.objectContaining({ uid: "u1", displayName: "Guts" }));
    expect(mocked.subscribeMembers).toHaveBeenCalledWith(code, expect.any(Function), expect.any(Function));
    expect(await AsyncStorage.getItem("marche-du-faucon:band:u1")).toBe(code);
  });

  it("rejoint une bande avec un code saisi à la main", async () => {
    await useSocialStore.getState().joinBand("faucon-k7m2qx");
    expect(useSocialStore.getState().code).toBe("K7M2QX");
    expect(mocked.publishMember).toHaveBeenCalledWith("K7M2QX", expect.objectContaining({ uid: "u1" }));
  });

  it("refuse un code invalide ou une bande inconnue", async () => {
    await useSocialStore.getState().joinBand("nope");
    expect(useSocialStore.getState()).toMatchObject({ code: null, error: "invalid-code" });

    mocked.bandExists.mockResolvedValueOnce(false);
    await useSocialStore.getState().joinBand("K7M2QX");
    expect(useSocialStore.getState()).toMatchObject({ code: null, error: "unknown-band" });
    expect(mocked.publishMember).not.toHaveBeenCalled();
  });

  it("signale un problème réseau sans entrer dans la bande", async () => {
    mocked.bandExists.mockRejectedValueOnce(new Error("offline"));
    await useSocialStore.getState().joinBand("K7M2QX");
    expect(useSocialStore.getState()).toMatchObject({ code: null, error: "network", isBusy: false });
  });

  it("publie ta position une fois dans une bande, et la retrouve au redémarrage", async () => {
    await useSocialStore.getState().joinBand("K7M2QX");
    mocked.publishMember.mockClear();
    await useSocialStore.getState().publish(me());
    expect(mocked.publishMember).toHaveBeenCalledTimes(1);

    useSocialStore.getState().stop();
    await useSocialStore.getState().start("u1", me);
    expect(useSocialStore.getState().code).toBe("K7M2QX");
  });

  it("quitte la bande : ta ligne disparaît et le code est oublié", async () => {
    await useSocialStore.getState().joinBand("K7M2QX");
    await useSocialStore.getState().leaveBand();
    expect(mocked.leaveBand).toHaveBeenCalledWith("K7M2QX", "u1");
    expect(useSocialStore.getState().code).toBeNull();
    expect(await AsyncStorage.getItem("marche-du-faucon:band:u1")).toBeNull();
  });
});
