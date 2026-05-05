import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("Auth routes", () => {
    it("Should fail without token", async () => {
        const res = await request(app).get("/api/auth/me");
        expect(res.status).toBe(401);
    })    
})