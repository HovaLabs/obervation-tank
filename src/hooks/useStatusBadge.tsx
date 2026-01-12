import { ReactElement } from "react";
import { useEndpoints } from "../context/EndpointContext";

export interface UseStatusBadgeReturn {
  getStatusBadge: (endpointId: string) => ReactElement;
}

export function useStatusBadge(): UseStatusBadgeReturn {
  const { endpointStatuses } = useEndpoints();

  const getStatusBadge = (endpointId: string): ReactElement => {
    const status = endpointStatuses[endpointId];
    if (!status || status.status === "pending") {
      return <span className="badge-pending">Pending</span>;
    }
    if (status.status === "ok") {
      return <span className="badge-ok">OK</span>;
    }
    return <span className="badge-error">Error</span>;
  };

  return { getStatusBadge };
}
