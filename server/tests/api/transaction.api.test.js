import request from "supertest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/testFactory.js";

describe("Transaction API", () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await registerAndLogin(request, app);
    accessToken = auth.accessToken;
  });

  describe("POST /api/transactions", () => {
    it("should create a transaction", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set(authHeader(accessToken))
        .send({
          type: "expense",
          amount: 150,
          category: "Food",
          description: "Groceries",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.transaction.amount).toBe(150);
    });

    it("should reject invalid payload", async () => {
      const res = await request(app)
        .post("/api/transactions")
        .set(authHeader(accessToken))
        .send({ type: "expense", amount: -10, category: "Food" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/transactions", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/transactions")
        .set(authHeader(accessToken))
        .send({ type: "expense", amount: 100, category: "Food" });
    });

    it("should list transactions with pagination", async () => {
      const res = await request(app)
        .get("/api/transactions?page=1&limit=10&type=expense")
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.transactions.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe("PUT /api/transactions/:id", () => {
    it("should update a transaction", async () => {
      const created = await request(app)
        .post("/api/transactions")
        .set(authHeader(accessToken))
        .send({ type: "expense", amount: 200, category: "Bills" });

      const id = created.body.data.transaction._id;

      const res = await request(app)
        .put(`/api/transactions/${id}`)
        .set(authHeader(accessToken))
        .send({ amount: 250, description: "Updated bill" });

      expect(res.status).toBe(200);
      expect(res.body.data.transaction.amount).toBe(250);
    });
  });

  describe("POST /api/transactions/import", () => {
    it("should bulk import transactions", async () => {
      const res = await request(app)
        .post("/api/transactions/import")
        .set(authHeader(accessToken))
        .send({
          transactions: [
            {
              type: "expense",
              amount: 50,
              category: "Food",
              description: "Import test",
              date: new Date().toISOString(),
              paymentMethod: "upi",
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.createdCount).toBe(1);
    });
  });

  describe("DELETE /api/transactions/:id", () => {
    it("should soft delete a transaction", async () => {
      const created = await request(app)
        .post("/api/transactions")
        .set(authHeader(accessToken))
        .send({ type: "expense", amount: 75, category: "Transport" });

      const id = created.body.data.transaction._id;

      const res = await request(app)
        .delete(`/api/transactions/${id}`)
        .set(authHeader(accessToken));

      expect(res.status).toBe(200);

      const list = await request(app)
        .get("/api/transactions")
        .set(authHeader(accessToken));

      expect(list.body.data.transactions).toHaveLength(0);
    });
  });
});
