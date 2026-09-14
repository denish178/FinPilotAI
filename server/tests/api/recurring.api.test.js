import request from "supertest";
import app from "../../src/app.js";
import { registerAndLogin, authHeader } from "../helpers/testFactory.js";

describe("Recurring API", () => {
  let accessToken;

  beforeEach(async () => {
    const auth = await registerAndLogin(request, app);
    accessToken = auth.accessToken;
  });

  it("updates a recurring schedule", async () => {
    const createRes = await request(app)
      .post("/api/recurring")
      .set(authHeader(accessToken))
      .send({
        type: "expense",
        amount: 500,
        category: "Rent",
        description: "Flat rent",
        frequency: "monthly",
        startDate: new Date().toISOString(),
        paymentMethod: "bank_transfer",
      });

    expect(createRes.status).toBe(201);
    const id = createRes.body.data._id;

    const updateRes = await request(app)
      .put(`/api/recurring/${id}`)
      .set(authHeader(accessToken))
      .send({
        amount: 550,
        description: "Flat rent (updated)",
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.amount).toBe(550);
    expect(updateRes.body.data.description).toBe("Flat rent (updated)");
  });
});
