import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fc.theme";

export const THEME_PRESETS = [
  { value: "original", label: "Original" },
  { value: "light", label: "Claro profesional" },
  { value: "dark", label: "Oscuro" },
  { value: "gym", label: "Gimnasio" },
];

export const CUSTOMIZABLE_COLORS = [
  { key: "--color-bg", label: "Fondo" },
  { key: "--color-surface", label: "Superficie" },
  { key: "--color-text", label: "Texto" },
  { key: "--color-accent", label: "Acento" },
];

const ThemeContext = createContext(null);

function loadStoredTheme() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { preset: "original", overrides: {} };
    }
    const parsed = JSON.parse(raw);
    return {
      preset: parsed.preset || "original",
      overrides: parsed.overrides || {},
    };
  } catch (error) {
    return { preset: "original", overrides: {} };
  }
}

function applyTheme(preset, overrides) {
  document.documentElement.setAttribute("data-theme", preset);

  CUSTOMIZABLE_COLORS.forEach(({ key }) => {
    if (overrides[key]) {
      document.documentElement.style.setProperty(key, overrides[key]);
    } else {
      document.documentElement.style.removeProperty(key);
    }
  });
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(loadStoredTheme);

  useEffect(() => {
    applyTheme(theme.preset, theme.overrides);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (error) {
      // Ignore storage errors; the theme still applies for this session.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      preset: theme.preset,
      overrides: theme.overrides,
      setPreset: (preset) => setTheme((current) => ({ ...current, preset })),
      setOverride: (key, color) =>
        setTheme((current) => ({ ...current, overrides: { ...current.overrides, [key]: color } })),
      resetOverrides: () => setTheme((current) => ({ ...current, overrides: {} })),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  }

  return context;
}
