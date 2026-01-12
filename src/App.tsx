import React from "react";
import { Link } from "react-router-dom";
import { Aquarium } from "./components/Visualization/Aquarium";
import { useEndpoints } from "./context/EndpointContext";

function App(): React.ReactElement {
  const { endpoints, endpointStatuses } = useEndpoints();

  const errorCount = endpoints.filter((ep) => {
    const status = endpointStatuses[ep.id];
    return (
      status?.status === "error" ||
      (status?.status === "pending" && status?.error)
    );
  }).length;

  return (
    <main className="w-screen h-screen bg-[rgb(31,31,31)] relative overflow-hidden">
      {/* BUTTONS */}
      <div className="absolute top-5 right-5 z-[100] flex gap-3">
        <Link
          to="/config"
          className="px-6 py-3 bg-accent-primary text-bg-primary no-underline rounded-lg font-sans font-semibold text-sm transition-all duration-200 shadow-lg flex items-center gap-2 hover:bg-accent-hover hover:-translate-y-0.5 hover:shadow-xl"
        >
          Configure Endpoints
        </Link>
        <Link
          to="/deadfish"
          className={`px-6 py-3 no-underline rounded-lg font-sans font-semibold text-sm transition-all duration-200 shadow-lg flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-xl ${
            errorCount > 0
              ? "bg-error text-white animate-pulse-error hover:bg-error-light"
              : "bg-pending-bg text-white hover:bg-text-muted"
          }`}
        >
          Dead Fish{" "}
          {errorCount > 0 && (
            <span className="bg-white/30 px-2 py-0.5 rounded-xl text-xs font-bold">
              {errorCount}
            </span>
          )}
        </Link>
      </div>

      {/* EMPTY TANK MESSAGE */}
      {endpoints.length === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 text-center text-white/70 font-sans bg-black/50 px-10 py-8 rounded-xl backdrop-blur-[10px]">
          <p className="my-2">No endpoints configured</p>
          <p className="my-2">
            Go to{" "}
            <Link to="/config" className="text-accent-primary">
              Configuration
            </Link>{" "}
            to add endpoints and see fish!
          </p>
        </div>
      )}
      {/* FISH AREA */}
      <Aquarium />
    </main>
  );
}

export default App;
