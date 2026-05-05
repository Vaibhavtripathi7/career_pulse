import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../app.js";

vi.mock("../middlewares/auth.js", () => ({
  default: (req: any, res: any, next: any) => {
    req.user = { id: "test-user" , email: "user_@gmail.com"};
    next();
  },
}));


vi.mock("../db.js", () => ({
  default: {
    application: {
      create: vi.fn().mockResolvedValue({
        id: "1",
        messageId: "1",
        companyName: "Google",
        role: "SDE",
        status: "applied",
        workModel: "remote",
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

describe("Application API", () => {
  it("should create application", async () => {
    const res = await request(app)
      .post("/api/applications")
      .send({ 
        messageId: "1",
        companyName: "Google",
        role: "SDE",
        status: "applied",
        workModel: "remote" });

    expect(res.status).toBe(200);
  });

  it("should fetch applications", async () => {
    const res = await request(app).get("/api/applications");

    expect(res.status).toBe(200);
  });
});