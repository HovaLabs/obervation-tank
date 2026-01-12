import React, { useRef } from "react";
import { useTheme, ThemeMode } from "../../context/ThemeContext";

interface EditableColorSwatchProps {
  name: string;
  theme: ThemeMode;
  description: string;
}

export function EditableColorSwatch({ name, theme, description }: EditableColorSwatchProps): React.ReactElement {
  const { getColors, updateColor, resetColor, isColorCustomized, getDefaultColor } = useTheme();
  const colorInputRef = useRef<HTMLInputElement>(null);
  const colors = getColors(theme);
  const value = colors[name];
  const isCustom = isColorCustomized(theme, name);
  const defaultValue = getDefaultColor(theme, name);

  const copyToClipboard = (): void => {
    navigator.clipboard.writeText(value);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateColor(theme, name, e.target.value);
  };

  const handleReset = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    resetColor(theme, name);
  };

  const openColorPicker = (): void => {
    colorInputRef.current?.click();
  };

  return (
    <div
      className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg transition-all duration-200 hover:bg-surface-tertiary"
    >
      <div className="relative">
        <div
          className="w-12 h-12 rounded-lg border border-border-secondary flex-shrink-0 cursor-pointer overflow-hidden"
          style={{ backgroundColor: value }}
          onClick={openColorPicker}
          title="Click to edit color"
        >
          <input
            ref={colorInputRef}
            type="color"
            value={value}
            onChange={handleColorChange}
            aria-label={`Color picker for ${description}`}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        {isCustom && (
          <button
            onClick={handleReset}
            className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full flex items-center justify-center text-white text-xs leading-none hover:bg-error-light transition-colors"
            title={`Reset to default (${defaultValue})`}
          >
            x
          </button>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="block text-sm font-medium text-text-primary">
            {name}
          </span>
          {isCustom && (
            <span className="text-xs px-1.5 py-0.5 bg-accent-primary text-bg-primary rounded">
              Custom
            </span>
          )}
        </div>
        <span className="block text-xs text-text-muted">{description}</span>
        <div className="flex items-center gap-2">
          <code
            className="text-xs text-accent-primary cursor-pointer hover:underline"
            onClick={copyToClipboard}
            title="Click to copy"
          >
            {value}
          </code>
          <button
            onClick={openColorPicker}
            className="text-xs text-text-muted hover:text-accent-primary transition-colors"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
