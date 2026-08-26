import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

export default function StarField({ isDark }) {
  const canvasRef = useRef(null);
  const themeCtx = useTheme();
  const activeDark = isDark !== undefined ? isDark : (themeCtx?.isDark ?? themeCtx?.darkMode ?? true);

  useEffect(() => {
    if (!activeDark) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      a: Math.random() * 0.5 + 0.2,
      d: (Math.random() - 0.5) * 0.01,
    }));

    let anim;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        s.a += s.d;
        if (s.a <= 0.1 || s.a >= 0.8) s.d *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
        ctx.fill();
      });
      anim = requestAnimationFrame(draw);
    };

    draw();

    const resize = () => {
      if (!canvas) return;
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resize);
    return () => {
      if (anim) cancelAnimationFrame(anim);
      window.removeEventListener("resize", resize);
    };
  }, [activeDark]);

  if (!activeDark) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-60"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  );
}

