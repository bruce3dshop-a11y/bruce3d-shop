import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  subtle?: boolean;
}

export function VideoBackground({ subtle = false }: VideoBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    // -------- PARTICLES --------
    const COLORS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#e879f9","#d946ef","#06b6d4","#818cf8"];
    const NUM_P = subtle ? 60 : 130;
    const particles = Array.from({ length: NUM_P }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * (subtle ? 0.2 : 0.4),
      vy: (Math.random() - 0.5) * (subtle ? 0.2 : 0.4),
      size: Math.random() * (subtle ? 1.6 : 2.5) + 0.3,
      alpha: Math.random() * 0.5 + 0.15,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));

    // -------- ORBS --------
    const orbs = [
      { xF: 0.18, yF: 0.38, r: subtle ? 180 : 300, color: "#9333ea", phase: 0,   speed: 0.006 },
      { xF: 0.82, yF: 0.62, r: subtle ? 150 : 250, color: "#7c3aed", phase: 2.1, speed: 0.004 },
      { xF: 0.50, yF: 0.12, r: subtle ? 120 : 200, color: "#a855f7", phase: 4.2, speed: 0.008 },
      { xF: 0.85, yF: 0.20, r: subtle ? 100 : 170, color: "#06b6d4", phase: 1.0, speed: 0.007 },
      { xF: 0.10, yF: 0.80, r: subtle ? 110 : 180, color: "#e879f9", phase: 3.3, speed: 0.005 },
      { xF: 0.60, yF: 0.88, r: subtle ? 90 : 150,  color: "#818cf8", phase: 5.1, speed: 0.009 },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    // -------- SHOOTING STARS --------
    interface Star { x: number; y: number; len: number; speed: number; alpha: number; active: boolean; timer: number; }
    const stars: Star[] = Array.from({ length: 8 }, () => ({
      x: 0, y: 0, len: 0, speed: 0, alpha: 0, active: false, timer: Math.random() * 200,
    }));
    function resetStar(s: Star) {
      s.x = Math.random() * w;
      s.y = Math.random() * h * 0.5;
      s.len = 80 + Math.random() * 180;
      s.speed = 6 + Math.random() * 10;
      s.alpha = 0.8 + Math.random() * 0.2;
      s.active = true;
      s.timer = 80 + Math.random() * 200;
    }

    // -------- AURORA WAVES --------
    const auroras = [
      { color: "#9333ea", phaseX: 0,   phaseY: 0,   amp: 0.06, freq: 0.004, speed: 0.012 },
      { color: "#06b6d4", phaseX: 2.0, phaseY: 1.0, amp: 0.05, freq: 0.003, speed: 0.009 },
      { color: "#e879f9", phaseX: 4.1, phaseY: 2.2, amp: 0.04, freq: 0.005, speed: 0.015 },
    ];

    // -------- HEXAGONS --------
    const hexes = Array.from({ length: subtle ? 6 : 16 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      size: Math.random() * 35 + 8,
      alpha: Math.random() * 0.06 + 0.02,
      phase: Math.random() * Math.PI * 2,
    }));

    function drawHex(cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    }

    // -------- RINGS --------
    const rings = Array.from({ length: 3 }, (_, i) => ({
      y: (h / 3) * i, speed: 0.5 + i * 0.15, alpha: 0.05 + i * 0.015,
    }));

    let t = 0;
    let gridOff = 0;

    const draw = () => {
      t += 0.016;
      gridOff += 0.4;
      if (gridOff > h / 14) gridOff = 0;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = subtle ? "#06000e" : "#04000a";
      ctx.fillRect(0, 0, w, h);

      // ---- AURORA WAVES ----
      if (!subtle) {
        auroras.forEach(au => {
          ctx.save();
          for (let y = 0; y < h; y += 4) {
            const nx = Math.sin(y * au.freq + t * au.speed + au.phaseX) * w * au.amp;
            const nx2 = Math.sin(y * au.freq * 1.3 + t * au.speed * 0.7 + au.phaseY) * w * au.amp * 0.5;
            const cx = w / 2 + nx + nx2;
            const alpha = 0.018 * Math.sin((y / h) * Math.PI);
            ctx.beginPath();
            ctx.arc(cx, y, 80, 0, Math.PI * 2);
            ctx.fillStyle = au.color;
            ctx.globalAlpha = alpha;
            ctx.fill();
          }
          ctx.restore();
        });
      }

      // ---- ORBS ----
      orbs.forEach(o => {
        const pulse = Math.sin(t * o.speed * 60 + o.phase) * 0.2 + 1;
        const drift = Math.sin(t * 0.3 + o.phase) * 40;
        const ox = o.x + drift;
        const oy = o.y + Math.cos(t * 0.2 + o.phase) * 25;
        const r = o.r * pulse;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        const op = subtle ? "33" : "55";
        const op2 = subtle ? "11" : "22";
        grad.addColorStop(0, o.color + op);
        grad.addColorStop(0.45, o.color + op2);
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // ---- PERSPECTIVE GRID ----
      if (!subtle) {
        ctx.save();
        const vx = w / 2, vy = h * 0.42;
        const HLINES = 16;
        for (let i = 0; i <= HLINES; i++) {
          const ry = (i / HLINES) * h + gridOff;
          const prog = ry / h;
          ctx.globalAlpha = 0.015 + Math.min(prog * 2.5, 1) * 0.1;
          ctx.strokeStyle = "#9333ea";
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(w, ry); ctx.stroke();
        }
        const VLINES = 20;
        ctx.globalAlpha = 0.06;
        for (let i = 0; i <= VLINES; i++) {
          const bx = (i / VLINES) * w;
          ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, h); ctx.stroke();
        }
        ctx.restore();
      }

      // ---- HEXAGONS ----
      hexes.forEach(hex => {
        const pulse = Math.sin(t * 0.8 + hex.phase) * 0.5 + 0.5;
        ctx.save();
        ctx.globalAlpha = hex.alpha * pulse;
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 0.8;
        drawHex(hex.x, hex.y, hex.size);
        ctx.stroke();
        ctx.restore();
      });

      // ---- SCANNER RINGS ----
      rings.forEach(ring => {
        ring.y += ring.speed;
        if (ring.y > h + 60) ring.y = -60;
        const sg = ctx.createLinearGradient(0, ring.y - 40, 0, ring.y + 8);
        sg.addColorStop(0, "transparent");
        sg.addColorStop(0.6, `rgba(147,51,234,${ring.alpha * 0.5})`);
        sg.addColorStop(1, `rgba(168,85,247,${ring.alpha})`);
        ctx.fillStyle = sg;
        ctx.fillRect(0, ring.y - 40, w, 48);
      });

      // ---- LASER SCAN ----
      if (!subtle) {
        const scanY = (t * 50) % (h * 1.5);
        if (scanY < h) {
          const sg2 = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 4);
          sg2.addColorStop(0, "transparent");
          sg2.addColorStop(0.8, "#9333ea08");
          sg2.addColorStop(1, "#c084fc22");
          ctx.fillStyle = sg2;
          ctx.fillRect(0, scanY - 60, w, 64);
        }
      }

      // ---- SHOOTING STARS ----
      if (!subtle) {
        stars.forEach(s => {
          s.timer--;
          if (s.timer <= 0 && !s.active) resetStar(s);
          if (s.active) {
            const tail = Math.min(s.len, s.speed * 6);
            const grad = ctx.createLinearGradient(s.x - tail, s.y - tail, s.x, s.y);
            grad.addColorStop(0, "transparent");
            grad.addColorStop(1, `rgba(192,132,252,${s.alpha})`);
            ctx.beginPath();
            ctx.moveTo(s.x - tail, s.y - tail);
            ctx.lineTo(s.x, s.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            s.x += s.speed;
            s.y += s.speed * 0.5;
            s.alpha -= 0.015;
            if (s.alpha <= 0 || s.x > w || s.y > h) {
              s.active = false;
              s.timer = 80 + Math.random() * 250;
            }
          }
        });
      }

      // ---- PARTICLES ----
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        p.twinkle += 0.035;
        const a = p.alpha * (0.55 + 0.45 * Math.sin(p.twinkle));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // ---- PARTICLE CONNECTIONS ----
      const maxDist = subtle ? 70 : 100;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147,51,234,${0.12 * (1 - d / maxDist)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // ---- CORNER ACCENTS ----
      const accentAlpha = 0.15 + 0.05 * Math.sin(t * 1.5);
      [[0,0],[w,0],[0,h],[w,h]].forEach(([cx,cy]) => {
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
        cg.addColorStop(0, `rgba(147,51,234,${accentAlpha})`);
        cg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fillStyle = cg; ctx.fill();
      });

      // ---- VIGNETTE ----
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.22, w / 2, h / 2, h * 0.95);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, subtle ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.78)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
    };
  }, [subtle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Global fixed background for all pages
export function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    const COLORS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#06b6d4","#e879f9"];
    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
      size: Math.random() * 1.8 + 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));

    const orbs = [
      { xF: 0.15, yF: 0.3,  r: 200, color: "#7c3aed", phase: 0,   speed: 0.005 },
      { xF: 0.85, yF: 0.65, r: 160, color: "#9333ea", phase: 2.1, speed: 0.004 },
      { xF: 0.5,  yF: 0.1,  r: 130, color: "#a855f7", phase: 4.2, speed: 0.007 },
      { xF: 0.9,  yF: 0.15, r: 110, color: "#06b6d4", phase: 1.0, speed: 0.006 },
      { xF: 0.1,  yF: 0.85, r: 120, color: "#e879f9", phase: 3.3, speed: 0.005 },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    const hexes = Array.from({ length: 10 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      size: Math.random() * 28 + 8,
      alpha: Math.random() * 0.04 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    function drawHex(cx: number, cy: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
        else ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
    }

    // Shooting stars
    interface Star { x: number; y: number; speed: number; alpha: number; active: boolean; timer: number; }
    const stars: Star[] = Array.from({ length: 5 }, () => ({
      x: 0, y: 0, speed: 0, alpha: 0, active: false, timer: Math.random() * 300,
    }));
    function resetStar(s: Star) {
      s.x = Math.random() * w; s.y = Math.random() * h * 0.6;
      s.speed = 5 + Math.random() * 8; s.alpha = 0.7; s.active = true;
      s.timer = 120 + Math.random() * 300;
    }

    let t = 0;

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#04000a";
      ctx.fillRect(0, 0, w, h);

      // Orbs
      orbs.forEach(o => {
        const pulse = Math.sin(t * o.speed * 60 + o.phase) * 0.18 + 1;
        const drift = Math.sin(t * 0.25 + o.phase) * 30;
        const ox = o.x + drift, oy = o.y + Math.cos(t * 0.2 + o.phase) * 20;
        const r = o.r * pulse;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        grad.addColorStop(0, o.color + "40");
        grad.addColorStop(0.5, o.color + "18");
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      });

      // Hexes
      hexes.forEach(hex => {
        const pulse = Math.sin(t * 0.7 + hex.phase) * 0.5 + 0.5;
        ctx.save(); ctx.globalAlpha = hex.alpha * pulse;
        ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 0.7;
        drawHex(hex.x, hex.y, hex.size); ctx.stroke(); ctx.restore();
      });

      // Shooting stars
      stars.forEach(s => {
        s.timer--;
        if (s.timer <= 0 && !s.active) resetStar(s);
        if (s.active) {
          const tail = s.speed * 8;
          const grad = ctx.createLinearGradient(s.x - tail, s.y - tail, s.x, s.y);
          grad.addColorStop(0, "transparent");
          grad.addColorStop(1, `rgba(192,132,252,${s.alpha})`);
          ctx.beginPath(); ctx.moveTo(s.x - tail, s.y - tail); ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = grad; ctx.lineWidth = 1.2; ctx.stroke();
          s.x += s.speed; s.y += s.speed * 0.4; s.alpha -= 0.013;
          if (s.alpha <= 0 || s.x > w) { s.active = false; s.timer = 120 + Math.random() * 300; }
        }
      });

      // Particles
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        p.twinkle += 0.03;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.twinkle));
        ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1;
      });

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 80) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147,51,234,${0.1 * (1 - d / 80)})`; ctx.lineWidth = 0.4; ctx.stroke();
          }
        }
      }

      // Corner accents
      [[0,0],[w,0],[0,h],[w,h]].forEach(([cx,cy]) => {
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
        cg.addColorStop(0, `rgba(147,51,234,0.12)`); cg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(cx, cy, 100, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();
      });

      // Vignette
      const vig = ctx.createRadialGradient(w/2, h/2, h * 0.2, w/2, h/2, h);
      vig.addColorStop(0, "transparent"); vig.addColorStop(1, "rgba(0,0,0,0.7)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: -1 }}
    />
  );
}
