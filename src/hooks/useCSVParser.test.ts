import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCSVParser } from "./useCSVParser";

describe("useCSVParser", () => {
  describe("parseCSV", () => {
    it("should return error for empty CSV", () => {
      const { result } = renderHook(() => useCSVParser());
      const parseResult = result.current.parseCSV("");
      expect(parseResult.error).toBe("CSV must have a header row and at least one data row");
    });

    it("should return error for CSV with only header", () => {
      const { result } = renderHook(() => useCSVParser());
      const parseResult = result.current.parseCSV("url,description");
      expect(parseResult.error).toBe("CSV must have a header row and at least one data row");
    });

    it("should return error for missing required url column", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "description,authtype\nMy API,none";
      const parseResult = result.current.parseCSV(csv);
      expect(parseResult.error).toBe("Missing required columns: url");
    });

    it("should parse simple CSV with url only", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "url\nhttps://api.example.com/health";
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.error).toBeUndefined();
      expect(parseResult.endpoints).toHaveLength(1);
      expect(parseResult.endpoints![0]).toEqual({
        url: "https://api.example.com/health",
        description: "",
        credentials: null,
      });
    });

    it("should parse CSV with url and description", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "url,description\nhttps://api.example.com/health,My API";
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(1);
      expect(parseResult.endpoints![0]).toEqual({
        url: "https://api.example.com/health",
        description: "My API",
        credentials: null,
      });
    });

    it("should handle case-insensitive headers", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "URL,DESCRIPTION\nhttps://api.example.com/health,My API";
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(1);
      expect(parseResult.endpoints![0].url).toBe("https://api.example.com/health");
    });

    it("should parse multiple rows", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = `url,description
https://api1.example.com,API 1
https://api2.example.com,API 2
https://api3.example.com,API 3`;
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(3);
      expect(parseResult.endpoints![0].url).toBe("https://api1.example.com");
      expect(parseResult.endpoints![1].url).toBe("https://api2.example.com");
      expect(parseResult.endpoints![2].url).toBe("https://api3.example.com");
    });

    it("should handle quoted values with commas", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = 'url,description\nhttps://api.example.com,"Description, with comma"';
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(1);
      expect(parseResult.endpoints![0].description).toBe("Description, with comma");
    });

    it("should report error for missing URL in row", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "url,description\n,My API";
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(0);
      expect(parseResult.errors).toContain("Row 2: Missing URL");
    });

    it("should report error for invalid URL", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = "url,description\nnot-a-valid-url,My API";
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(0);
      expect(parseResult.errors).toContain('Row 2: Invalid URL "not-a-valid-url"');
    });

    it("should continue parsing after invalid rows", () => {
      const { result } = renderHook(() => useCSVParser());
      const csv = `url,description
invalid-url,Bad API
https://api.example.com,Good API`;
      const parseResult = result.current.parseCSV(csv);

      expect(parseResult.endpoints).toHaveLength(1);
      expect(parseResult.endpoints![0].url).toBe("https://api.example.com");
      expect(parseResult.errors).toHaveLength(1);
    });

    describe("authentication parsing", () => {
      it("should parse basic auth credentials", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,username,password\nhttps://api.example.com,basic,myuser,mypass";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "basic",
          username: "myuser",
          password: "mypass",
        });
      });

      it("should parse bearer token credentials", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,token\nhttps://api.example.com,bearer,my-secret-token";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "bearer",
          token: "my-secret-token",
        });
      });

      it("should parse API key credentials", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,headername,headervalue\nhttps://api.example.com,apikey,X-Custom-Key,secret123";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "apikey",
          headerName: "X-Custom-Key",
          headerValue: "secret123",
        });
      });

      it("should use default header name for API key if not provided", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,headervalue\nhttps://api.example.com,apikey,secret123";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "apikey",
          headerName: "X-API-Key",
          headerValue: "secret123",
        });
      });

      it("should handle auth_type column name (snake_case)", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,auth_type,token\nhttps://api.example.com,bearer,my-token";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "bearer",
          token: "my-token",
        });
      });

      it("should handle header_name and header_value column names (snake_case)", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,header_name,header_value\nhttps://api.example.com,apikey,X-Key,value";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toEqual({
          type: "apikey",
          headerName: "X-Key",
          headerValue: "value",
        });
      });

      it("should default to no credentials when authtype is none", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype\nhttps://api.example.com,none";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toBeNull();
      });

      it("should default to no credentials when authtype is missing", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url\nhttps://api.example.com";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials).toBeNull();
      });

      it("should handle case-insensitive authtype values", () => {
        const { result } = renderHook(() => useCSVParser());
        const csv = "url,authtype,token\nhttps://api.example.com,BEARER,my-token";
        const parseResult = result.current.parseCSV(csv);

        expect(parseResult.endpoints![0].credentials?.type).toBe("bearer");
      });
    });
  });

  describe("handleImportCSV", () => {
    let mockAddEndpoint: Mock;

    beforeEach(() => {
      mockAddEndpoint = vi.fn();
    });

    it("should do nothing if no file is selected", () => {
      const { result } = renderHook(() => useCSVParser());
      const event = {
        target: { files: null, value: "" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      act(() => {
        result.current.handleImportCSV(event, mockAddEndpoint);
      });

      expect(mockAddEndpoint).not.toHaveBeenCalled();
    });

    it("should import endpoints from valid CSV file", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = "url,description\nhttps://api.example.com,My API";
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        // Wait for FileReader to complete
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com",
        "My API",
        null
      );
      expect(result.current.importResult?.success).toBe(true);
      expect(result.current.importResult?.message).toBe("Imported 1 endpoint");
    });

    it("should report success message for multiple endpoints", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = `url,description
https://api1.example.com,API 1
https://api2.example.com,API 2`;
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAddEndpoint).toHaveBeenCalledTimes(2);
      expect(result.current.importResult?.message).toBe("Imported 2 endpoints");
    });

    it("should report errors for invalid CSV structure", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = "description\nMy API"; // Missing url column
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAddEndpoint).not.toHaveBeenCalled();
      expect(result.current.importResult?.success).toBe(false);
      expect(result.current.importResult?.message).toBe("Missing required columns: url");
    });

    it("should report skipped rows with errors", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = `url,description
invalid-url,Bad API
https://api.example.com,Good API`;
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAddEndpoint).toHaveBeenCalledTimes(1);
      expect(result.current.importResult?.message).toContain("Imported 1 endpoint");
      expect(result.current.importResult?.message).toContain("Skipped 1 row(s) with errors");
      expect(result.current.importResult?.errors).toHaveLength(1);
    });

    it("should import endpoints with credentials", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = "url,authtype,token\nhttps://api.example.com,bearer,secret-token";
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com",
        "",
        { type: "bearer", token: "secret-token" }
      );
    });

    it("should reset file input value after import", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = "url\nhttps://api.example.com";
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, mockAddEndpoint);
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(event.target.value).toBe("");
    });
  });

  describe("clearImportResult", () => {
    it("should clear import result", async () => {
      const { result } = renderHook(() => useCSVParser());
      const csvContent = "url\nhttps://api.example.com";
      const file = new File([csvContent], "endpoints.csv", { type: "text/csv" });

      const event = {
        target: { files: [file], value: "endpoints.csv" },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      await act(async () => {
        result.current.handleImportCSV(event, vi.fn());
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.importResult).not.toBeNull();

      act(() => {
        result.current.clearImportResult();
      });

      expect(result.current.importResult).toBeNull();
    });
  });
});
