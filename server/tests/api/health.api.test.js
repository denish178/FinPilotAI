import request from "supertest";
import app from "../../src/app.js";

describe("Health API", () => {
  it("GET /api/health should return 200", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/running/i);
  });

  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/unknown-route");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
