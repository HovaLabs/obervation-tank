// Theme color descriptions for the brand page
export const colorDescriptions: Record<string, string> = {
  "bg-primary": "Primary background",
  "bg-secondary": "Secondary background",
  "bg-tertiary": "Tertiary background",
  "accent-primary": "Primary accent",
  "accent-hover": "Accent hover state",
  "text-primary": "Primary text",
  "text-secondary": "Secondary text",
  "text-muted": "Muted text",
  "success": "Success green",
  "error": "Error red",
  "error-light": "Light error",
};

// Generate a random vibrant color for fish
export function generateRandomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 75 + Math.floor(Math.random() * 25); // 75-100%
  const lightness = 45 + Math.floor(Math.random() * 20);  // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// RGB tuple type for Three.js color
export type RGBTuple = [number, number, number];

// Convert HSL string to hex color for color picker
export function hslToHex(hslString: string | null | undefined): string {
  const rgb = hslToRgb(hslString);
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

// Convert hex color to HSL string
export function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "hsl(0, 80%, 50%)";

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

// Convert HSL string to RGB array for Three.js
export function hslToRgb(hslString: string | null | undefined): RGBTuple {
  if (!hslString) return [1, 0.5, 0]; // Fallback orange for undefined/null
  const match = hslString.match(/hsl\((-?\d+\.?\d*),\s*(\d+\.?\d*)%,\s*(\d+\.?\d*)%\)/);
  if (!match) return [1, 0.5, 0]; // Fallback orange

  const h = ((parseFloat(match[1]) % 360) + 360) % 360 / 360; // Normalize to 0-1
  const s = parseFloat(match[2]) / 100;
  const l = parseFloat(match[3]) / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r, g, b];
}
