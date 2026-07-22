import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fc.theme";

export const THEME_PRESETS = ["original", "light", "dark", "gym"];

const ThemeContext = createContext(null);

function loadStoredPreset() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return THEME_PRESETS.includes(stored) ? stored : "original";
  } catch (error) {
    return "original";
  }
}

export function ThemeProvider({ children }) {
  const [preset, setPreset] = useState(loadStoredPreset);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", preset);

    try {
      window.localStorage.setItem(STORAGE_KEY, preset);
    } catch (error) {
      // Ignore storage errors; the theme still applies for this session.
    }
  }, [preset]);

  const value = useMemo(() => ({ preset, setPreset }), [preset]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider.");
  }

  return context;
}
