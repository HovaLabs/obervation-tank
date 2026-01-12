import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { pathname: "/" };

vi.mock("react-router-dom", () => ({
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.pathname = "/";
  });

  it("renders the logo", () => {
    render(<Header />);

    const logo = screen.getByAltText("Logo");
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute("src", "/logo.svg");
  });

  it("renders the title", () => {
    render(<Header />);

    expect(screen.getByText("Observation Tank")).toBeInTheDocument();
  });

  it("renders all navigation links", () => {
    render(<Header />);

    expect(screen.getByText("Aquarium")).toBeInTheDocument();
    expect(screen.getByText("Config")).toBeInTheDocument();
    expect(screen.getByText("Dead Fish")).toBeInTheDocument();
  });

  it("renders correct link destinations", () => {
    render(<Header />);

    expect(screen.getByTestId("link-/")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("link-/config")).toHaveAttribute("href", "/config");
    expect(screen.getByTestId("link-/deadfish")).toHaveAttribute("href", "/deadfish");
  });

  it("marks Aquarium link as active when on home page", () => {
    mockLocation.pathname = "/";
    render(<Header />);

    const aquariumLink = screen.getByTestId("link-/");
    expect(aquariumLink).toHaveClass("nav-link-active");
  });

  it("marks Config link as active when on config page", () => {
    mockLocation.pathname = "/config";
    render(<Header />);

    const configLink = screen.getByTestId("link-/config");
    expect(configLink).toHaveClass("nav-link-active");

    const aquariumLink = screen.getByTestId("link-/");
    expect(aquariumLink).not.toHaveClass("nav-link-active");
  });

  it("marks Dead Fish link as active when on deadfish page", () => {
    mockLocation.pathname = "/deadfish";
    render(<Header />);

    const deadFishLink = screen.getByTestId("link-/deadfish");
    expect(deadFishLink).toHaveClass("nav-link-active");

    const aquariumLink = screen.getByTestId("link-/");
    expect(aquariumLink).not.toHaveClass("nav-link-active");
  });

  it("all links have nav-link class", () => {
    render(<Header />);

    expect(screen.getByTestId("link-/")).toHaveClass("nav-link");
    expect(screen.getByTestId("link-/config")).toHaveClass("nav-link");
    expect(screen.getByTestId("link-/deadfish")).toHaveClass("nav-link");
  });

  it("navigates to brand page on logo right-click", () => {
    render(<Header />);

    const logo = screen.getByAltText("Logo");
    fireEvent.contextMenu(logo);

    expect(mockNavigate).toHaveBeenCalledWith("/brand");
  });

  it("prevents default context menu on logo right-click", () => {
    render(<Header />);

    const logo = screen.getByAltText("Logo");
    const event = fireEvent.contextMenu(logo);

    // The event should have been prevented (contextMenu returns false when preventDefault is called)
    expect(event).toBe(false);
  });

  it("logo has cursor pointer style", () => {
    render(<Header />);

    const logo = screen.getByAltText("Logo");
    expect(logo).toHaveClass("cursor-pointer");
  });

  it("renders header with correct semantic element", () => {
    render(<Header />);

    const header = document.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("renders nav element for navigation", () => {
    render(<Header />);

    const nav = document.querySelector("nav");
    expect(nav).toBeInTheDocument();
  });

  it("title uses correct heading level", () => {
    render(<Header />);

    const h1 = document.querySelector("h1");
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("Observation Tank");
  });

  it("no link is active when on unknown page", () => {
    mockLocation.pathname = "/unknown";
    render(<Header />);

    expect(screen.getByTestId("link-/")).not.toHaveClass("nav-link-active");
    expect(screen.getByTestId("link-/config")).not.toHaveClass("nav-link-active");
    expect(screen.getByTestId("link-/deadfish")).not.toHaveClass("nav-link-active");
  });
});
