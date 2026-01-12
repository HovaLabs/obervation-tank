import React, { MouseEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

interface NavLink {
  to: string;
  label: string;
}

export function Header(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinks: NavLink[] = [
    { to: "/", label: "Aquarium" },
    { to: "/config", label: "Config" },
    { to: "/deadfish", label: "Dead Fish" },
  ];

  return (
    <header className="flex justify-between items-center px-10 py-4 bg-header-bg border-b border-border-primary max-[600px]:flex-col max-[600px]:gap-3 max-[600px]:px-5">
      <div className="flex items-center gap-3 max-[600px]:order-1">
        <img
          src="/logo.svg"
          alt="Logo"
          className="h-8 w-auto max-[600px]:h-6 cursor-pointer"
          style={{ filter: "var(--logo-filter)" }}
          onContextMenu={(e: MouseEvent) => {
            e.preventDefault();
            navigate("/brand");
          }}
        />
        <h1 className="m-0 text-2xl font-title tracking-[2px] text-accent-primary">
          Observation Tank
        </h1>
      </div>
      <nav className="flex gap-2 max-[600px]:order-2 max-[600px]:w-full max-[600px]:justify-center">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${currentPath === link.to ? "nav-link-active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
