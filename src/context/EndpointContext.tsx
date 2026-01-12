import { createContext, use, useState, useEffect, useCallback, useOptimistic, useTransition, ReactNode } from "react";
import { generateRandomColor, hslToRgb, RGBTuple } from "../utils/colorUtils";

// Type definitions
export type AuthType = "none" | "basic" | "bearer" | "apikey";

export interface Credentials {
  type: AuthType;
  username?: string;
  password?: string;
  token?: string;
  headerName?: string;
  headerValue?: string;
}

export interface Endpoint {
  id: string;
  url: string;
  description: string;
  color: string;
  createdAt: string;
  credentials: Credentials | null;
}

export interface EndpointStatus {
  status: "pending" | "ok" | "error";
  lastChecked: string | null;
  error?: string | null;
}

export interface ErrorInfo {
  endpointId: string;
  url: string;
  error: string;
  timestamp: string;
}

export interface EndpointContextValue {
  endpoints: Endpoint[];
  endpointStatuses: Record<string, EndpointStatus>;
  errorInfo: ErrorInfo | null;
  isPinging: boolean;
  addEndpoint: (url: string, description?: string, credentials?: Credentials | null) => Endpoint;
  removeEndpoint: (id: string) => void;
  removeAllEndpoints: () => void;
  updateEndpoint: (id: string, updates: { url?: string; description?: string; color?: string }) => void;
  pingEndpoint: (endpoint: Endpoint) => void;
  pingAllEndpoints: () => void;
  dismissError: () => void;
  hslToRgb: (hslString: string | null | undefined) => RGBTuple;
}

const EndpointContext = createContext<EndpointContextValue | null>(null);

interface EndpointProviderProps {
  children: ReactNode;
}

