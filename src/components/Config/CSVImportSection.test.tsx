import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { Credentials } from "../../context/EndpointContext";
import { CSVImportSection } from "./CSVImportSection";

// Helper to create a mock file
function createFile(
  content: string,
  filename = "test.csv",
  type = "text/csv"
): File {
  return new File([content], filename, { type });
}

// Helper to simulate file upload
async function uploadFile(input: HTMLInputElement, file: File): Promise<void> {
  Object.defineProperty(input, "files", {
    value: [file],
    writable: false,
  });
  fireEvent.change(input);
}

describe("CSVImportSection", () => {
  let mockOnAddEndpoint: Mock<
    (url: string, description: string, credentials: Credentials | null) => void
  >;

  beforeEach(() => {
    mockOnAddEndpoint = vi.fn();
  });

  it("renders the section with all required elements", () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    expect(screen.getByText("Import from CSV")).toBeInTheDocument();
    expect(screen.getByText("Choose CSV File")).toBeInTheDocument();
    expect(screen.getByText("Download template")).toBeInTheDocument();
    expect(screen.getByText("CSV Format")).toBeInTheDocument();
  });

  it("has a download link for the template", () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const downloadLink = screen.getByText("Download template");
    expect(downloadLink).toHaveAttribute(
      "href",
      "/TEMPLATE_ENDPOINT_IMPORT.csv"
    );
    expect(downloadLink).toHaveAttribute("download");
  });

  it("has a hidden file input that accepts CSV files", () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("accept", ".csv");
    expect(fileInput).toHaveClass("hidden");
  });

  it("expands CSV format details when clicked", () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const details = screen.getByText("CSV Format").closest("details");
    expect(details).not.toHaveAttribute("open");

    fireEvent.click(screen.getByText("CSV Format"));

    // Check that format info is visible
    expect(screen.getByText(/Required:/)).toBeInTheDocument();
    expect(screen.getByText(/Optional:/)).toBeInTheDocument();
  });

  it("imports valid CSV with single endpoint", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,My API`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "My API",
        null
      );
    });

    await waitFor(() => {
      expect(screen.getByText("Imported 1 endpoint")).toBeInTheDocument();
    });
  });

  it("imports multiple endpoints from CSV", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,API 1
https://api.example.com/status,API 2
https://api.example.com/ping,API 3`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      expect(screen.getByText("Imported 3 endpoints")).toBeInTheDocument();
    });
  });

  it("shows error for CSV without header row", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `https://api.example.com/health`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(
        screen.getByText("CSV must have a header row and at least one data row")
      ).toBeInTheDocument();
    });

    expect(mockOnAddEndpoint).not.toHaveBeenCalled();
  });

  it("shows error for CSV missing url column", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `description,authType
My API,none`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(
        screen.getByText("Missing required columns: url")
      ).toBeInTheDocument();
    });

    expect(mockOnAddEndpoint).not.toHaveBeenCalled();
  });

  it("handles rows with invalid URLs", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,Valid API
not-a-url,Invalid API`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Imported 1 endpoint.*Skipped 1 row/)
      ).toBeInTheDocument();
    });
  });

  it("handles rows with missing URLs", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,Valid API
,Missing URL`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByText(/Skipped 1 row/)).toBeInTheDocument();
    });
  });

  it("displays error details when there are row errors", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,Valid
invalid-url,Bad URL`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/Row 3: Invalid URL/)).toBeInTheDocument();
    });
  });

  it("limits displayed errors to 5 and shows overflow message", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url
invalid1
invalid2
invalid3
invalid4
invalid5
invalid6
invalid7`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText(/\.\.\.and 2 more/)).toBeInTheDocument();
    });
  });

  it("imports endpoint with basic auth credentials", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description,authType,username,password
https://api.example.com/health,Secure API,basic,admin,secret123`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "Secure API",
        { type: "basic", username: "admin", password: "secret123" }
      );
    });
  });

  it("imports endpoint with bearer token", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description,authType,token
https://api.example.com/health,Token API,bearer,my-secret-token`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "Token API",
        { type: "bearer", token: "my-secret-token" }
      );
    });
  });

  it("imports endpoint with API key credentials", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description,authType,headerName,headerValue
https://api.example.com/health,Key API,apikey,X-Custom-Key,key123`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "Key API",
        { type: "apikey", headerName: "X-Custom-Key", headerValue: "key123" }
      );
    });
  });

  it("uses default X-API-Key header name when not provided", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,authType,headerValue
https://api.example.com/health,apikey,key123`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        { type: "apikey", headerName: "X-API-Key", headerValue: "key123" }
      );
    });
  });

  it("handles CSV with quoted values containing commas", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description
https://api.example.com/health,"My API, with comma"`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "My API, with comma",
        null
      );
    });
  });

  it("treats authType 'none' as no credentials", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description,authType
https://api.example.com/health,My API,none`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "My API",
        null
      );
    });
  });

  it("handles case-insensitive header names", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `URL,Description,AuthType
https://api.example.com/health,My API,basic`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalled();
    });
  });

  it("handles alternate column name auth_type", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url,description,auth_type,username,password
https://api.example.com/health,My API,basic,user,pass`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "My API",
        { type: "basic", username: "user", password: "pass" }
      );
    });
  });

  it("shows success styling for successful import", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `url
https://api.example.com/health`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      const resultDiv = screen.getByText("Imported 1 endpoint").closest("div");
      expect(resultDiv).toHaveClass("bg-success-bg");
    });
  });

  it("shows error styling for failed import", async () => {
    render(<CSVImportSection onAddEndpoint={mockOnAddEndpoint} />);

    const csvContent = `description
My API`;

    const file = createFile(csvContent);
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await uploadFile(fileInput, file);

    await waitFor(() => {
      const resultDiv = screen
        .getByText("Missing required columns: url")
        .closest("div");
      expect(resultDiv).toHaveClass("bg-error-bg");
    });
  });
});
