import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test_jwt_secret_must_be_at_least_32_chars";
  process.env.JWT_REFRESH_SECRET = "test_refresh_secret_at_least_32_chars";
  process.env.JWT_EXPIRES_IN = "15m";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.CLIENT_URL = "http://localhost:5173";
  process.env.RATE_LIMIT_MAX = "10000";
  process.env.AUTH_RATE_LIMIT_MAX = "10000";

  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();

  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const { collections } = mongoose.connection;
  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});
