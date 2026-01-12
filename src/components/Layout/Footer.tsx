import React from "react";

export function Footer(): React.ReactElement {
  return (
    <footer className="text-center px-5 py-6 text-text-muted text-sm">
      <img
        src="/HovaLabsLogo.svg"
        alt="Hova Labs"
        className="h-8 w-auto mx-auto mb-2"
        style={{ filter: "var(--logo-filter)" }}
      />
      Powered by{" "}
      <a
        href="https://HovaLabs.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent-primary no-underline font-medium transition-colors duration-200 hover:text-accent-hover hover:underline"
      >
        Hova Labs
      </a>
    </footer>
  );
}
