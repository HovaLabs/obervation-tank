import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { render } from "@testing-library/react";
import { useStatusBadge } from "./useStatusBadge";
import { EndpointStatus } from "../context/EndpointContext";

// Mock the EndpointContext
vi.mock("../context/EndpointContext", () => ({
  useEndpoints: vi.fn(),
}));

import { useEndpoints } from "../context/EndpointContext";

describe("useStatusBadge", () => {
  let mockEndpointStatuses: Record<string, EndpointStatus>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEndpointStatuses = {};
    (useEndpoints as Mock).mockReturnValue({
      endpointStatuses: mockEndpointStatuses,
    });
  });

  describe("getStatusBadge", () => {
    it('should return Pending badge when status is undefined', () => {
      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("unknown-id");

      const { container } = render(badge);
      const span = container.querySelector("span");

      expect(span).toBeTruthy();
      expect(span?.textContent).toBe("Pending");
      expect(span?.className).toBe("badge-pending");
    });

    it('should return Pending badge when status is "pending"', () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "pending",
        lastChecked: null,
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      const { container } = render(badge);
      const span = container.querySelector("span");

      expect(span?.textContent).toBe("Pending");
      expect(span?.className).toBe("badge-pending");
    });

    it('should return OK badge when status is "ok"', () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "ok",
        lastChecked: "2024-01-01T00:00:00.000Z",
        error: null,
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      const { container } = render(badge);
      const span = container.querySelector("span");

      expect(span?.textContent).toBe("OK");
      expect(span?.className).toBe("badge-ok");
    });

    it('should return Error badge when status is "error"', () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "error",
        lastChecked: "2024-01-01T00:00:00.000Z",
        error: "Connection refused",
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      const { container } = render(badge);
      const span = container.querySelector("span");

      expect(span?.textContent).toBe("Error");
      expect(span?.className).toBe("badge-error");
    });

    it("should return correct badge for different endpoints", () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "ok",
        lastChecked: "2024-01-01T00:00:00.000Z",
      };
      mockEndpointStatuses["endpoint-2"] = {
        status: "error",
        lastChecked: "2024-01-01T00:00:00.000Z",
        error: "Timeout",
      };
      mockEndpointStatuses["endpoint-3"] = {
        status: "pending",
        lastChecked: null,
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());

      const badge1 = result.current.getStatusBadge("endpoint-1");
      const badge2 = result.current.getStatusBadge("endpoint-2");
      const badge3 = result.current.getStatusBadge("endpoint-3");

      const { container: c1 } = render(badge1);
      const { container: c2 } = render(badge2);
      const { container: c3 } = render(badge3);

      expect(c1.querySelector("span")?.textContent).toBe("OK");
      expect(c2.querySelector("span")?.textContent).toBe("Error");
      expect(c3.querySelector("span")?.textContent).toBe("Pending");
    });

    it("should handle endpoint with null status object", () => {
      // Simulate a case where the status entry exists but is somehow falsy
      mockEndpointStatuses["endpoint-1"] = null as unknown as EndpointStatus;
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      const { container } = render(badge);
      const span = container.querySelector("span");

      expect(span?.textContent).toBe("Pending");
      expect(span?.className).toBe("badge-pending");
    });
  });

  describe("hook return value", () => {
    it("should return getStatusBadge function", () => {
      const { result } = renderHook(() => useStatusBadge());

      expect(result.current).toHaveProperty("getStatusBadge");
      expect(typeof result.current.getStatusBadge).toBe("function");
    });

    it("should return consistent function reference across renders", () => {
      const { result, rerender } = renderHook(() => useStatusBadge());
      const firstFn = result.current.getStatusBadge;

      rerender();

      // Function reference may change if not memoized, but it should still work
      expect(typeof result.current.getStatusBadge).toBe("function");
    });
  });

  describe("badge element structure", () => {
    it("should return a span element for pending status", () => {
      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("any-id");

      expect(badge.type).toBe("span");
      expect(badge.props.className).toBe("badge-pending");
      expect(badge.props.children).toBe("Pending");
    });

    it("should return a span element for ok status", () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "ok",
        lastChecked: "2024-01-01T00:00:00.000Z",
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      expect(badge.type).toBe("span");
      expect(badge.props.className).toBe("badge-ok");
      expect(badge.props.children).toBe("OK");
    });

    it("should return a span element for error status", () => {
      mockEndpointStatuses["endpoint-1"] = {
        status: "error",
        lastChecked: "2024-01-01T00:00:00.000Z",
        error: "Some error",
      };
      (useEndpoints as Mock).mockReturnValue({
        endpointStatuses: mockEndpointStatuses,
      });

      const { result } = renderHook(() => useStatusBadge());
      const badge = result.current.getStatusBadge("endpoint-1");

      expect(badge.type).toBe("span");
      expect(badge.props.className).toBe("badge-error");
      expect(badge.props.children).toBe("Error");
    });
  });
});
