import { describe, it, expect } from 'vitest';
import { generateRandomColor, hslToRgb, hslToHex, hexToHsl, colorDescriptions } from './colorUtils';

describe('generateRandomColor', () => {
  it('should return a valid HSL color string', () => {
    const color = generateRandomColor();
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it('should generate hue between 0 and 359', () => {
    for (let i = 0; i < 100; i++) {
      const color = generateRandomColor();
      const match = color.match(/hsl\((\d+),/);
      const hue = parseInt(match![1], 10);
      expect(hue).toBeGreaterThanOrEqual(0);
      expect(hue).toBeLessThan(360);
    }
  });

  it('should generate saturation between 75 and 100', () => {
    for (let i = 0; i < 100; i++) {
      const color = generateRandomColor();
      const match = color.match(/hsl\(\d+, (\d+)%,/);
      const saturation = parseInt(match![1], 10);
      expect(saturation).toBeGreaterThanOrEqual(75);
      expect(saturation).toBeLessThanOrEqual(100);
    }
  });

  it('should generate lightness between 45 and 65', () => {
    for (let i = 0; i < 100; i++) {
      const color = generateRandomColor();
      const match = color.match(/hsl\(\d+, \d+%, (\d+)%\)/);
      const lightness = parseInt(match![1], 10);
      expect(lightness).toBeGreaterThanOrEqual(45);
      expect(lightness).toBeLessThanOrEqual(65);
    }
  });

  it('should generate different colors on multiple calls', () => {
    const colors = new Set<string>();
    for (let i = 0; i < 50; i++) {
      colors.add(generateRandomColor());
    }
    // With random generation, we should get many unique colors
    expect(colors.size).toBeGreaterThan(40);
  });
});

describe('hslToRgb', () => {
  it('should convert red (hsl(0, 100%, 50%)) to RGB', () => {
    const rgb = hslToRgb('hsl(0, 100%, 50%)');
    expect(rgb[0]).toBeCloseTo(1, 1);
    expect(rgb[1]).toBeCloseTo(0, 1);
    expect(rgb[2]).toBeCloseTo(0, 1);
  });

  it('should convert green (hsl(120, 100%, 50%)) to RGB', () => {
    const rgb = hslToRgb('hsl(120, 100%, 50%)');
    expect(rgb[0]).toBeCloseTo(0, 1);
    expect(rgb[1]).toBeCloseTo(1, 1);
    expect(rgb[2]).toBeCloseTo(0, 1);
  });

  it('should convert blue (hsl(240, 100%, 50%)) to RGB', () => {
    const rgb = hslToRgb('hsl(240, 100%, 50%)');
    expect(rgb[0]).toBeCloseTo(0, 1);
    expect(rgb[1]).toBeCloseTo(0, 1);
    expect(rgb[2]).toBeCloseTo(1, 1);
  });

  it('should handle grayscale (saturation 0)', () => {
    const rgb = hslToRgb('hsl(0, 0%, 50%)');
    expect(rgb[0]).toBeCloseTo(0.5, 1);
    expect(rgb[1]).toBeCloseTo(0.5, 1);
    expect(rgb[2]).toBeCloseTo(0.5, 1);
  });

  it('should handle negative hue values', () => {
    const rgb = hslToRgb('hsl(-10, 100%, 50%)');
    // -10 degrees should be equivalent to 350 degrees (reddish)
    expect(rgb[0]).toBeGreaterThan(0.8);
    expect(rgb[2]).toBeGreaterThan(0);
  });

  it('should return fallback orange for invalid input', () => {
    const rgb = hslToRgb('invalid');
    expect(rgb).toEqual([1, 0.5, 0]);
  });

  it('should return fallback orange for undefined input', () => {
    const rgb = hslToRgb(undefined);
    expect(rgb).toEqual([1, 0.5, 0]);
  });

  it('should correctly convert a randomly generated color', () => {
    const color = generateRandomColor();
    const rgb = hslToRgb(color);

    // RGB values should be between 0 and 1
    expect(rgb[0]).toBeGreaterThanOrEqual(0);
    expect(rgb[0]).toBeLessThanOrEqual(1);
    expect(rgb[1]).toBeGreaterThanOrEqual(0);
    expect(rgb[1]).toBeLessThanOrEqual(1);
    expect(rgb[2]).toBeGreaterThanOrEqual(0);
    expect(rgb[2]).toBeLessThanOrEqual(1);
  });
});

describe('hslToHex', () => {
  it('should convert red (hsl(0, 100%, 50%)) to hex', () => {
    const hex = hslToHex('hsl(0, 100%, 50%)');
    expect(hex).toBe('#ff0000');
  });

  it('should convert green (hsl(120, 100%, 50%)) to hex', () => {
    const hex = hslToHex('hsl(120, 100%, 50%)');
    expect(hex).toBe('#00ff00');
  });

  it('should convert blue (hsl(240, 100%, 50%)) to hex', () => {
    const hex = hslToHex('hsl(240, 100%, 50%)');
    expect(hex).toBe('#0000ff');
  });

  it('should convert white (hsl(0, 0%, 100%)) to hex', () => {
    const hex = hslToHex('hsl(0, 0%, 100%)');
    expect(hex).toBe('#ffffff');
  });

  it('should convert black (hsl(0, 0%, 0%)) to hex', () => {
    const hex = hslToHex('hsl(0, 0%, 0%)');
    expect(hex).toBe('#000000');
  });

  it('should convert gray (hsl(0, 0%, 50%)) to hex', () => {
    const hex = hslToHex('hsl(0, 0%, 50%)');
    expect(hex).toBe('#808080');
  });

  it('should return fallback hex for undefined input', () => {
    const hex = hslToHex(undefined);
    expect(hex).toBe('#ff8000'); // Fallback orange [1, 0.5, 0]
  });

  it('should return fallback hex for null input', () => {
    const hex = hslToHex(null);
    expect(hex).toBe('#ff8000');
  });

  it('should return fallback hex for invalid input', () => {
    const hex = hslToHex('invalid');
    expect(hex).toBe('#ff8000');
  });

  it('should produce valid hex format', () => {
    const hex = hslToHex(generateRandomColor());
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('hexToHsl', () => {
  it('should convert red (#ff0000) to HSL', () => {
    const hsl = hexToHsl('#ff0000');
    expect(hsl).toBe('hsl(0, 100%, 50%)');
  });

  it('should convert green (#00ff00) to HSL', () => {
    const hsl = hexToHsl('#00ff00');
    expect(hsl).toBe('hsl(120, 100%, 50%)');
  });

  it('should convert blue (#0000ff) to HSL', () => {
    const hsl = hexToHsl('#0000ff');
    expect(hsl).toBe('hsl(240, 100%, 50%)');
  });

  it('should convert white (#ffffff) to HSL', () => {
    const hsl = hexToHsl('#ffffff');
    expect(hsl).toBe('hsl(0, 0%, 100%)');
  });

  it('should convert black (#000000) to HSL', () => {
    const hsl = hexToHsl('#000000');
    expect(hsl).toBe('hsl(0, 0%, 0%)');
  });

  it('should handle hex without # prefix', () => {
    const hsl = hexToHsl('ff0000');
    expect(hsl).toBe('hsl(0, 100%, 50%)');
  });

  it('should handle uppercase hex', () => {
    const hsl = hexToHsl('#FF0000');
    expect(hsl).toBe('hsl(0, 100%, 50%)');
  });

  it('should return fallback for invalid hex', () => {
    const hsl = hexToHsl('invalid');
    expect(hsl).toBe('hsl(0, 80%, 50%)');
  });

  it('should return fallback for short hex format', () => {
    const hsl = hexToHsl('#fff');
    expect(hsl).toBe('hsl(0, 80%, 50%)');
  });

  it('should produce valid HSL format', () => {
    const hsl = hexToHsl('#abcdef');
    expect(hsl).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe('hslToHex and hexToHsl roundtrip', () => {
  it('should roundtrip primary colors correctly', () => {
    const colors = [
      'hsl(0, 100%, 50%)',   // red
      'hsl(120, 100%, 50%)', // green
      'hsl(240, 100%, 50%)', // blue
    ];

    for (const original of colors) {
      const hex = hslToHex(original);
      const backToHsl = hexToHsl(hex);
      expect(backToHsl).toBe(original);
    }
  });

  it('should approximately roundtrip random colors', () => {
    for (let i = 0; i < 20; i++) {
      const original = generateRandomColor();
      const hex = hslToHex(original);
      const backToHsl = hexToHsl(hex);

      // Parse both HSL strings to compare values
      const originalMatch = original.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);
      const roundtripMatch = backToHsl.match(/hsl\((\d+), (\d+)%, (\d+)%\)/);

      if (originalMatch && roundtripMatch) {
        const [, h1, s1, l1] = originalMatch.map(Number);
        const [, h2, s2, l2] = roundtripMatch.map(Number);

        // Allow small rounding differences (±1)
        expect(Math.abs(h1 - h2)).toBeLessThanOrEqual(1);
        expect(Math.abs(s1 - s2)).toBeLessThanOrEqual(1);
        expect(Math.abs(l1 - l2)).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('colorDescriptions', () => {
  it('should contain all expected color keys', () => {
    const expectedKeys = [
      'bg-primary',
      'bg-secondary',
      'bg-tertiary',
      'accent-primary',
      'accent-hover',
      'text-primary',
      'text-secondary',
      'text-muted',
      'success',
      'error',
      'error-light',
    ];

    for (const key of expectedKeys) {
      expect(colorDescriptions).toHaveProperty(key);
    }
  });

  it('should have non-empty string descriptions', () => {
    for (const [key, value] of Object.entries(colorDescriptions)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
