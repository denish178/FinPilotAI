import request from "supertest";
import app from "../../src/app.js";

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const credentials = {
        name: "Auth API User",
        email: `auth_api_${Date.now()}@test.com`,
        password: "Password123!",
      };

      const res = await request(app).post("/api/auth/register").send(credentials);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(credentials.email);
    });

    it("should reject duplicate email", async () => {
      const credentials = {
        name: "Duplicate User",
        email: `dup_${Date.now()}@test.com`,
        password: "Password123!",
      };

      await request(app).post("/api/auth/register").send(credentials);

      const res = await request(app).post("/api/auth/register").send(credentials);

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const credentials = {
        name: "Login User",
        email: `login_${Date.now()}@test.com`,
        password: "Password123!",
      };

      await request(app).post("/api/auth/register").send(credentials);

      const res = await request(app).post("/api/auth/login").send({
        email: credentials.email,
        password: credentials.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject invalid password", async () => {
      const credentials = {
        name: "Bad Login User",
        email: `badlogin_${Date.now()}@test.com`,
        password: "Password123!",
      };

      await request(app).post("/api/auth/register").send(credentials);

      const res = await request(app).post("/api/auth/login").send({
        email: credentials.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh-token", () => {
    it("should refresh access token with cookie", async () => {
      const credentials = {
        name: "Refresh User",
        email: `refresh_${Date.now()}@test.com`,
        password: "Password123!",
      };

      await request(app).post("/api/auth/register").send(credentials);

      const agent = request.agent(app);
      await agent.post("/api/auth/login").send({
        email: credentials.email,
        password: credentials.password,
      });

      const res = await agent.post("/api/auth/refresh-token");

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe("GET /api/auth/me", () => {
    it("should reject unauthenticated requests", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });
});
