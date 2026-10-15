import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "crypto";
import { decryptToken, encryptToken } from "../utils/crypto.js";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("hex");
});

describe("token encryption", () => {

  it("round trips a token", () => {
    const encrypted = encryptToken("1//refresh-token");
    expect(encrypted).not.toContain("refresh-token");
    expect(decryptToken(encrypted)).toBe("1//refresh-token");
  });

  it("uses a new iv every time", () => {
    expect(encryptToken("same")).not.toBe(encryptToken("same"));
  });

  it("rejects tampered ciphertext", () => {
    const [version, iv, tag, data] = encryptToken("token").split(":");
    const flipped = Buffer.from(data!, "base64");
    flipped[0]! ^= 1;
    const tampered = [version, iv, tag, flipped.toString("base64")].join(":");
    expect(() => decryptToken(tampered)).toThrow();
  });

  it("passes through tokens stored before encryption", () => {
    expect(decryptToken("ya29.old-plaintext")).toBe("ya29.old-plaintext");
  });

  it("keeps null as null", () => {
    expect(encryptToken(null)).toBeNull();
    expect(decryptToken(null)).toBeNull();
  });

});
