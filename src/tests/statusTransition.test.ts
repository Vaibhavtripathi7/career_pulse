import { describe, expect, it } from "vitest";
import { canTransition } from "../services/statusTransition.js";

describe("canTransition", () => {

  it("allows applied to interview", () => {
    expect(
      canTransition(
        "Applied",
        "Interview"
      )
    ).toBe(true);
  });

  it("allows applied to rejected", () => {
    expect(
      canTransition(
        "Applied",
        "Rejected"
      )
    ).toBe(true);
  });

  it("allows interview to offer", () => {
    expect(
      canTransition(
        "Interview",
        "Offer"
      )
    ).toBe(true);
  });

  it("blocks rejected to interview", () => {
    expect(
      canTransition(
        "Rejected",
        "Interview"
      )
    ).toBe(false);
  });

  it("blocks offer to assessment", () => {
    expect(
      canTransition(
        "Offer",
        "Assessment"
      )
    ).toBe(false);
  });

});