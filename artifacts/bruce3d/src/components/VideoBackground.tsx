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

    const COLORS = ["#9333ea","#7c3aed","#a855f7","#c084fc","#e879f9","#d946ef"];
    const NUM_P = subtle ? 50 : 100;
    const particles = Array.from({ length: NUM_P }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 0.3,
      alpha: Math.random() * 0.45 + 0.1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      twinkle: Math.random() * Math.PI * 2,
    }));

    const orbs = [
      { xF: 0.18, yF: 0.38, r: subtle ? 160 : 280, color: "#9333ea", phase: 0, speed: 0.005 },
      { xF: 0.82, yF: 0.62, r: subtle ? 130 : 220, color: "#7c3aed", phase: 2.1, speed: 0.004 },
      { xF: 0.50, yF: 0.12, r: subtle ? 110 : 180, color: "#a855f7", phase: 4.2, speed: 0.007 },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    let t = 0;
    let gridOff = 0;

    const draw = () => {
      t += 0.016;
      gridOff += 0.4;
      if (gridOff > h / 14) gridOff = 0;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#04000a";
      ctx.fillRect(0, 0, w, h);

      orbs.forEach(o => {
        const pulse = Math.sin(t * o.speed * 60 + o.phase) * 0.18 + 1;
        const ox = o.x + Math.sin(t * 0.25 + o.phase) * 40;
        const oy = o.y + Math.cos(t * 0.2 + o.phase) * 25;
        const r = o.r * pulse;
        const grad = ctx.createRadialGradient(ox, oy, 0, ox, oy, r);
        grad.addColorStop(0, o.color + (subtle ? "44" : "66"));
        grad.addColorStop(0.5, o.color + (subtle ? "18" : "28"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      });

      if (!subtle) {
        ctx.save();
        const vx = w / 2, vy = h * 0.42;
        for (let i = 0; i <= 14; i++) {
          const ry = (i / 14) * h + gridOff;
          ctx.globalAlpha = 0.02 + (ry / h) * 0.08;
          ctx.strokeStyle = "#9333ea"; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(w, ry); ctx.stroke();
        }
        ctx.globalAlpha = 0.05;
        for (let i = 0; i <= 18; i++) {
          const bx = (i / 18) * w;
          ctx.strokeStyle = "#a855f7"; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, h); ctx.stroke();
        }
        ctx.restore();
      }

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        p.twinkle += 0.03;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(p.twinkle));
        ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147,51,234,${0.12 * (1 - d / 90)})`;
            ctx.lineWidth = 0.4; ctx.stroke();
          }
        }
      }

      const vig = ctx.createRadialGradient(w/2, h/2, h * 0.2, w/2, h/2, h);
      vig.addColorStop(0, "transparent"); vig.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", onResize); };
  }, [subtle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// ============================================================
//  GLOBAL BACKGROUND — все 6 эффектов одновременно
// ============================================================
export function GlobalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const isMobile = w < 768;

    // ── DIGITAL RAIN ──────────────────────────────────────────
    const FONT_SIZE = isMobile ? 12 : 14;
    const COL_GAP = FONT_SIZE * 1.6;

    interface RainCol { x: number; y: number; speed: number; chars: string[]; alpha: number; len: number; }
    let rain: RainCol[] = [];

    function initRain() {
      const count = Math.floor(w / COL_GAP);
      rain = Array.from({ length: count }, (_, i) => ({
        x: i * COL_GAP + COL_GAP / 2,
        y: Math.random() * h * -2,
        speed: 0.8 + Math.random() * 2.2,
        chars: Array.from({ length: 24 }, () => Math.random() > 0.5 ? "1" : "0"),
        alpha: 0.25 + Math.random() * 0.45,
        len: 14 + Math.floor(Math.random() * 12),
      }));
    }
    initRain();

    // ── PARTICLES (мышь + соединения) ─────────────────────────
    const PURPLE = ["#9333ea","#7c3aed","#a855f7","#c084fc","#d946ef","#e879f9"];
    const NUM_P = isMobile ? 55 : 130;
    const particles = Array.from({ length: NUM_P }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.38, vy: (Math.random() - 0.5) * 0.38,
      size: Math.random() * 2.2 + 0.4,
      alpha: Math.random() * 0.5 + 0.12,
      color: PURPLE[Math.floor(Math.random() * PURPLE.length)],
      twinkle: Math.random() * Math.PI * 2,
      baseVx: 0, baseVy: 0,
    }));
    particles.forEach(p => { p.baseVx = p.vx; p.baseVy = p.vy; });

    // ── КОСМОС: звёзды + боке ──────────────────────────────────
    const STARS = Array.from({ length: isMobile ? 120 : 260 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.3 + 0.1,
      alpha: Math.random() * 0.7 + 0.05,
      tw: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.025,
    }));

    const BOKEH = Array.from({ length: isMobile ? 8 : 18 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 25 + Math.random() * 90,
      alpha: 0.025 + Math.random() * 0.06,
      color: PURPLE[Math.floor(Math.random() * 3)],
      angle: Math.random() * Math.PI * 2,
      speed: 0.0005 + Math.random() * 0.001,
    }));

    // ── НЕОНОВЫЙ ДЫМ (smoke orbs) ─────────────────────────────
    const SMOKE = [
      { xF: 0.14, yF: 0.28, r: 290, color: "#7c3aed", phase: 0,   spd: 0.0035 },
      { xF: 0.82, yF: 0.65, r: 250, color: "#9333ea", phase: 2.1, spd: 0.0028 },
      { xF: 0.50, yF: 0.06, r: 210, color: "#a855f7", phase: 4.2, spd: 0.0055 },
      { xF: 0.90, yF: 0.18, r: 190, color: "#6d28d9", phase: 1.0, spd: 0.0045 },
      { xF: 0.06, yF: 0.84, r: 220, color: "#c026d3", phase: 3.3, spd: 0.003  },
      { xF: 0.62, yF: 0.92, r: 170, color: "#7c3aed", phase: 5.1, spd: 0.006  },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    // ── MESH GRADIENT WAVES ────────────────────────────────────
    const MESH = [
      { xF: 0.2,  yF: 0.25, r: 450, phase: 0,            spd: 0.0025 },
      { xF: 0.8,  yF: 0.75, r: 400, phase: Math.PI,      spd: 0.002  },
      { xF: 0.5,  yF: 0.5,  r: 350, phase: Math.PI / 2,  spd: 0.003  },
      { xF: 0.15, yF: 0.85, r: 300, phase: Math.PI * 1.5,spd: 0.0035 },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    // ── СЕТКА (perspective grid) ───────────────────────────────
    let gridOff = 0;

    // ── SHOOTING STARS ─────────────────────────────────────────
    interface SStar { x: number; y: number; speed: number; alpha: number; active: boolean; timer: number; }
    const SSTARS: SStar[] = Array.from({ length: 6 }, () => ({
      x: 0, y: 0, speed: 0, alpha: 0, active: false, timer: Math.random() * 250,
    }));
    function resetSStar(s: SStar) {
      s.x = Math.random() * w; s.y = Math.random() * h * 0.5;
      s.speed = 5 + Math.random() * 10; s.alpha = 0.8; s.active = true;
      s.timer = 100 + Math.random() * 280;
    }

    let t = 0;
    let frame = 0;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initRain();
    };
    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });

    const draw = () => {
      t += 0.016;
      frame++;
      gridOff += 0.45;
      if (gridOff > h / 13) gridOff = 0;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#03000c";
      ctx.fillRect(0, 0, w, h);

      // ═══ 4. MESH GRADIENT WAVES ═══
      MESH.forEach((m, i) => {
        const px = m.x + Math.sin(t * m.spd * 4 + m.phase) * w * 0.18;
        const py = m.y + Math.cos(t * m.spd * 3 + m.phase) * h * 0.14;
        const r = m.r * (1 + 0.08 * Math.sin(t * 0.6 + i));
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r);
        const pairs = [
          ["#4c1d9528","#7c3aed10"],
          ["#6d28d920","#9333ea0c"],
          ["#7c3aed1a","#a855f708"],
          ["#5b21b618","#6d28d908"],
        ];
        const [c0, c1] = pairs[i];
        grad.addColorStop(0, c0);
        grad.addColorStop(0.45, c1);
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      });

      // White shimmer highlight
      const wx = w * 0.5 + Math.sin(t * 0.28) * w * 0.22;
      const wy = h * 0.32 + Math.cos(t * 0.18) * h * 0.12;
      const wg = ctx.createRadialGradient(wx, wy, 0, wx, wy, 280);
      wg.addColorStop(0, "rgba(255,255,255,0.035)");
      wg.addColorStop(0.5, "rgba(220,170,255,0.012)");
      wg.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(wx, wy, 280, 0, Math.PI * 2);
      ctx.fillStyle = wg; ctx.fill();

      // ═══ 3. НЕОНОВЫЙ ДЫМ ═══
      SMOKE.forEach(o => {
        const pulse = 1 + 0.14 * Math.sin(t * o.spd * 50 + o.phase);
        const dx = Math.sin(t * o.spd * 2.5 + o.phase) * 70;
        const dy = Math.cos(t * o.spd * 2 + o.phase) * 45;
        const ox = o.x + dx, oy = o.y + dy;

        for (let layer = 0; layer < 4; layer++) {
          const lr = o.r * pulse * (1 - layer * 0.2);
          const lx = ox + Math.sin(t * 0.6 + layer * 1.1 + o.phase) * 35;
          const ly = oy + Math.cos(t * 0.45 + layer * 0.9 + o.phase) * 25;
          const opacity = ["55","28","18","0c"][layer];
          const fade    = ["1a","0c","06","03"][layer];
          const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
          grad.addColorStop(0, o.color + opacity);
          grad.addColorStop(0.35, o.color + fade);
          grad.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx.fillStyle = grad; ctx.fill();
        }
      });

      // ═══ 6. КОСМОС: боке ═══
      BOKEH.forEach(b => {
        b.angle += b.speed;
        const bx = b.x + Math.cos(b.angle) * 35;
        const by = b.y + Math.sin(b.angle) * 22;
        const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
        grad.addColorStop(0, b.color + "1e");
        grad.addColorStop(0.5, b.color + "08");
        grad.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      });

      // ═══ 1. АНИМИРОВАННАЯ СЕТКА ═══
      ctx.save();
      const vx = w / 2, vy = h * 0.44;
      const HLINES = 15;
      for (let i = 0; i <= HLINES; i++) {
        const ry = (i / HLINES) * h + gridOff;
        const prog = ry / h;
        ctx.globalAlpha = 0.012 + prog * 0.065;
        ctx.strokeStyle = "#8b21e8"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(w, ry); ctx.stroke();
      }
      const VLINES = isMobile ? 14 : 24;
      for (let i = 0; i <= VLINES; i++) {
        const bx = (i / VLINES) * w;
        const centre = 1 - Math.abs(i / VLINES - 0.5) * 2;
        ctx.globalAlpha = 0.018 + centre * 0.042;
        ctx.strokeStyle = "#9b5de5"; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(bx, h); ctx.stroke();
      }
      ctx.restore();

      // ═══ 5. ЦИФРОВОЙ ДОЖДЬ ═══
      ctx.save();
      ctx.font = `bold ${FONT_SIZE}px 'Courier New', monospace`;

      rain.forEach(col => {
        col.y += col.speed;
        if (col.y - col.len * FONT_SIZE > h) {
          col.y = -FONT_SIZE * (5 + Math.random() * 10);
          col.speed = 0.8 + Math.random() * 2.2;
          col.len = 14 + Math.floor(Math.random() * 12);
          col.chars = Array.from({ length: 24 }, () => Math.random() > 0.5 ? "1" : "0");
          col.alpha = 0.25 + Math.random() * 0.45;
        }

        // случайно меняем символы
        if (frame % 7 === 0) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = Math.random() > 0.5 ? "1" : "0";
        }

        for (let idx = 0; idx < col.len; idx++) {
          const charY = col.y - idx * FONT_SIZE;
          if (charY < -FONT_SIZE || charY > h + FONT_SIZE) continue;

          const fadeRatio = idx / col.len;
          const char = col.chars[idx % col.chars.length];

          if (idx === 0) {
            // Ведущий символ — яркий с glow
            ctx.shadowColor = "#e040fb";
            ctx.shadowBlur = 14;
            ctx.globalAlpha = col.alpha;
            ctx.fillStyle = "#f5d0fe";
          } else if (idx < 4) {
            ctx.shadowColor = "#c026d3";
            ctx.shadowBlur = 6;
            ctx.globalAlpha = col.alpha * 0.82;
            ctx.fillStyle = "#d946ef";
          } else if (idx < 9) {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = col.alpha * (1 - fadeRatio) * 0.65;
            ctx.fillStyle = "#9333ea";
          } else {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = col.alpha * (1 - fadeRatio) * 0.28;
            ctx.fillStyle = "#4c1d95";
          }

          ctx.fillText(char, col.x - FONT_SIZE / 2, charY);
          ctx.shadowBlur = 0;
        }
      });
      ctx.restore();

      // ═══ SHOOTING STARS ═══
      SSTARS.forEach(s => {
        s.timer--;
        if (s.timer <= 0 && !s.active) resetSStar(s);
        if (s.active) {
          const tail = s.speed * 10;
          const sg = ctx.createLinearGradient(s.x - tail, s.y - tail, s.x, s.y);
          sg.addColorStop(0, "transparent");
          sg.addColorStop(1, `rgba(220,150,255,${s.alpha})`);
          ctx.beginPath(); ctx.moveTo(s.x - tail, s.y - tail); ctx.lineTo(s.x, s.y);
          ctx.strokeStyle = sg; ctx.lineWidth = 1.4; ctx.stroke();
          s.x += s.speed; s.y += s.speed * 0.45; s.alpha -= 0.012;
          if (s.alpha <= 0 || s.x > w) { s.active = false; s.timer = 100 + Math.random() * 300; }
        }
      });

      // ═══ 6. КОСМОС: звёзды ═══
      STARS.forEach(s => {
        s.tw += s.speed;
        const a = s.alpha * (0.35 + 0.65 * Math.sin(s.tw));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.globalAlpha = a;
        ctx.fillStyle = frame % 180 < 3 && Math.random() > 0.98 ? "#ffffff" : "#e9d5ff";
        ctx.fill(); ctx.globalAlpha = 1;
      });

      // ═══ 2. ЧАСТИЦЫ + СОЕДИНЕНИЯ + МЫШЬ ═══
      const mouse = mouseRef.current;

      particles.forEach(p => {
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 130 && mdist > 0) {
          const force = ((130 - mdist) / 130) * 0.025;
          p.vx += (mdx / mdist) * force;
          p.vy += (mdy / mdist) * force;
        }
        p.vx = p.vx * 0.985 + p.baseVx * 0.015;
        p.vy = p.vy * 0.985 + p.baseVy * 0.015;

        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

        p.twinkle += 0.028;
        const a = p.alpha * (0.45 + 0.55 * Math.sin(p.twinkle));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.globalAlpha = a; ctx.fillStyle = p.color; ctx.fill(); ctx.globalAlpha = 1;
      });

      // Соединения между частицами
      const CONN_DIST = isMobile ? 75 : 110;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONN_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147,51,234,${0.18 * (1 - d / CONN_DIST)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }

      // Соединения с мышью
      if (mouse.x > 0 && mouse.x < w) {
        particles.forEach(p => {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 160) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(200,120,255,${0.22 * (1 - d / 160)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        });

        // Glow под мышью
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 80);
        mg.addColorStop(0, "rgba(168,85,247,0.08)");
        mg.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 80, 0, Math.PI * 2);
        ctx.fillStyle = mg; ctx.fill();
      }

      // ═══ ВИНЬЕТКА ═══
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h);
      vig.addColorStop(0, "transparent");
      vig.addColorStop(1, "rgba(0,0,0,0.78)");
      ctx.fillStyle = vig; ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: -1 }}
    />
  );
}
