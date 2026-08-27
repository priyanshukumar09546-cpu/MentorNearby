import React, { useEffect, useRef } from "react";

export default function StarsBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // 180 crisp twinkling stars with distinct sizes & colors
    const starCount = 180;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.7, // 0.7px to 2.3px
      color: Math.random() > 0.35 ? "#FFFFFF" : "#FEF08A",
      alpha: Math.random() * 0.5 + 0.4,
      twinkleSpeed: (Math.random() * 0.015 + 0.005) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.alpha += s.twinkleSpeed;
        if (s.alpha >= 0.95) {
          s.alpha = 0.95;
          s.twinkleSpeed = -Math.abs(s.twinkleSpeed);
        } else if (s.alpha <= 0.25) {
          s.alpha = 0.25;
          s.twinkleSpeed = Math.abs(s.twinkleSpeed);
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      id="astrotalk-star-field"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        backgroundColor: "#000000",
        overflow: "hidden",
      }}
    >
      {/* 1. Canvas Layer - 100% Reliable Cross-Browser Twinkling Stars */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />

      {/* 2. Astrotalk Ambient Yellow Glow at Bottom-Left */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "600px",
          height: "500px",
          background: "radial-gradient(circle at 0% 100%, rgba(250, 204, 21, 0.18) 0%, rgba(250, 204, 21, 0.05) 45%, transparent 70%)",
          filter: "blur(25px)",
          pointerEvents: "none",
        }}
      />

      {/* 3. Subtle Amber Flare Top-Right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "450px",
          height: "350px",
          background: "radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 65%)",
          filter: "blur(25px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
