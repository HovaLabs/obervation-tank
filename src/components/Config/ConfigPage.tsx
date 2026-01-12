import React from "react";
import { Link } from "react-router-dom";
import { useEndpoints } from "../../context/EndpointContext";
import { AddEndpointForm } from "./AddEndpointForm";
import { CSVImportSection } from "./CSVImportSection";
import { EndpointList } from "./EndpointList";
import { Footer } from "../Layout/Footer";
import { Header } from "../Layout/Header";

export function ConfigPage(): React.ReactElement {
  const { addEndpoint } = useEndpoints();

  return (
    <main className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary text-text-primary font-sans">
      <Header />
      {/* ADD NEW INDIVIDUAL ENDPOINT AREA */}
      <div className="max-w-[800px] mx-auto px-5 py-10">
        <AddEndpointForm onAddEndpoint={addEndpoint} />

        {/* CSV IMPORT AREA */}
        <CSVImportSection onAddEndpoint={addEndpoint} />

        {/* ENDPOINTS LIST AREA */}
        <EndpointList />

        {/* HOW IT WORKS AREA */}
        <section className="section-card">
          <h2 className="m-0 mb-3 text-xl font-title tracking-[2px] text-accent-primary">
            How it works
          </h2>
          <ul className="m-0 pl-5 text-text-secondary leading-loose list-disc space-y-2">
            <li>Each endpoint is pinged every 60 seconds</li>
            <li>Healthy endpoints show fish swimming normally</li>
            <li>
              When an endpoint fails, its fish floats to the top of the tank
            </li>
          </ul>
        </section>

        <div className="text-center">
          <Link
            to="/brand"
            className="text-text-muted text-sm hover:text-accent-primary transition-colors duration-200"
          >
            Brand Assets &amp; Guidelines →
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
