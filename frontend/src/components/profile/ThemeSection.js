import { Palette } from "lucide-react";

import Button from "../ui/Button";
import Card from "../ui/Card";
import { CUSTOMIZABLE_COLORS, THEME_PRESETS, useTheme } from "../../context/ThemeContext";

const PREVIEW_GRADIENTS = {
  original: "linear-gradient(135deg, #17121c, #ac4f74)",
  light: "linear-gradient(135deg, #f5f6f8, #2563eb)",
  dark: "linear-gradient(135deg, #0d0e10, #3b82f6)",
  gym: "linear-gradient(135deg, #121212, #ff3d00)",
};

const PRESET_DEFAULTS = {
  original: { "--color-bg": "#17121c", "--color-surface": "#241b2c", "--color-text": "#f2eef5", "--color-accent": "#ac4f74" },
  light: { "--color-bg": "#f5f6f8", "--color-surface": "#ffffff", "--color-text": "#111827", "--color-accent": "#2563eb" },
  dark: { "--color-bg": "#0d0e10", "--color-surface": "#17181b", "--color-text": "#f2f2f3", "--color-accent": "#3b82f6" },
  gym: { "--color-bg": "#121212", "--color-surface": "#1c1c1c", "--color-text": "#f5f5f5", "--color-accent": "#ff3d00" },
};

function ThemeSection() {
  const { preset, overrides, setPreset, setOverride, resetOverrides } = useTheme();

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Palette size={14} />
          Apariencia
        </span>
        <p className="fc-card-text">
          Elegi un tema para la app. Es una preferencia personal: solo cambia lo que ves vos.
        </p>

        <div className="fc-theme-swatch-grid">
          {THEME_PRESETS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`fc-theme-swatch ${preset === option.value ? "is-selected" : ""}`}
              onClick={() => setPreset(option.value)}
            >
              <span
                className="fc-theme-swatch__preview"
                style={{ background: PREVIEW_GRADIENTS[option.value] }}
              />
              <span className="fc-option-card__label">{option.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: "0.6rem" }}>
          <span className="fc-field__label">Personalizar colores (opcional)</span>
          <div className="fc-color-editor">
            {CUSTOMIZABLE_COLORS.map((color) => (
              <label className="fc-color-editor__field" key={color.key}>
                {color.label}
                <input
                  type="color"
                  value={overrides[color.key] || PRESET_DEFAULTS[preset][color.key]}
                  onChange={(event) => setOverride(color.key, event.target.value)}
                />
              </label>
            ))}
          </div>
          <Button variant="ghost" onClick={resetOverrides}>
            Restablecer colores del tema
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ThemeSection;
