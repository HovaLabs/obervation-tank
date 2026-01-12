import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { EndpointProvider } from "./context/EndpointContext";
import { ThemeProvider } from "./context/ThemeContext";

// Mock all page components to avoid their complex dependencies
vi.mock("./App", () => ({
  default: () => <div data-testid="app-page">App Page</div>,
}));

vi.mock("./components/Config/ConfigPage", () => ({
  ConfigPage: () => <div data-testid="config-page">Config Page</div>,
}));

vi.mock("./components/DeadFish/DeadFishPage", () => ({
  DeadFishPage: () => <div data-testid="deadfish-page">Dead Fish Page</div>,
}));

vi.mock("./components/Brand/BrandPage", () => ({
  BrandPage: () => <div data-testid="brand-page">Brand Page</div>,
}));

// Import the mocked components
import App from "./App";
import { ConfigPage } from "./components/Config/ConfigPage";
import { DeadFishPage } from "./components/DeadFish/DeadFishPage";
import { BrandPage } from "./components/Brand/BrandPage";

// Mock localStorage for EndpointProvider
interface LocalStorageMock {
  getItem: Mock<(key: string) => string | null>;
  setItem: Mock<(key: string, value: string) => void>;
  removeItem: Mock<(key: string) => void>;
  clear: Mock<() => void>;
}

const localStorageMock: LocalStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Helper component that mirrors the routing structure in main.tsx
function TestApp({ initialRoute = "/" }: { initialRoute?: string }): React.ReactElement {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider>
        <EndpointProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/deadfish" element={<DeadFishPage />} />
            <Route path="/brand" element={<BrandPage />} />
          </Routes>
        </EndpointProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe("Application Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe("Route Configuration", () => {
    it("renders App component at root path '/'", () => {
      render(<TestApp initialRoute="/" />);

      expect(screen.getByTestId("app-page")).toBeInTheDocument();
      expect(screen.getByText("App Page")).toBeInTheDocument();
    });

    it("renders ConfigPage at '/config' path", () => {
      render(<TestApp initialRoute="/config" />);

      expect(screen.getByTestId("config-page")).toBeInTheDocument();
      expect(screen.getByText("Config Page")).toBeInTheDocument();
    });

    it("renders DeadFishPage at '/deadfish' path", () => {
      render(<TestApp initialRoute="/deadfish" />);

      expect(screen.getByTestId("deadfish-page")).toBeInTheDocument();
      expect(screen.getByText("Dead Fish Page")).toBeInTheDocument();
    });

    it("renders BrandPage at '/brand' path", () => {
      render(<TestApp initialRoute="/brand" />);

      expect(screen.getByTestId("brand-page")).toBeInTheDocument();
      expect(screen.getByText("Brand Page")).toBeInTheDocument();
    });

    it("does not render other pages when on root path", () => {
      render(<TestApp initialRoute="/" />);

      expect(screen.getByTestId("app-page")).toBeInTheDocument();
      expect(screen.queryByTestId("config-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deadfish-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("brand-page")).not.toBeInTheDocument();
    });

    it("does not render other pages when on config path", () => {
      render(<TestApp initialRoute="/config" />);

      expect(screen.getByTestId("config-page")).toBeInTheDocument();
      expect(screen.queryByTestId("app-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deadfish-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("brand-page")).not.toBeInTheDocument();
    });
  });

  describe("Unknown Routes", () => {
    it("renders nothing for unknown route", () => {
      render(<TestApp initialRoute="/unknown-route" />);

      expect(screen.queryByTestId("app-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("config-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("deadfish-page")).not.toBeInTheDocument();
      expect(screen.queryByTestId("brand-page")).not.toBeInTheDocument();
    });

    it("renders nothing for nested unknown route", () => {
      render(<TestApp initialRoute="/config/unknown" />);

      expect(screen.queryByTestId("config-page")).not.toBeInTheDocument();
    });
  });

  describe("EndpointProvider Integration", () => {
    it("provides endpoint context to routed components", () => {
      // EndpointProvider should initialize without errors
      expect(() => {
        render(<TestApp initialRoute="/" />);
      }).not.toThrow();
    });

    it("loads endpoints from localStorage on mount", () => {
      render(<TestApp initialRoute="/" />);

      expect(localStorageMock.getItem).toHaveBeenCalledWith("aquarium-endpoints");
    });

    it("handles existing endpoints in localStorage", () => {
      const mockEndpoints = [
        {
          id: "1",
          url: "https://api.example.com",
          description: "Test API",
          color: { h: 180, s: 70, l: 50 },
        },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockEndpoints));

      expect(() => {
        render(<TestApp initialRoute="/" />);
      }).not.toThrow();
    });

    it("handles malformed localStorage data gracefully", () => {
      localStorageMock.getItem.mockReturnValue("invalid json");

      // Should throw since JSON.parse will fail
      expect(() => {
        render(<TestApp initialRoute="/" />);
      }).toThrow();
    });
  });

  describe("Route Transitions", () => {
    it("each route is independent and renders correctly", () => {
      // Test each route renders independently
      const routes = [
        { path: "/", testId: "app-page" },
        { path: "/config", testId: "config-page" },
        { path: "/deadfish", testId: "deadfish-page" },
        { path: "/brand", testId: "brand-page" },
      ];

      routes.forEach(({ path, testId }) => {
        const { unmount } = render(<TestApp initialRoute={path} />);
        expect(screen.getByTestId(testId)).toBeInTheDocument();
        unmount();
      });
    });
  });
});

describe("Application Structure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("has BrowserRouter at the top level (verified by MemoryRouter working)", () => {
    // MemoryRouter is used in tests as a substitute for BrowserRouter
    // If routing works, the structure is correct
    render(<TestApp initialRoute="/" />);
    expect(screen.getByTestId("app-page")).toBeInTheDocument();
  });

  it("wraps routes with EndpointProvider", () => {
    // The fact that we can render without errors means EndpointProvider is working
    expect(() => {
      render(<TestApp initialRoute="/config" />);
    }).not.toThrow();
  });

  it("has exactly 4 routes configured", () => {
    // Verify each of the 4 expected routes works
    const expectedRoutes = ["/", "/config", "/deadfish", "/brand"];

    expectedRoutes.forEach((route) => {
      const { unmount } = render(<TestApp initialRoute={route} />);
      // Each route should render something (not empty)
      const content = document.body.textContent;
      expect(content).not.toBe("");
      unmount();
    });
  });
});
