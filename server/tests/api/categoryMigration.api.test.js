import request from "supertest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/testFactory.js";

describe("POST /api/transactions/migrate-categories", () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await registerAndLogin(request, app);
    accessToken = auth.accessToken;
  });

  it("renames legacy transaction and budget categories", async () => {
    await request(app)
      .post("/api/transactions")
      .set(authHeader(accessToken))
      .send({
        type: "expense",
        amount: 100,
        category: "Food",
        description: "Lunch",
      });

    const now = new Date();
    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    await request(app)
      .post("/api/budgets")
      .set(authHeader(accessToken))
      .send({
        category: "Bills",
        monthlyLimit: 500,
        month,
        year,
      });

    const res = await request(app)
      .post("/api/transactions/migrate-categories")
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.transactionsUpdated).toBe(1);
    expect(res.body.data.budgetsUpdated).toBe(1);

    const list = await request(app)
      .get("/api/transactions")
      .set(authHeader(accessToken));

    expect(list.body.data.transactions[0].category).toBe("Food & Dining");

    const budgets = await request(app)
      .get(`/api/budgets?month=${month}&year=${year}`)
      .set(authHeader(accessToken));

    expect(budgets.body.data.budgets[0].category).toBe("Bills & Utilities");
  });

  it("is idempotent when no legacy labels remain", async () => {
    const res = await request(app)
      .post("/api/transactions/migrate-categories")
      .set(authHeader(accessToken));

    expect(res.status).toBe(200);
    expect(res.body.data.transactionsUpdated).toBe(0);
    expect(res.body.data.budgetsUpdated).toBe(0);
  });
});
