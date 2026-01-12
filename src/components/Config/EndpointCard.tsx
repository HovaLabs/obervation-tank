import React, { ReactElement, useEffect, useMemo, useRef } from "react";
import { Endpoint, EndpointStatus } from "../../context/EndpointContext";
import { RGBTuple, hexToHsl, hslToRgb } from "../../utils/colorUtils";
import { FishPreview } from "../Visualization/FishPreview";

interface EndpointCardProps {
  endpoint: Endpoint;
  status: EndpointStatus | undefined;
  colorRgb: RGBTuple;
  isEditing: boolean;
  editUrl: string;
  editDescription: string;
  editColor: string;
  editError: string;
  onEditUrlChange: (url: string) => void;
  onEditDescriptionChange: (description: string) => void;
  onEditColorChange: (color: string) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onStartEditing: (endpoint: Endpoint) => void;
  onPing: (endpoint: Endpoint) => void;
  onRemove: (id: string) => void;
  getStatusBadge: (endpointId: string) => ReactElement;
}

export function EndpointCard({
  endpoint,
  status,
  colorRgb,
  isEditing,
  editUrl,
  editDescription,
  editColor,
  editError,
  onEditUrlChange,
  onEditDescriptionChange,
  onEditColorChange,
  onSave,
  onCancel,
  onStartEditing,
  onPing,
  onRemove,
  getStatusBadge,
}: EndpointCardProps): React.ReactElement {
  const hasError = status?.status === "error";
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  // Convert editColor (hex) to RGB for real-time preview
  const previewColor = useMemo<RGBTuple>(() => {
    if (isEditing && editColor) {
      return hslToRgb(hexToHsl(editColor));
    }
    return colorRgb;
  }, [isEditing, editColor, colorRgb]);

  // Focus description input when entering edit mode
  useEffect(() => {
    if (isEditing && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <li className="endpoint-card max-[600px]:flex-col max-[600px]:items-start">
      <div className="w-[120px] h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
        <FishPreview color={previewColor} hasError={hasError} />
      </div>
      {isEditing ? (
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <input
            ref={descriptionInputRef}
            type="text"
            value={editDescription}
            onChange={(e) => onEditDescriptionChange(e.target.value)}
            placeholder="Description (optional)"
            aria-label="Edit endpoint description"
            className="input-base !py-2"
          />
          <input
            type="text"
            value={editUrl}
            onChange={(e) => onEditUrlChange(e.target.value)}
            placeholder="https://api.example.com/health"
            aria-label="Edit endpoint URL"
            className="input-base !py-2"
          />
          <div className="flex items-center gap-2">
            <label className="text-text-secondary text-xs">Fish Color:</label>
            <input
              type="color"
              value={editColor}
              onChange={(e) => onEditColorChange(e.target.value)}
              aria-label="Edit fish color"
              className="w-10 h-8 rounded cursor-pointer border border-border-secondary bg-transparent"
            />
          </div>
          {editError && (
            <span className="text-error-light text-xs">{editError}</span>
          )}
          <div className="flex gap-2">
            <button onClick={() => onSave(endpoint.id)} className="btn-ping">
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded text-xs cursor-pointer transition-all duration-200 bg-surface-tertiary text-text-secondary border border-border-secondary hover:bg-surface-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-w-0">
          {endpoint.description && (
            <span className="block text-[15px] font-medium text-text-primary mb-1">
              {endpoint.description}
            </span>
          )}
          <span className="block text-xs text-text-muted break-all mb-1.5">
            {endpoint.url}
          </span>
          <div className="flex flex-wrap gap-2 items-center">
            {getStatusBadge(endpoint.id)}
            {endpoint.credentials && endpoint.credentials.type !== "none" && (
              <span className="badge-auth">{endpoint.credentials.type}</span>
            )}
            {status?.lastChecked && (
              <span className="text-[11px] text-text-muted">
                Last checked:{" "}
                {new Date(status.lastChecked).toLocaleTimeString()}
              </span>
            )}
            {status?.error && (
              <span className="text-[11px] text-error-light">
                {status.error}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-shrink-0 max-[600px]:w-full max-[600px]:justify-end">
        {!isEditing && (
          <>
            <button
              onClick={() => onStartEditing(endpoint)}
              className="px-4 py-2 rounded text-xs cursor-pointer transition-all duration-200 bg-surface-tertiary text-text-secondary border border-border-secondary hover:bg-accent-bg hover:text-accent-primary hover:border-accent-primary"
              title="Edit endpoint"
            >
              Edit
            </button>
            <button
              onClick={() => onPing(endpoint)}
              className="btn-ping"
              title="Ping now"
            >
              Ping
            </button>
            <button
              onClick={() => onRemove(endpoint.id)}
              className="btn-remove"
              title="Remove endpoint"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </li>
  );
}
