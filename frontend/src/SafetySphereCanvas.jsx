import { useEffect, useRef } from "react";

/**
 * SafetySphereCanvas
 * 
 * Interactive 3D financial safety engine visualization.
 * Renders a floating translucent safety sphere, dual orbital cash-flow rings,
 * floating luminous particles, and central currency symbol.
 * Reacts smoothly to user mouse coordinates with spring damping.
 * Respects prefers-reduced-motion.
 */
export default function SafetySphereCanvas({ isSafe = true, recalculating = false }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", handleResize);

    // Mouse Parallax
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      mouseRef.current.targetX = (clientX - width / 2) / (width / 2);
      mouseRef.current.targetY = (clientY - height / 2) / (height / 2);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Generate orbiting financial particles
    const particleCount = 28;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        angle: (i / particleCount) * Math.PI * 2,
        speed: (prefersReducedMotion ? 0.001 : 0.006) + (i % 3) * 0.002,
        orbitRadius: 130 + (i % 5) * 14,
        size: 2 + (i % 3) * 1.5,
        opacity: 0.3 + (i % 4) * 0.2,
        z: Math.sin(i) * 30,
      });
    }

    let time = 0;

    const render = () => {
      time += prefersReducedMotion ? 0.005 : 0.018;

      // Mouse position spring interpolation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.06;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2 + mouseRef.current.x * 22;
      const centerY = height / 2 + mouseRef.current.y * 22;
      const radius = Math.min(width, height) * 0.26;

      // Dynamic palette based on safety state
      const primaryHue = isSafe ? [13, 122, 72] : [180, 35, 24]; // Emerald or Crimson
      const accentHue = isSafe ? [52, 211, 153] : [248, 113, 113];
      const glowRgba = `rgba(${primaryHue[0]}, ${primaryHue[1]}, ${primaryHue[2]}`;

      // 1. Outer Atmospheric Radial Glow Halo
      const ambientGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        radius * 0.2,
        centerX,
        centerY,
        radius * 2.2
      );
      ambientGlow.addColorStop(0, `${glowRgba}, 0.22)`);
      ambientGlow.addColorStop(0.5, `${glowRgba}, 0.08)`);
      ambientGlow.addColorStop(1, "rgba(8, 11, 9, 0)");

      ctx.fillStyle = ambientGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();

      // 2. Orbital Financial Rings (Behind Sphere)
      ctx.save();
      ctx.translate(centerX, centerY);
      const ringTiltX = 0.55 + mouseRef.current.y * 0.15;
      const ringTiltY = mouseRef.current.x * 0.2;

      // Ring A: Inflow Trajectory Orbit
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.55, radius * 0.75, ringTiltY, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${accentHue[0]}, ${accentHue[1]}, ${accentHue[2]}, 0.25)`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();

      // Ring B: Safety Boundary Horizon
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35, radius * 0.55, -ringTiltY * 0.8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${primaryHue[0]}, ${primaryHue[1]}, ${primaryHue[2]}, 0.4)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 12]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Orbiting Data Particles
      particles.forEach((p) => {
        p.angle += p.speed;
        const px = centerX + Math.cos(p.angle) * p.orbitRadius + mouseRef.current.x * 12;
        const py = centerY + Math.sin(p.angle) * (p.orbitRadius * ringTiltX) + mouseRef.current.y * 12;

        ctx.fillStyle = `rgba(${accentHue[0]}, ${accentHue[1]}, ${accentHue[2]}, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Subtle glowing halo around larger particles
        if (p.size > 3) {
          ctx.fillStyle = `rgba(${accentHue[0]}, ${accentHue[1]}, ${accentHue[2]}, 0.15)`;
          ctx.beginPath();
          ctx.arc(px, py, p.size * 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 4. The Translucent Financial Safety Sphere Body
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

      // Glassmorphic Internal Gradient
      const sphereGrad = ctx.createRadialGradient(
        centerX - radius * 0.35 + mouseRef.current.x * 10,
        centerY - radius * 0.35 + mouseRef.current.y * 10,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      sphereGrad.addColorStop(0, "rgba(255, 255, 255, 0.22)");
      sphereGrad.addColorStop(0.35, `${glowRgba}, 0.24)`);
      sphereGrad.addColorStop(0.75, "rgba(13, 20, 16, 0.85)");
      sphereGrad.addColorStop(1, "rgba(8, 11, 9, 0.95)");

      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Iridescent Rim Lighting
      ctx.strokeStyle = isSafe
        ? "rgba(52, 211, 153, 0.45)"
        : "rgba(248, 113, 113, 0.45)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Inner Light Glare Reflection
      const glareGrad = ctx.createRadialGradient(
        centerX - radius * 0.38 + mouseRef.current.x * 12,
        centerY - radius * 0.42 + mouseRef.current.y * 12,
        2,
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.7
      );
      glareGrad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
      glareGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.05)");
      glareGrad.addColorStop(1, "transparent");

      ctx.fillStyle = glareGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.95, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 5. Central Financial Glyph (Translucent Glowing ₹ inside core)
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(radius * 0.75)}px 'Plus Jakarta Sans', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = isSafe ? "#10b981" : "#ef4444";
      ctx.shadowBlur = 18;
      ctx.fillText("₹", centerX + mouseRef.current.x * 8, centerY + mouseRef.current.y * 8);
      ctx.restore();

      // 6. Recalculating Ring Pulse
      if (recalculating) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * (1.1 + Math.sin(time * 6) * 0.05), 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.stroke();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isSafe, recalculating]);

  return (
    <div className="safety-sphere-canvas-wrap">
      <canvas ref={canvasRef} className="safety-sphere-canvas" />
    </div>
  );
}
