"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../providers/ThemeProvider";
export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={label}
      title={label}
      aria-pressed={theme === "dark"}
      onClick={toggle}
    >
      <Moon className="theme-icon-moon" size={18} strokeWidth={1.8} />
      <Sun className="theme-icon-sun" size={18} strokeWidth={1.8} />
    </button>
  );
}
