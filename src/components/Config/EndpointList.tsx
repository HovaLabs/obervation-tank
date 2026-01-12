import React, { useState, useDeferredValue, useMemo } from "react";
import { useEndpoints, Endpoint } from "../../context/EndpointContext";
import { useStatusBadge } from "../../hooks/useStatusBadge";
import { hslToHex, hexToHsl } from "../../utils/colorUtils";
import { EndpointCard } from "./EndpointCard";

export function EndpointList(): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editError, setEditError] = useState("");

  // React 19: Use deferred value for non-blocking search updates
  // This keeps the input responsive while filtering happens in the background
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isSearchStale = searchQuery !== deferredSearchQuery;

  const {
    endpoints,
    endpointStatuses,
    removeEndpoint,
    removeAllEndpoints,
    updateEndpoint,
    pingEndpoint,
    hslToRgb,
  } = useEndpoints();

  const { getStatusBadge } = useStatusBadge();

  const startEditing = (endpoint: Endpoint): void => {
    setEditingId(endpoint.id);
    setEditUrl(endpoint.url);
    setEditDescription(endpoint.description || "");
    setEditColor(hslToHex(endpoint.color));
    setEditError("");
  };

  const cancelEditing = (): void => {
    setEditingId(null);
    setEditUrl("");
    setEditDescription("");
    setEditColor("");
    setEditError("");
  };

  const saveEdit = (id: string): void => {
    setEditError("");

    if (!editUrl.trim()) {
      setEditError("Please enter a URL");
      return;
    }

    try {
      new URL(editUrl);
    } catch {
      setEditError("Please enter a valid URL (including http:// or https://)");
      return;
    }

    updateEndpoint(id, { url: editUrl, description: editDescription, color: hexToHsl(editColor) });
    cancelEditing();
  };

  // React 19: Memoize filtered results with deferred query for better performance
  const filteredEndpoints = useMemo(() => {
    if (!deferredSearchQuery.trim()) return endpoints;
    const query = deferredSearchQuery.toLowerCase();
    return endpoints.filter((endpoint) =>
      endpoint.url.toLowerCase().includes(query) ||
      (endpoint.description && endpoint.description.toLowerCase().includes(query))
    );
  }, [endpoints, deferredSearchQuery]);

  return (
    <section className="section-card">
      <div className="flex justify-between items-center mb-4 gap-4 max-[600px]:flex-col max-[600px]:items-start">
        <h2 className="m-0 text-xl font-title tracking-[2px] text-accent-primary">
          Monitored Endpoints ({endpoints.length})
        </h2>
        {endpoints.length > 0 && (
          <div className="flex gap-2 items-center max-[600px]:w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints..."
              aria-label="Search endpoints by URL or description"
              className="px-3 py-2 border border-border-secondary rounded-md bg-surface-tertiary text-text-primary text-sm min-w-[200px] placeholder:text-text-placeholder focus:outline-none focus:border-accent-primary max-[600px]:flex-1 max-[600px]:min-w-0"
            />
            <button
              onClick={() => {
                if (
                  window.confirm(
                    `Delete all ${endpoints.length} endpoint${
                      endpoints.length !== 1 ? "s" : ""
                    }? This cannot be undone.`
                  )
                ) {
                  removeAllEndpoints();
                }
              }}
              className="btn-remove whitespace-nowrap"
              title="Delete all endpoints"
            >
              Delete All
            </button>
          </div>
        )}
      </div>

      {endpoints.length === 0 ? (
        <p className="text-text-muted text-center p-5">
          No endpoints configured yet. Add one above to see a fish appear in
          the aquarium!
        </p>
      ) : filteredEndpoints.length === 0 ? (
        <p className="text-text-muted text-center p-5">
          No endpoints match your search.
        </p>
      ) : (
        <ul
          className="list-none p-0 m-0"
          style={{ opacity: isSearchStale ? 0.7 : 1, transition: "opacity 0.2s" }}
        >
          {filteredEndpoints.map((endpoint) => (
            <EndpointCard
              key={endpoint.id}
              endpoint={endpoint}
              status={endpointStatuses[endpoint.id]}
              colorRgb={hslToRgb(endpoint.color)}
              isEditing={editingId === endpoint.id}
              editUrl={editUrl}
              editDescription={editDescription}
              editColor={editColor}
              editError={editError}
              onEditUrlChange={setEditUrl}
              onEditDescriptionChange={setEditDescription}
              onEditColorChange={setEditColor}
              onSave={saveEdit}
              onCancel={cancelEditing}
              onStartEditing={startEditing}
              onPing={pingEndpoint}
              onRemove={removeEndpoint}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
