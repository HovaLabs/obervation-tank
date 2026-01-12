import React, { ChangeEvent } from "react";
import { useCSVParser } from "../../hooks/useCSVParser";
import { Credentials } from "../../context/EndpointContext";

interface CSVImportSectionProps {
  onAddEndpoint: (url: string, description: string, credentials: Credentials | null) => void;
}

export function CSVImportSection({ onAddEndpoint }: CSVImportSectionProps): React.ReactElement {
  const { handleImportCSV, importResult } = useCSVParser();

  return (
    <section className="section-card">
      <h2 className="m-0 mb-3 text-xl font-title tracking-[2px] text-accent-primary">
        Import from CSV
      </h2>
      <p className="text-text-secondary mb-4">
        Bulk import endpoints from a CSV file.{" "}
        <a
          href="/TEMPLATE_ENDPOINT_IMPORT.csv"
          download
          className="text-accent-primary hover:underline"
        >
          Download template
        </a>
      </p>
      <div className="flex flex-col gap-3">
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-surface-secondary border border-dashed border-border-secondary rounded-lg text-text-secondary text-sm cursor-pointer transition-all duration-200 hover:border-accent-primary hover:text-accent-primary">
          <span>Choose CSV File</span>
          <input
            type="file"
            accept=".csv"
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleImportCSV(e, onAddEndpoint)}
            aria-label="Choose CSV file to import endpoints"
            className="hidden"
          />
        </label>
        {importResult && (
          <div
            className={`p-3 rounded-lg text-sm ${
              importResult.success
                ? "bg-success-bg text-success"
                : "bg-error-bg text-error-light"
            }`}
          >
            <p className="m-0">{importResult.message}</p>
            {importResult.errors && importResult.errors.length > 0 && (
              <ul className="m-0 mt-2 pl-4 text-xs text-error-light">
                {importResult.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {importResult.errors.length > 5 && (
                  <li>...and {importResult.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        )}
        <details className="text-text-muted text-xs">
          <summary className="cursor-pointer hover:text-accent-primary">
            CSV Format
          </summary>
          <div className="mt-2 p-3 bg-surface-secondary rounded-lg font-mono text-[11px] overflow-x-auto">
            <p className="m-0 mb-2 font-sans text-text-secondary">
              Required: <code className="text-accent-primary">url</code>
            </p>
            <p className="m-0 mb-2 font-sans text-text-secondary">
              Optional:{" "}
              <code className="text-accent-primary">description</code>,{" "}
              <code className="text-accent-primary">authType</code>,{" "}
              <code className="text-accent-primary">username</code>,{" "}
              <code className="text-accent-primary">password</code>,{" "}
              <code className="text-accent-primary">token</code>,{" "}
              <code className="text-accent-primary">headerName</code>,{" "}
              <code className="text-accent-primary">headerValue</code>
            </p>
            <p className="m-0 mb-1 font-sans text-text-secondary">
              Example:
            </p>
            <pre className="m-0 whitespace-pre-wrap text-text-muted">
              url,description,authType,username,password,token,headerName,headerValue
              https://api.example.com/health,Main API,none,,,,,
              https://api.secure.com/status,Secure API,basic,admin,secret,,,
              https://api.token.com/ping,Token API,bearer,,,my-token,,
              https://api.key.com/check,Key API,apikey,,,,X-API-Key,my-key
            </pre>
          </div>
        </details>
      </div>
    </section>
  );
}
