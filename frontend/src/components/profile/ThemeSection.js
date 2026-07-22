import { Palette } from "lucide-react";

import Card from "../ui/Card";
import { THEME_PRESETS, useTheme } from "../../context/ThemeContext";

const PREVIEW_GRADIENTS = {
  original: "linear-gradient(135deg, #17121c, #ac4f74)",
  light: "linear-gradient(135deg, #f5f6f8, #2563eb)",
  dark: "linear-gradient(135deg, #0c0c0d, #78787f)",
  gym: "linear-gradient(135deg, #121212, #ff3d00)",
};

function ThemeSection() {
  const { preset, setPreset } = useTheme();

  return (
    <Card glass>
      <div style={{ display: "grid", gap: "1rem" }}>
        <span className="fc-text-eyebrow">
          <Palette size={14} />
          Apariencia
        </span>
        <p className="fc-card-text">
          Elegi una paleta de colores para la app. Es una preferencia personal: solo cambia lo que ves vos.
        </p>

        <div className="fc-theme-swatch-grid">
          {THEME_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={`fc-theme-swatch ${preset === value ? "is-selected" : ""}`}
              aria-label={`Paleta ${value}`}
              onClick={() => setPreset(value)}
            >
              <span className="fc-theme-swatch__preview" style={{ background: PREVIEW_GRADIENTS[value] }} />
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}

export default ThemeSection;
