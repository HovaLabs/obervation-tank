import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Endpoint, EndpointStatus } from "../../context/EndpointContext";
import { RGBTuple } from "../../utils/colorUtils";
import { EndpointList } from "./EndpointList";

// Mock the hooks
vi.mock("../../context/EndpointContext", () => ({
  useEndpoints: vi.fn(),
}));

vi.mock("../../hooks/useStatusBadge", () => ({
  useStatusBadge: vi.fn(),
}));

// Mock FishPreview to avoid Three.js/WebGL issues in tests
vi.mock("../Visualization/FishPreview", () => ({
  FishPreview: ({
    color,
    hasError,
  }: {
    color: RGBTuple;
    hasError?: boolean;
  }) => (
    <div
      data-testid="fish-preview"
      data-color={JSON.stringify(color)}
      data-error={hasError}
    >
      Fish Preview
    </div>
  ),
}));

import { useEndpoints } from "../../context/EndpointContext";
import { useStatusBadge } from "../../hooks/useStatusBadge";

interface MockEndpointsContext {
  endpoints: Endpoint[];
  endpointStatuses: Record<string, EndpointStatus>;
  removeEndpoint: Mock;
  removeAllEndpoints: Mock;
  updateEndpoint: Mock;
  pingEndpoint: Mock;
  hslToRgb: Mock;
}

interface MockStatusBadge {
  getStatusBadge: Mock;
}

// Helper to create test endpoints with all required fields
const createTestEndpoint = (
  overrides: Partial<Endpoint> & { id: string; url: string }
): Endpoint => ({
  description: "",
  color: "hsl(120, 80%, 50%)",
  createdAt: "2024-01-01T00:00:00.000Z",
  credentials: null,
  ...overrides,
});

