import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EndpointProvider } from "./context/EndpointContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

// Code-split routes - each page loads only when navigated to
const App = lazy(() => import("./App"));
const ConfigPage = lazy(() => import("./components/Config/ConfigPage").then(m => ({ default: m.ConfigPage })));
const DeadFishPage = lazy(() => import("./components/DeadFish/DeadFishPage").then(m => ({ default: m.DeadFishPage })));
const BrandPage = lazy(() => import("./components/Brand/BrandPage").then(m => ({ default: m.BrandPage })));

// Loading fallback component
function LoadingFallback(): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary flex items-center justify-center">
      <div className="text-accent-primary text-xl font-title tracking-[2px]">Loading...</div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

createRoot(rootElement).render(
  <BrowserRouter>
    <ThemeProvider>
      <EndpointProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/config" element={<ConfigPage />} />
            <Route path="/deadfish" element={<DeadFishPage />} />
            <Route path="/brand" element={<BrandPage />} />
          </Routes>
        </Suspense>
      </EndpointProvider>
    </ThemeProvider>
  </BrowserRouter>
);
