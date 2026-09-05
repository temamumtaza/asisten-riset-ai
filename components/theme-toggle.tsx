"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const themeEvent = "asisten-riset-theme-change";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(themeEvent, onStoreChange);
  return () => window.removeEventListener(themeEvent, onStoreChange);
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const stored = window.localStorage.getItem("asisten-riset-theme");
    const preferred =
      stored === "dark" || stored === "light"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = preferred;
    window.dispatchEvent(new Event(themeEvent));
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("asisten-riset-theme", next);
    window.dispatchEvent(new Event(themeEvent));
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Gunakan tema gelap" : "Gunakan tema terang"}
      aria-pressed={theme === "dark"}
    >
      {theme === "light" ? <Moon size={17} aria-hidden="true" /> : <Sun size={17} aria-hidden="true" />}
    </button>
  );
}
