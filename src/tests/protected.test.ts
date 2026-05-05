import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app.js";

vi.mock("../middlewares/auth.js", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { id: "test-user", email: "user_@gmail.com" };
    next();
  },
}));
vi.mock("../db.js", () => ({
  default: {
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: "test-user",
        email: "test@test.com"
      }),
    },
  },
}));

describe("Protected routes", () => {
  it("should allow access with mocked auth", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
  });
});