import { describe, expect, it } from "vitest";
import { classificationToStatus } from "../services/lifecycleEngine.js";

describe("classificationToStatus", () => {

  it("maps rejection", () => {
    expect(
      classificationToStatus("REJECTION")
    ).toBe("Rejected");
  });

  it("maps interview", () => {
    expect(
      classificationToStatus("INTERVIEW")
    ).toBe("Interview");
  });

  it("maps assessment", () => {
    expect(
      classificationToStatus("ASSESSMENT")
    ).toBe("Assessment");
  });

  it("maps offer", () => {
    expect(
      classificationToStatus("OFFER")
    ).toBe("Offer");
  });

  it("returns null for application", () => {
    expect(
      classificationToStatus("APPLICATION")
    ).toBeNull();
  });

  it("returns null for unknown", () => {
    expect(
      classificationToStatus("UNKNOWN")
    ).toBeNull();
  });

});