/**
 * ThemeContext — manages dark/light mode.
 *
 * Theme is stored in localStorage keyed by user ID so each user
 * gets their own preference. Falls back to "dark" (the default app style).
 *
 * Applying the theme: adds/removes class "light" on <html>.
 * Dark = no class (existing hardcoded dark styles work as-is).
 * Light = class "light" triggers CSS-variable overrides in index.css.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext(null);

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};

function storageKey(userId) {
  return userId ? `theme_${userId}` : "theme_guest";
}

function applyClass(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light");
  } else {
    document.documentElement.classList.remove("light");
  }
}

export const ThemeProvider = ({ userId, children }) => {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(storageKey(userId));
    return saved || "dark";
  });

  // Apply on mount and whenever userId changes (login/logout switches user)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(userId)) || "dark";
    setThemeState(saved);
    applyClass(saved);
  }, [userId]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem(storageKey(userId), t);
    applyClass(t);
  }, [userId]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
