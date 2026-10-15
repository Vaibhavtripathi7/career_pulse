import { describe, expect, it } from "vitest";
import { classificationToStatus, toApplicationStatus } from "../services/lifecycleEngine.js";

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

describe("toApplicationStatus", () => {

  it("maps manual lowercase statuses", () => {
    expect(toApplicationStatus("applied")).toBe("Applied");
    expect(toApplicationStatus("interviewing")).toBe("Interview");
    expect(toApplicationStatus("offer")).toBe("Offer");
    expect(toApplicationStatus("rejected")).toBe("Rejected");
  });

  it("keeps engine statuses", () => {
    expect(toApplicationStatus("Assessment")).toBe("Assessment");
    expect(toApplicationStatus("Interview")).toBe("Interview");
  });

  it("returns null for unknown", () => {
    expect(toApplicationStatus("ghosted")).toBeNull();
  });

});
