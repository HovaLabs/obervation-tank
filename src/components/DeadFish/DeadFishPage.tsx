import React from "react";
import { useEndpoints } from "../../context/EndpointContext";
import { RGBTuple } from "../../utils/colorUtils";
import { FishPreview } from "../Visualization/FishPreview";
import { Footer } from "../Layout/Footer";
import { Header } from "../Layout/Header";

export function DeadFishPage(): React.ReactElement {
  const { endpoints, endpointStatuses, hslToRgb, pingEndpoint } =
    useEndpoints();

  const deadFish = endpoints.filter((endpoint) => {
    const status = endpointStatuses[endpoint.id];
    // Show if in error OR if pending with a previous error (being re-pinged)
    return (
      status?.status === "error" ||
      (status?.status === "pending" && status?.error)
    );
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-bg-deadfish via-bg-primary to-bg-secondary text-text-primary font-sans">
      <Header />

      <div className="max-w-[800px] mx-auto px-5 py-10">
        {deadFish.length === 0 ? (
          <div className="text-center px-5 py-16 bg-success-bg rounded-2xl border border-success-border">
            <div className="mb-6 w-[600px] h-[360px] mx-auto">
              <FishPreview color={[0.3, 0.8, 0.4] as RGBTuple} scale={0.45} />
            </div>
            <h2 className="m-0 mb-2 text-2xl font-title tracking-[2px] text-success">
              All fish are healthy!
            </h2>
            <p className="m-0 text-text-secondary">
              No endpoints are currently returning errors.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 p-6 bg-error-bg rounded-xl border border-error-border">
              <span className="block text-5xl font-bold text-error leading-none">
                {deadFish.length}
              </span>
              <span className="text-error-lighter text-base">
                endpoint{deadFish.length !== 1 ? "s" : ""} failing
              </span>
            </div>

            <ul className="list-none p-0 m-0">
              {deadFish.map((endpoint) => {
                const status = endpointStatuses[endpoint.id];
                const colorRgb = hslToRgb(endpoint.color);

                return (
                  <li
                    key={endpoint.id}
                    className="endpoint-card max-[600px]:flex-col max-[600px]:items-start"
                  >
                    <div className="w-[120px] h-20 flex-shrink-0 rounded-lg overflow-hidden bg-surface-secondary">
                      <FishPreview color={colorRgb} hasError={true} />
                    </div>
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
                        <span
                          className={
                            status?.status === "pending"
                              ? "badge-pending"
                              : "badge-error"
                          }
                        >
                          {status?.status === "pending"
                            ? "Checking..."
                            : "Error"}
                        </span>
                        <span className="text-[11px] text-error-light">
                          {status?.error || "Unknown error"}
                        </span>
                      </div>
                      {status?.lastChecked && (
                        <span className="text-[11px] text-text-muted mt-1 block">
                          Last checked:{" "}
                          {new Date(status.lastChecked).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 max-[600px]:w-full max-[600px]:justify-end">
                      <button
                        onClick={() => pingEndpoint(endpoint)}
                        className="btn-ping"
                        title="Ping now"
                      >
                        Ping
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
