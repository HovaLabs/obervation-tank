import { createContext, use, useState, useEffect, useCallback, useTransition, ReactNode } from "react";

// Type definitions
export type ThemeMode = "dark" | "light";

export interface ColorSet {
  "bg-primary": string;
  "bg-secondary": string;
  "bg-tertiary": string;
  "accent-primary": string;
  "accent-hover": string;
  "text-primary": string;
  "text-secondary": string;
  "text-muted": string;
  "success": string;
  "error": string;
  "error-light": string;
  [key: string]: string;
}

export interface ThemeColors {
  dark: ColorSet;
  light: ColorSet;
}

export interface CustomColors {
  dark: Partial<ColorSet>;
  light: Partial<ColorSet>;
}

export interface ThemeContextValue {
  customColors: CustomColors;
  currentTheme: ThemeMode;
  isUpdating: boolean;
  getColors: (theme: ThemeMode) => ColorSet;
  updateColor: (theme: ThemeMode, colorName: string, value: string) => void;
  resetColor: (theme: ThemeMode, colorName: string) => void;
  resetAllColors: () => void;
  isColorCustomized: (theme: ThemeMode, colorName: string) => boolean;
  getDefaultColor: (theme: ThemeMode, colorName: string) => string;
  defaultColors: ThemeColors;
}

// Default color definitions
const defaultColors: ThemeColors = {
  dark: {
    "bg-primary": "#0a1520",
    "bg-secondary": "#0d1f2d",
    "bg-tertiary": "#102535",
    "accent-primary": "#4fc3f7",
    "accent-hover": "#81d4fa",
    "text-primary": "#e8f4f8",
    "text-secondary": "#a0c4d4",
    "text-muted": "#6a9ab0",
    "success": "#00cc44",
    "error": "#e63946",
    "error-light": "#ff6b6b",
  },
  light: {
    "bg-primary": "#e8f4f8",
    "bg-secondary": "#d4e8f0",
    "bg-tertiary": "#c0dce8",
    "accent-primary": "#0077a8",
    "accent-hover": "#005580",
    "text-primary": "#0a1520",
    "text-secondary": "#1a3a4a",
    "text-muted": "#3a5a6a",
    "success": "#00884d",
    "error": "#c62828",
    "error-light": "#d32f2f",
  },
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

const getSystemTheme = (): ThemeMode =>
  window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(getSystemTheme);
  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    const saved = localStorage.getItem("observation-tank-colors");
    if (saved) {
      try {
        return JSON.parse(saved) as CustomColors;
      } catch {
        return { dark: {}, light: {} };
      }
    }
    return { dark: {}, light: {} };
  });

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = (e: MediaQueryListEvent) => {
      setCurrentTheme(e.matches ? "light" : "dark");
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // React 19: Use transition for non-blocking color updates
  const [isUpdating, startColorTransition] = useTransition();

  // Get merged colors (defaults + custom overrides)
  const getColors = useCallback((theme: ThemeMode): ColorSet => {
    return {
      ...defaultColors[theme],
      ...customColors[theme],
    } as ColorSet;
  }, [customColors]);

  // Update a single color with React 19 transition for smooth UI
  const updateColor = useCallback((theme: ThemeMode, colorName: string, value: string) => {
    startColorTransition(() => {
      setCustomColors((prev) => ({
        ...prev,
        [theme]: {
          ...(prev[theme] || {}),
          [colorName]: value,
        },
      }));
    });
  }, []);

  // Reset a single color to default
  const resetColor = useCallback((theme: ThemeMode, colorName: string) => {
    setCustomColors((prev) => {
      const newTheme = { ...(prev[theme] || {}) };
      delete newTheme[colorName];
      return {
        ...prev,
        [theme]: newTheme,
      };
    });
  }, []);

  // Reset all colors to defaults
  const resetAllColors = useCallback(() => {
    setCustomColors({ dark: {}, light: {} });
  }, []);

  // Check if a color has been customized
  const isColorCustomized = useCallback((theme: ThemeMode, colorName: string): boolean => {
    return customColors[theme]?.[colorName] !== undefined;
  }, [customColors]);

  // Get default color value
  const getDefaultColor = useCallback((theme: ThemeMode, colorName: string): string => {
    return defaultColors[theme][colorName];
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("observation-tank-colors", JSON.stringify(customColors));
  }, [customColors]);

  // Apply CSS variables to document root based on current theme
  useEffect(() => {
    const root = document.documentElement;
    const colors = getColors(currentTheme);

    Object.entries(colors).forEach(([name, value]) => {
      root.style.setProperty(`--${name}`, value);
    });
  }, [getColors, currentTheme]);

  const value: ThemeContextValue = {
    customColors,
    currentTheme,
    isUpdating,
    getColors,
    updateColor,
    resetColor,
    resetAllColors,
    isColorCustomized,
    getDefaultColor,
    defaultColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// React 19: Export context for use with the `use` hook
export { ThemeContext };

// React 19: Updated hook using the new `use` API for context
export function useTheme(): ThemeContextValue {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
