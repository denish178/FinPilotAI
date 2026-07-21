import jwt from "jsonwebtoken";
import {
  issueAuthTokens,
  refreshAccessToken,
  revokeUserTokens,
} from "../../src/services/auth.service.js";
import { createTestUser } from "../helpers/testFactory.js";
import ApiError from "../../src/utils/ApiError.js";

describe("Auth Service", () => {
  describe("issueAuthTokens", () => {
    it("should issue valid access and refresh tokens", async () => {
      const user = await createTestUser();
      const tokens = issueAuthTokens(user);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();

      const accessDecoded = jwt.verify(tokens.accessToken, process.env.JWT_SECRET);
      expect(accessDecoded.id).toBe(user._id.toString());
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token with valid refresh token", async () => {
      const user = await createTestUser();
      const { refreshToken } = issueAuthTokens(user);

      const result = await refreshAccessToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should reject missing refresh token", async () => {
      await expect(refreshAccessToken(null)).rejects.toThrow(ApiError);
    });

    it("should reject revoked refresh token", async () => {
      const user = await createTestUser();
      const { refreshToken } = issueAuthTokens(user);

      await revokeUserTokens(user._id);

      await expect(refreshAccessToken(refreshToken)).rejects.toThrow(ApiError);
    });
  });
});
