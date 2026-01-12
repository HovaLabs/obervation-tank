import { describe, it, expect } from "vitest";
import { addEndpointAction, FormState } from "./formUtils";

// Helper to create FormData from object
function createFormData(data: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.set(key, value);
  }
  return formData;
}

describe("addEndpointAction", () => {
  const initialState: FormState = { error: null, success: false };

  describe("URL validation", () => {
    it("should return error when URL is empty", async () => {
      const formData = createFormData({ url: "", description: "" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please enter a URL");
    });

    it("should return error when URL is only whitespace", async () => {
      const formData = createFormData({ url: "   ", description: "" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please enter a URL");
    });

    it("should return error when URL is missing from FormData", async () => {
      const formData = new FormData();
      formData.set("description", "My API");
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please enter a URL");
    });

    it("should return error for invalid URL format", async () => {
      const formData = createFormData({ url: "not-a-valid-url" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please enter a valid URL (including http:// or https://)");
    });

    it("should return error for URL without protocol", async () => {
      const formData = createFormData({ url: "api.example.com/health" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Please enter a valid URL (including http:// or https://)");
    });

    it("should accept valid HTTP URL", async () => {
      const formData = createFormData({ url: "http://api.example.com/health" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should accept valid HTTPS URL", async () => {
      const formData = createFormData({ url: "https://api.example.com/health" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });

    it("should trim whitespace from URL", async () => {
      const formData = createFormData({ url: "  https://api.example.com/health  " });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe("https://api.example.com/health");
    });
  });

  describe("description handling", () => {
    it("should include description in result data", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        description: "My API",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.description).toBe("My API");
    });

    it("should trim whitespace from description", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        description: "  My API  ",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.description).toBe("My API");
    });

    it("should default to empty string when description is missing", async () => {
      const formData = createFormData({ url: "https://api.example.com" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.description).toBe("");
    });
  });

  describe("no authentication", () => {
    it("should return null credentials when authType is none", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "none",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.credentials).toBeNull();
    });

    it("should default to no credentials when authType is missing", async () => {
      const formData = createFormData({ url: "https://api.example.com" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toBeNull();
    });
  });

  describe("basic authentication", () => {
    it("should include username and password for basic auth", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "basic",
        username: "myuser",
        password: "mypass",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.credentials).toEqual({
        type: "basic",
        username: "myuser",
        password: "mypass",
      });
    });

    it("should default to empty strings for missing username/password", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "basic",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "basic",
        username: "",
        password: "",
      });
    });

    it("should handle only username provided", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "basic",
        username: "myuser",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "basic",
        username: "myuser",
        password: "",
      });
    });

    it("should handle only password provided", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "basic",
        password: "mypass",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "basic",
        username: "",
        password: "mypass",
      });
    });
  });

  describe("bearer token authentication", () => {
    it("should include token for bearer auth", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "bearer",
        bearerToken: "my-secret-token",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.credentials).toEqual({
        type: "bearer",
        token: "my-secret-token",
      });
    });

    it("should default to empty string for missing token", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "bearer",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "bearer",
        token: "",
      });
    });
  });

  describe("API key authentication", () => {
    it("should include headerName and headerValue for apikey auth", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "apikey",
        apiKeyName: "X-Custom-Key",
        apiKeyValue: "secret123",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.credentials).toEqual({
        type: "apikey",
        headerName: "X-Custom-Key",
        headerValue: "secret123",
      });
    });

    it("should default headerName to X-API-Key when not provided", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "apikey",
        apiKeyValue: "secret123",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "apikey",
        headerName: "X-API-Key",
        headerValue: "secret123",
      });
    });

    it("should default headerValue to empty string when not provided", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "apikey",
        apiKeyName: "X-Custom-Key",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "apikey",
        headerName: "X-Custom-Key",
        headerValue: "",
      });
    });

    it("should use defaults when both apiKeyName and apiKeyValue are missing", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "apikey",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "apikey",
        headerName: "X-API-Key",
        headerValue: "",
      });
    });
  });

  describe("result structure", () => {
    it("should return complete success result with all fields", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        description: "Test API",
        authType: "bearer",
        bearerToken: "token123",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result).toEqual({
        success: true,
        error: null,
        data: {
          url: "https://api.example.com",
          description: "Test API",
          credentials: {
            type: "bearer",
            token: "token123",
          },
        },
      });
    });

    it("should return error result without data field", async () => {
      const formData = createFormData({ url: "" });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.data).toBeUndefined();
    });

    it("should not modify previous state", async () => {
      const prevState: FormState = {
        error: "Previous error",
        success: true,
        data: { url: "old-url", description: "old", credentials: null },
      };
      const formData = createFormData({ url: "https://api.example.com" });
      const result = await addEndpointAction(prevState, formData);

      // Previous state should be unchanged
      expect(prevState.error).toBe("Previous error");
      expect(prevState.success).toBe(true);

      // New state should be independent
      expect(result.success).toBe(true);
      expect(result.error).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle URL with query parameters", async () => {
      const formData = createFormData({
        url: "https://api.example.com/health?check=true&verbose=1",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe("https://api.example.com/health?check=true&verbose=1");
    });

    it("should handle URL with port number", async () => {
      const formData = createFormData({
        url: "https://api.example.com:8080/health",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe("https://api.example.com:8080/health");
    });

    it("should handle localhost URL", async () => {
      const formData = createFormData({
        url: "http://localhost:3000/api",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe("http://localhost:3000/api");
    });

    it("should handle IP address URL", async () => {
      const formData = createFormData({
        url: "http://192.168.1.1:8080/status",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.success).toBe(true);
      expect(result.data?.url).toBe("http://192.168.1.1:8080/status");
    });

    it("should handle special characters in description", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        description: "API for <Company> & Partners™",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.description).toBe("API for <Company> & Partners™");
    });

    it("should handle unicode in credentials", async () => {
      const formData = createFormData({
        url: "https://api.example.com",
        authType: "basic",
        username: "用户",
        password: "密码",
      });
      const result = await addEndpointAction(initialState, formData);

      expect(result.data?.credentials).toEqual({
        type: "basic",
        username: "用户",
        password: "密码",
      });
    });
  });
});
