import { useState, ChangeEvent } from "react";
import { Credentials, AuthType } from "../context/EndpointContext";

export interface ParsedEndpoint {
  url: string;
  description: string;
  credentials: Credentials | null;
}

export interface ParseResult {
  endpoints?: ParsedEndpoint[];
  errors?: string[];
  error?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  errors?: string[];
}

interface CSVRow {
  url?: string;
  description?: string;
  authtype?: string;
  auth_type?: string;
  username?: string;
  password?: string;
  token?: string;
  headername?: string;
  header_name?: string;
  headervalue?: string;
  header_value?: string;
  [key: string]: string | undefined;
}

type AddEndpointFn = (url: string, description: string, credentials: Credentials | null) => void;

export function useCSVParser() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string): ParseResult => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      return { error: "CSV must have a header row and at least one data row" };
    }

    const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const requiredFields = ["url"];
    const missingFields = requiredFields.filter((f) => !header.includes(f));
    if (missingFields.length > 0) {
      return { error: `Missing required columns: ${missingFields.join(", ")}` };
    }

    const endpoints: ParsedEndpoint[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of lines[i]) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: CSVRow = {};
      header.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });

      if (!row.url) {
        errors.push(`Row ${i + 1}: Missing URL`);
        continue;
      }

      try {
        new URL(row.url);
      } catch {
        errors.push(`Row ${i + 1}: Invalid URL "${row.url}"`);
        continue;
      }

      let credentials: Credentials | null = null;
      const authType = (row.authtype || row.auth_type || "none").toLowerCase() as AuthType;
      if (authType !== "none") {
        credentials = { type: authType };
        if (authType === "basic") {
          credentials.username = row.username || "";
          credentials.password = row.password || "";
        } else if (authType === "bearer") {
          credentials.token = row.token || "";
        } else if (authType === "apikey") {
          credentials.headerName =
            row.headername || row.header_name || "X-API-Key";
          credentials.headerValue = row.headervalue || row.header_value || "";
        }
      }

      endpoints.push({
        url: row.url,
        description: row.description || "",
        credentials,
      });
    }

    return { endpoints, errors };
  };

  const handleImportCSV = (e: ChangeEvent<HTMLInputElement>, addEndpoint: AddEndpointFn) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== "string") {
        setImportResult({ success: false, message: "Failed to read file" });
        return;
      }

      const result = parseCSV(text);
      if (result.error) {
        setImportResult({ success: false, message: result.error });
        return;
      }

      let imported = 0;
      for (const ep of result.endpoints || []) {
        addEndpoint(ep.url, ep.description, ep.credentials);
        imported++;
      }

      const message = `Imported ${imported} endpoint${imported !== 1 ? "s" : ""}`;
      const warnings =
        (result.errors?.length || 0) > 0
          ? `. Skipped ${result.errors?.length} row(s) with errors.`
          : "";
      setImportResult({
        success: true,
        message: message + warnings,
        errors: result.errors,
      });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearImportResult = () => setImportResult(null);

  return { parseCSV, handleImportCSV, importResult, clearImportResult };
}