export function EndpointProvider({ children }: EndpointProviderProps) {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => {
    const saved = localStorage.getItem("aquarium-endpoints");
    if (!saved) return [];
    // Ensure all endpoints have a color (migration for old data)
    const parsed = JSON.parse(saved) as Endpoint[];
    return parsed.map((ep) => ({
      ...ep,
      color: ep.color || generateRandomColor(),
    }));
  });

  const [endpointStatuses, setEndpointStatuses] = useState<Record<string, EndpointStatus>>({});
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);
  const [isPinging, startPingTransition] = useTransition();

  // React 19: Optimistic updates for endpoint statuses during ping
  const [optimisticStatuses, setOptimisticStatus] = useOptimistic(
    endpointStatuses,
    (currentStatuses, { id, status }: { id: string; status: EndpointStatus["status"] }) => ({
      ...currentStatuses,
      [id]: { ...currentStatuses[id], status, lastChecked: new Date().toISOString() },
    })
  );

  // Save endpoints to localStorage
  useEffect(() => {
    localStorage.setItem("aquarium-endpoints", JSON.stringify(endpoints));
  }, [endpoints]);

  // Add a new endpoint
  const addEndpoint = useCallback((url: string, description = "", credentials: Credentials | null = null): Endpoint => {
    const newEndpoint: Endpoint = {
      id: Date.now().toString(),
      url: url.trim(),
      description: description.trim(),
      color: generateRandomColor(),
      createdAt: new Date().toISOString(),
      credentials: credentials,
    };
    setEndpoints((prev) => [...prev, newEndpoint]);
    setEndpointStatuses((prev) => ({
      ...prev,
      [newEndpoint.id]: { status: "pending", lastChecked: null },
    }));
    return newEndpoint;
  }, []);

  // Remove an endpoint
  const removeEndpoint = useCallback((id: string) => {
    setEndpoints((prev) => prev.filter((ep) => ep.id !== id));
    setEndpointStatuses((prev) => {
      const newStatuses = { ...prev };
      delete newStatuses[id];
      return newStatuses;
    });
  }, []);

  // Remove all endpoints
  const removeAllEndpoints = useCallback(() => {
    setEndpoints([]);
    setEndpointStatuses({});
    setErrorInfo(null);
  }, []);

  // Update an endpoint
  const updateEndpoint = useCallback((id: string, updates: { url?: string; description?: string; color?: string }) => {
    setEndpoints((prev) =>
      prev.map((ep) =>
        ep.id === id
          ? {
              ...ep,
              url: updates.url !== undefined ? updates.url.trim() : ep.url,
              description: updates.description !== undefined ? updates.description.trim() : ep.description,
              color: updates.color !== undefined ? updates.color : ep.color,
            }
          : ep
      )
    );
    // Reset status to pending when URL changes
    if (updates.url !== undefined) {
      setEndpointStatuses((prev) => ({
        ...prev,
        [id]: { status: "pending", lastChecked: null },
      }));
    }
  }, []);

  // Build headers from credentials
  const buildAuthHeaders = useCallback((credentials: Credentials | null): Record<string, string> => {
    if (!credentials || credentials.type === "none") {
      return {};
    }

    const headers: Record<string, string> = {};

    switch (credentials.type) {
      case "basic":
        if (credentials.username && credentials.password) {
          const encoded = btoa(`${credentials.username}:${credentials.password}`);
          headers["Authorization"] = `Basic ${encoded}`;
        }
        break;
      case "bearer":
        if (credentials.token) {
          headers["Authorization"] = `Bearer ${credentials.token}`;
        }
        break;
      case "apikey":
        if (credentials.headerName && credentials.headerValue) {
          headers[credentials.headerName] = credentials.headerValue;
        }
        break;
    }

    return headers;
  }, []);

  // Ping a single endpoint with React 19 optimistic updates
  const pingEndpoint = useCallback((endpoint: Endpoint) => {
    // Show optimistic "pending" state immediately
    startPingTransition(async () => {
      setOptimisticStatus({ id: endpoint.id, status: "pending" });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const authHeaders = buildAuthHeaders(endpoint.credentials);
        const hasAuth = Object.keys(authHeaders).length > 0;

        await fetch(endpoint.url, {
          method: "GET",
          mode: hasAuth ? "cors" : "no-cors", // Use cors mode when auth is needed
          headers: hasAuth ? authHeaders : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // In no-cors mode, we can't read the response, but if we get here, the request succeeded
        setEndpointStatuses((prev) => ({
          ...prev,
          [endpoint.id]: {
            status: "ok",
            lastChecked: new Date().toISOString(),
            error: null,
          },
        }));

        // Clear error info if this endpoint was in error
        setErrorInfo((prev) => (prev?.endpointId === endpoint.id ? null : prev));

      } catch (error) {
        const err = error as Error;
        const errorMessage = err.name === "AbortError"
          ? "Request timed out"
          : err.message || "Failed to reach endpoint";

        setEndpointStatuses((prev) => ({
          ...prev,
          [endpoint.id]: {
            status: "error",
            lastChecked: new Date().toISOString(),
            error: errorMessage,
          },
        }));

        // Set error info for display
        setErrorInfo({
          endpointId: endpoint.id,
          url: endpoint.url,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    });
  }, [buildAuthHeaders, setOptimisticStatus, startPingTransition]);

  // Ping all endpoints
  const pingAllEndpoints = useCallback(() => {
    endpoints.forEach((endpoint) => {
      pingEndpoint(endpoint);
    });
  }, [endpoints, pingEndpoint]);

  // Set up interval to ping endpoints every minute
  useEffect(() => {
    if (endpoints.length === 0) return;

    // Initial ping
    pingAllEndpoints();

    // Set up interval
    const intervalId = setInterval(pingAllEndpoints, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, [endpoints.length, pingAllEndpoints]);

  // Clear error info after 10 seconds
  useEffect(() => {
    if (errorInfo) {
      const timeoutId = setTimeout(() => {
        setErrorInfo(null);
      }, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [errorInfo]);

  // Dismiss error manually
  const dismissError = useCallback(() => {
    setErrorInfo(null);
  }, []);

  const value: EndpointContextValue = {
    endpoints,
    endpointStatuses: optimisticStatuses, // Use optimistic statuses for immediate UI feedback
    errorInfo,
    isPinging,
    addEndpoint,
    removeEndpoint,
    removeAllEndpoints,
    updateEndpoint,
    pingEndpoint,
    pingAllEndpoints,
    dismissError,
    hslToRgb,
  };

  return (
    <EndpointContext.Provider value={value}>
      {children}
    </EndpointContext.Provider>
  );
}

// React 19: Export context for use with the `use` hook
export { EndpointContext };

// React 19: Updated hook using the new `use` API for context
export function useEndpoints(): EndpointContextValue {
  const context = use(EndpointContext);
  if (!context) {
    throw new Error("useEndpoints must be used within an EndpointProvider");
  }
  return context;
}
