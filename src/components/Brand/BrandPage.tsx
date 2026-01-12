import React from "react";
import { Header } from "../Layout/Header";
import { Footer } from "../Layout/Footer";
import { EditableColorSwatch } from "./EditableColorSwatch";
import { useTheme } from "../../context/ThemeContext";
import { colorDescriptions } from "../../utils/colorUtils";

export function BrandPage(): React.ReactElement {
  const { resetAllColors, customColors } = useTheme();

  const hasCustomColors =
    Object.keys(customColors.dark || {}).length > 0 ||
    Object.keys(customColors.light || {}).length > 0;

  const handleDownload = (filename: string): void => {
    const link = document.createElement("a");
    link.href = `/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colorNames = Object.keys(colorDescriptions);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary text-text-primary font-sans">
      <Header />

      <div className="max-w-[900px] mx-auto px-5 py-10">
        <section className="section-card">
          <h2 className="m-0 mb-6 text-xl font-title tracking-[2px] text-accent-primary">
            Logo
          </h2>
          <div className="w-full h-48 bg-surface-secondary rounded-xl flex items-center justify-center p-6 mb-4">
            <img
              src="/logo.svg"
              alt="Logo"
              className="h-full object-contain"
              style={{ filter: "var(--logo-filter)" }}
            />
          </div>
          <div className="flex justify-center">
            <button
              onClick={() => handleDownload("logo.svg")}
              className="btn-primary"
            >
              Download SVG
            </button>
          </div>
        </section>

        <section className="section-card">
          <h2 className="m-0 mb-6 text-xl font-title tracking-[2px] text-accent-primary">
            Typography
          </h2>
          <div className="bg-surface-secondary rounded-xl p-6">
            <div className="mb-6">
              <h3 className="text-lg font-title tracking-[2px] text-text-primary mb-2">
                Title Font
              </h3>
              <p className="text-5xl font-title tracking-[2px] text-accent-primary mb-3">
                Nurse Holiday
              </p>
              <p className="text-text-secondary mb-4">
                Used for headings and titles throughout the application.
              </p>
              <button
                onClick={() => handleDownload("nurse-holiday.regular.otf")}
                className="btn-ping"
              >
                Download Font (OTF)
              </button>
            </div>
            <div className="pt-6 border-t border-border-secondary">
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Body Font
              </h3>
              <p className="text-2xl text-text-primary mb-3">Google Sans</p>
              <p className="text-text-secondary mb-4">
                Used for all body text throughout the application. Falls back to
                system fonts if unavailable.
              </p>
              <a
                href="https://fonts.google.com/specimen/Google+Sans"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ping inline-block no-underline"
              >
                View on Google Fonts
              </a>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="m-0 text-xl font-title tracking-[2px] text-accent-primary">
              Colors
            </h2>
            {hasCustomColors && (
              <button
                onClick={resetAllColors}
                className="text-sm text-error hover:text-error-light transition-colors"
              >
                Reset All Colors
              </button>
            )}
          </div>
          <p className="text-text-secondary mb-6">
            Click color swatches to edit. Changes are saved automatically and applied throughout the website.
          </p>

          <div className="mb-8">
            <h3 className="text-lg font-medium text-text-primary mb-4">
              Dark Theme (Deep Ocean)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {colorNames.map((name) => (
                <EditableColorSwatch
                  key={name + "-dark"}
                  name={name}
                  theme="dark"
                  description={colorDescriptions[name]}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-text-primary mb-4">
              Light Theme (Shallow Water)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {colorNames.map((name) => (
                <EditableColorSwatch
                  key={name + "-light"}
                  name={name}
                  theme="light"
                  description={colorDescriptions[name]}
                />
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
