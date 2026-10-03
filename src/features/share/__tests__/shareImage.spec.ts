const mockShareMessage = jest.fn();
jest.mock("../share", () => ({ shareMessage: (...args: unknown[]) => mockShareMessage(...args) }));

const mockCaptureRef = jest.fn();
jest.mock("react-native-view-shot", () => ({ __esModule: true, captureRef: (...args: unknown[]) => mockCaptureRef(...args) }));

const mockIsAvailable = jest.fn();
const mockShareAsync = jest.fn();
jest.mock("expo-sharing", () => ({
  __esModule: true,
  isAvailableAsync: () => mockIsAvailable(),
  shareAsync: (...args: unknown[]) => mockShareAsync(...args),
}));

import { shareCardImage, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH } from "../shareImage";

const cardRef = { current: {} } as never;

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  mockIsAvailable.mockResolvedValue(true);
  mockCaptureRef.mockResolvedValue("file:///tmp/card.png");
});

describe("shareCardImage", () => {
  it("photographie la carte en 4:5 et partage l'image", async () => {
    await shareCardImage(cardRef, "texte");

    expect(mockCaptureRef).toHaveBeenCalledWith(cardRef, expect.objectContaining({ format: "png", width: SHARE_IMAGE_WIDTH, height: SHARE_IMAGE_HEIGHT }));
    expect(mockShareAsync).toHaveBeenCalledWith("file:///tmp/card.png", expect.objectContaining({ mimeType: "image/png" }));
    expect(mockShareMessage).not.toHaveBeenCalled();
  });

  it("retombe sur le texte quand le partage d'image n'est pas disponible", async () => {
    mockIsAvailable.mockResolvedValue(false);
    await shareCardImage(cardRef, "texte");
    expect(mockShareMessage).toHaveBeenCalledWith("texte");
  });

  it("retombe sur le texte quand la photo échoue (module natif absent du build)", async () => {
    mockCaptureRef.mockRejectedValue(new Error("native module missing"));
    await shareCardImage(cardRef, "texte");
    expect(mockShareAsync).not.toHaveBeenCalled();
    expect(mockShareMessage).toHaveBeenCalledWith("texte");
  });

  it("retombe sur le texte sans carte à photographier", async () => {
    await shareCardImage({ current: null } as never, "texte");
    expect(mockCaptureRef).not.toHaveBeenCalled();
    expect(mockShareMessage).toHaveBeenCalledWith("texte");
  });
});