describe("EndpointList", () => {
  let mockEndpointsContext: MockEndpointsContext;
  let mockStatusBadge: MockStatusBadge;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Default mock values
    mockEndpointsContext = {
      endpoints: [],
      endpointStatuses: {},
      removeEndpoint: vi.fn(),
      removeAllEndpoints: vi.fn(),
      updateEndpoint: vi.fn(),
      pingEndpoint: vi.fn(),
      hslToRgb: vi.fn(() => [1, 0.5, 0] as RGBTuple),
    };

    mockStatusBadge = {
      getStatusBadge: vi.fn((id: string) => (
        <span data-testid={`badge-${id}`}>Pending</span>
      )),
    };

    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);
    (useStatusBadge as Mock).mockReturnValue(mockStatusBadge);

    // Mock window.confirm
    vi.spyOn(window, "confirm").mockImplementation(() => true);
  });

  it("renders empty state when no endpoints", () => {
    render(<EndpointList />);

    expect(screen.getByText("Monitored Endpoints (0)")).toBeInTheDocument();
    expect(screen.getByText(/No endpoints configured yet/)).toBeInTheDocument();
  });

  it("does not show search and delete all when no endpoints", () => {
    render(<EndpointList />);

    expect(
      screen.queryByPlaceholderText("Search endpoints...")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Delete All")).not.toBeInTheDocument();
  });

  it("renders endpoint list with correct count", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
      createTestEndpoint({ id: "2", url: "https://api.example.com/status", description: "API 2", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.getByText("Monitored Endpoints (2)")).toBeInTheDocument();
    expect(screen.getByText("API 1")).toBeInTheDocument();
    expect(screen.getByText("API 2")).toBeInTheDocument();
  });

  it("shows search input and delete all button when endpoints exist", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(
      screen.getByPlaceholderText("Search endpoints...")
    ).toBeInTheDocument();
    expect(screen.getByText("Delete All")).toBeInTheDocument();
  });

  it("filters endpoints by URL", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "Health API" }),
      createTestEndpoint({ id: "2", url: "https://api.other.com/status", description: "Status API", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const searchInput = screen.getByPlaceholderText("Search endpoints...");
    fireEvent.change(searchInput, { target: { value: "example" } });

    expect(screen.getByText("Health API")).toBeInTheDocument();
    expect(screen.queryByText("Status API")).not.toBeInTheDocument();
  });

  it("filters endpoints by description", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "Health Check" }),
      createTestEndpoint({ id: "2", url: "https://api.example.com/status", description: "Status Monitor", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const searchInput = screen.getByPlaceholderText("Search endpoints...");
    fireEvent.change(searchInput, { target: { value: "monitor" } });

    expect(screen.queryByText("Health Check")).not.toBeInTheDocument();
    expect(screen.getByText("Status Monitor")).toBeInTheDocument();
  });

  it("shows no results message when search matches nothing", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "Health API" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const searchInput = screen.getByPlaceholderText("Search endpoints...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(
      screen.getByText("No endpoints match your search.")
    ).toBeInTheDocument();
  });

  it("search is case insensitive", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/HEALTH", description: "Health API" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const searchInput = screen.getByPlaceholderText("Search endpoints...");
    fireEvent.change(searchInput, { target: { value: "health" } });

    expect(screen.getByText("Health API")).toBeInTheDocument();
  });

  it("calls removeAllEndpoints when Delete All is confirmed", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByText("Delete All"));

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete all 1 endpoint? This cannot be undone."
    );
    expect(mockEndpointsContext.removeAllEndpoints).toHaveBeenCalled();
  });

  it("does not call removeAllEndpoints when Delete All is cancelled", () => {
    (window.confirm as Mock).mockReturnValue(false);
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByText("Delete All"));

    expect(mockEndpointsContext.removeAllEndpoints).not.toHaveBeenCalled();
  });

  it("uses correct plural form in delete confirmation", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
      createTestEndpoint({ id: "2", url: "https://api.example.com/status", description: "API 2", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByText("Delete All"));

    expect(window.confirm).toHaveBeenCalledWith(
      "Delete all 2 endpoints? This cannot be undone."
    );
  });

  it("calls pingEndpoint when Ping button is clicked", () => {
    const endpoint = createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" });
    mockEndpointsContext.endpoints = [endpoint];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Ping now"));

    expect(mockEndpointsContext.pingEndpoint).toHaveBeenCalledWith(endpoint);
  });

  it("calls removeEndpoint when Remove button is clicked", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Remove endpoint"));

    expect(mockEndpointsContext.removeEndpoint).toHaveBeenCalledWith("1");
  });

  it("enters edit mode when Edit button is clicked", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));

    // Edit mode should show input fields
    expect(
      screen.getByPlaceholderText("https://api.example.com/health")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Description (optional)")
    ).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("populates edit fields with current values", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "My API" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(
      "Description (optional)"
    ) as HTMLInputElement;

    expect(urlInput.value).toBe("https://api.example.com/health");
    expect(descInput.value).toBe("My API");
  });

  it("cancels editing and restores view mode", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));
    fireEvent.click(screen.getByText("Cancel"));

    // Should be back to view mode
    expect(screen.getByTitle("Edit endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("saves edited endpoint with valid URL", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    );
    const descInput = screen.getByPlaceholderText("Description (optional)");

    fireEvent.change(urlInput, {
      target: { value: "https://api.new.com/status" },
    });
    fireEvent.change(descInput, { target: { value: "Updated API" } });
    fireEvent.click(screen.getByText("Save"));

    expect(mockEndpointsContext.updateEndpoint).toHaveBeenCalledWith("1", {
      url: "https://api.new.com/status",
      description: "Updated API",
      color: "hsl(120, 80%, 50%)",
    });
  });

  it("shows error when saving with empty URL", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    );
    fireEvent.change(urlInput, { target: { value: "" } });
    fireEvent.click(screen.getByText("Save"));

    expect(screen.getByText("Please enter a URL")).toBeInTheDocument();
    expect(mockEndpointsContext.updateEndpoint).not.toHaveBeenCalled();
  });

  it("shows error when saving with invalid URL", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    );
    fireEvent.change(urlInput, { target: { value: "not-a-valid-url" } });
    fireEvent.click(screen.getByText("Save"));

    expect(
      screen.getByText(
        "Please enter a valid URL (including http:// or https://)"
      )
    ).toBeInTheDocument();
    expect(mockEndpointsContext.updateEndpoint).not.toHaveBeenCalled();
  });

  it("exits edit mode after successful save", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    fireEvent.click(screen.getByTitle("Edit endpoint"));
    fireEvent.click(screen.getByText("Save"));

    // Should be back to view mode
    expect(screen.getByTitle("Edit endpoint")).toBeInTheDocument();
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  it("renders status badge for each endpoint", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
      createTestEndpoint({ id: "2", url: "https://api.example.com/status", description: "API 2", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(mockStatusBadge.getStatusBadge).toHaveBeenCalledWith("1");
    expect(mockStatusBadge.getStatusBadge).toHaveBeenCalledWith("2");
    expect(screen.getByTestId("badge-1")).toBeInTheDocument();
    expect(screen.getByTestId("badge-2")).toBeInTheDocument();
  });

  it("renders FishPreview for each endpoint", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.getByTestId("fish-preview")).toBeInTheDocument();
    expect(mockEndpointsContext.hslToRgb).toHaveBeenCalled();
  });

  it("displays endpoint URL", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(
      screen.getByText("https://api.example.com/health")
    ).toBeInTheDocument();
  });

  it("displays auth badge when credentials exist", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1", credentials: { type: "basic", username: "user", password: "pass" } }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.getByText("basic")).toBeInTheDocument();
  });

  it("does not display auth badge when credentials type is none", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1", credentials: { type: "none" } }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.queryByText("none")).not.toBeInTheDocument();
  });

  it("displays last checked time when available", () => {
    const lastChecked = new Date().toISOString();
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    mockEndpointsContext.endpointStatuses = {
      "1": { status: "ok", lastChecked, error: null },
    };
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
  });

  it("displays error message when endpoint has error status", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
    ];
    mockEndpointsContext.endpointStatuses = {
      "1": {
        status: "error",
        error: "Connection refused",
        lastChecked: new Date().toISOString(),
      },
    };
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    expect(screen.getByText("Connection refused")).toBeInTheDocument();
  });

  it("only allows editing one endpoint at a time", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
      createTestEndpoint({ id: "2", url: "https://api.example.com/status", description: "API 2", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const editButtons = screen.getAllByTitle("Edit endpoint");
    fireEvent.click(editButtons[0]);

    // First endpoint should be in edit mode
    expect(screen.getByText("Save")).toBeInTheDocument();

    // Second endpoint should still have Edit button
    expect(screen.getByTitle("Edit endpoint")).toBeInTheDocument();
  });

  it("clears search when all text is removed", () => {
    mockEndpointsContext.endpoints = [
      createTestEndpoint({ id: "1", url: "https://api.example.com/health", description: "API 1" }),
      createTestEndpoint({ id: "2", url: "https://api.other.com/status", description: "API 2", color: "hsl(240, 80%, 50%)" }),
    ];
    (useEndpoints as Mock).mockReturnValue(mockEndpointsContext);

    render(<EndpointList />);

    const searchInput = screen.getByPlaceholderText("Search endpoints...");

    // Filter
    fireEvent.change(searchInput, { target: { value: "example" } });
    expect(screen.queryByText("API 2")).not.toBeInTheDocument();

    // Clear filter
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("API 1")).toBeInTheDocument();
    expect(screen.getByText("API 2")).toBeInTheDocument();
  });
});
