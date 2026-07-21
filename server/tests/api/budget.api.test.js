import request from "supertest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/testFactory.js";

describe("Budget API", () => {
  let accessToken;
  const now = new Date();

  beforeEach(async () => {
    const auth = await registerAndLogin(request, app);
    accessToken = auth.accessToken;
  });

  describe("POST /api/budgets", () => {
    it("should create a budget", async () => {
      const res = await request(app)
        .post("/api/budgets")
        .set(authHeader(accessToken))
        .send({
          category: "Food",
          monthlyLimit: 4000,
          month: now.getUTCMonth() + 1,
          year: now.getUTCFullYear(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.category).toBe("Food");
    });
  });

  describe("GET /api/budgets", () => {
    it("should list budgets for the current month", async () => {
      await request(app)
        .post("/api/budgets")
        .set(authHeader(accessToken))
        .send({
          category: "Shopping",
          monthlyLimit: 3000,
          month: now.getUTCMonth() + 1,
          year: now.getUTCFullYear(),
        });

      const res = await request(app)
        .get(`/api/budgets?month=${now.getUTCMonth() + 1}&year=${now.getUTCFullYear()}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.budgets.length).toBeGreaterThanOrEqual(1);
    });
  });
});
