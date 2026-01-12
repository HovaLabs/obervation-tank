import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddEndpointForm } from "./AddEndpointForm";

// Helper to submit form and wait for async action to complete
async function submitForm(form: HTMLFormElement | null): Promise<void> {
  if (!form) return;
  await act(async () => {
    form.requestSubmit();
    // Wait for React 19 form action to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe("AddEndpointForm", () => {
  it("renders the form with all required elements", () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    expect(screen.getByText("Add New Endpoint")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("https://api.example.com/health")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Description (optional)")
    ).toBeInTheDocument();
    expect(screen.getByText("Add Endpoint")).toBeInTheDocument();
    expect(screen.getByText(/Authentication \(optional\)/)).toBeInTheDocument();
  });

  it("shows error when submitting with empty URL", async () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(screen.getByText("Please enter a URL")).toBeInTheDocument();
    });
  });

  it("shows error when submitting with invalid URL", async () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: "not-a-valid-url" } });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Please enter a valid URL (including http:// or https://)"
        )
      ).toBeInTheDocument();
    });
  });

  it("calls onAddEndpoint with correct params for valid URL", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        null
      );
    });
  });

  it("includes description when provided", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(
      "Description (optional)"
    ) as HTMLInputElement;

    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });
    fireEvent.change(descInput, { target: { value: "My API endpoint" } });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "My API endpoint",
        null
      );
    });
  });

  it("clears form after successful submission", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    const descInput = screen.getByPlaceholderText(
      "Description (optional)"
    ) as HTMLInputElement;

    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });
    fireEvent.change(descInput, { target: { value: "My API endpoint" } });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalled();
    });

    // Form resets with a new key, so we need to find the new inputs
    await waitFor(() => {
      const newUrlInput = screen.getByPlaceholderText(
        "https://api.example.com/health"
      ) as HTMLInputElement;
      const newDescInput = screen.getByPlaceholderText(
        "Description (optional)"
      ) as HTMLInputElement;
      expect(newUrlInput.value).toBe("");
      expect(newDescInput.value).toBe("");
    });
  });

  it("toggles authentication options when button is clicked", () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    expect(screen.queryByText("No Authentication")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    expect(screen.getByText("No Authentication")).toBeInTheDocument();
    expect(screen.getByText("Basic Auth")).toBeInTheDocument();
    expect(screen.getByText("Bearer Token")).toBeInTheDocument();
    expect(screen.getByText("API Key")).toBeInTheDocument();
  });

  it("shows basic auth fields when Basic Auth is selected", () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "basic" } });

    expect(screen.getByPlaceholderText("Username")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("passes basic auth credentials when submitted", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "basic" } });

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "admin" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "secret123" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        { type: "basic", username: "admin", password: "secret123" }
      );
    });
  });

  it("shows bearer token field when Bearer Token is selected", () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "bearer" } });

    expect(screen.getByPlaceholderText("Bearer Token")).toBeInTheDocument();
  });

  it("passes bearer token when submitted", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "bearer" } });

    fireEvent.change(screen.getByPlaceholderText("Bearer Token"), {
      target: { value: "my-secret-token" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        { type: "bearer", token: "my-secret-token" }
      );
    });
  });

  it("shows API key fields when API Key is selected", () => {
    render(<AddEndpointForm onAddEndpoint={() => {}} />);

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "apikey" } });

    expect(
      screen.getByPlaceholderText("Header Name (e.g., X-API-Key)")
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("API Key Value")).toBeInTheDocument();
  });

  it("passes API key credentials with custom header name", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "apikey" } });

    fireEvent.change(
      screen.getByPlaceholderText("Header Name (e.g., X-API-Key)"),
      { target: { value: "Authorization" } }
    );
    fireEvent.change(screen.getByPlaceholderText("API Key Value"), {
      target: { value: "api-key-123" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        {
          type: "apikey",
          headerName: "Authorization",
          headerValue: "api-key-123",
        }
      );
    });
  });

  it("uses default header name X-API-Key when not provided", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "apikey" } });

    fireEvent.change(screen.getByPlaceholderText("API Key Value"), {
      target: { value: "api-key-123" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalledWith(
        "https://api.example.com/health",
        "",
        { type: "apikey", headerName: "X-API-Key", headerValue: "api-key-123" }
      );
    });
  });

  it("resets auth fields after successful submission", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    fireEvent.click(screen.getByText(/Authentication \(optional\)/));

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "basic" } });

    fireEvent.change(screen.getByPlaceholderText("Username"), {
      target: { value: "admin" },
    });

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalled();
    });

    // Auth section should be hidden after submission
    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Username")).not.toBeInTheDocument();
    });
  });

  it("does not call onAddEndpoint when validation fails", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(screen.getByText("Please enter a URL")).toBeInTheDocument();
    });

    expect(mockOnAddEndpoint).not.toHaveBeenCalled();
  });

  it("clears error when resubmitting with valid data", async () => {
    const mockOnAddEndpoint = vi.fn();
    render(<AddEndpointForm onAddEndpoint={mockOnAddEndpoint} />);

    // First submit with empty URL
    const form = document.querySelector("form");
    await submitForm(form);

    await waitFor(() => {
      expect(screen.getByText("Please enter a URL")).toBeInTheDocument();
    });

    // Add valid URL and submit
    const urlInput = screen.getByPlaceholderText(
      "https://api.example.com/health"
    ) as HTMLInputElement;
    fireEvent.change(urlInput, {
      target: { value: "https://api.example.com/health" },
    });

    await submitForm(document.querySelector("form"));

    await waitFor(() => {
      expect(mockOnAddEndpoint).toHaveBeenCalled();
    });

    // Error should be cleared after successful submission
    await waitFor(() => {
      expect(screen.queryByText("Please enter a URL")).not.toBeInTheDocument();
    });
  });
});
