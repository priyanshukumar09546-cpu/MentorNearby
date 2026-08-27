import React from "react";
import StarsBackground from "./StarsBackground";
import { useTheme } from "../context/ThemeContext";

export default function GlobalStars({ show }) {
  const themeCtx = useTheme();
  const isVisible = show !== undefined ? show : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  if (!isVisible) return null;

  return <StarsBackground />;
}

