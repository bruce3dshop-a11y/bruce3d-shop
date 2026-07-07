import { Link, useRoute } from "wouter";
import {
  Menu, X, User, Shield, LogOut, LogIn, Home, ShoppingBag, Tag,
  Image, Star, Search, Printer, ChevronRight, Zap, Calculator, Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

function LangToggle({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className={`flex items-center gap-1 text-xs font-bold transition-all px-2.5 py-1.5 rounded-lg border ${
        dark
          ? "text-white/50 hover:text-white border-white/10 hover:border-primary/40 hover:bg-primary/10"
          : "text-muted-foreground hover:text-foreground border-transparent hover:border-primary/20 hover:bg-primary/5"
      }`}
    >
      <span className={lang === "ru" ? (dark ? "text-primary font-black" : "text-foreground") : "opacity-35"}>RU</span>
      <span className="opacity-25">·</span>
      <span className={lang === "en" ? (dark ? "text-primary font-black" : "text-foreground") : "opacity-35"}>EN</span>
    </button>
  );
}

// Канвас-фон мобильного меню: дым + частицы + дождь
function MenuCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let id: number;
    let w = (c.width = c.offsetWidth), h = (c.height = c.offsetHeight);

    // Smoke orbs (неоновый дым)
    const smoke = [
      { xF: 0.15, yF: 0.15, r: 160, color: "#7c3aed", phase: 0,   spd: 0.004 },
      { xF: 0.85, yF: 0.45, r: 140, color: "#9333ea", phase: 2.1, spd: 0.003 },
      { xF: 0.50, yF: 0.80, r: 120, color: "#a855f7", phase: 4.2, spd: 0.005 },
      { xF: 0.10, yF: 0.65, r: 100, color: "#c026d3", phase: 1.5, spd: 0.006 },
      { xF: 0.80, yF: 0.90, r: 110, color: "#6d28d9", phase: 3.3, spd: 0.004 },
    ].map(o => ({ ...o, x: w * o.xF, y: h * o.yF }));

    // Частицы
    const pts = Array.from({ length: 35 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.3 + 0.2, alpha: Math.random() * 0.45 + 0.1,
      tw: Math.random() * Math.PI * 2,
    }));

    // Мини цифровой дождь
    const FONT = 10;
    const GAP = FONT * 1.5;
    const cols = Math.floor(w / GAP);
    const rain = Array.from({ length: cols }, (_, i) => ({
      x: i * GAP + GAP / 2,
      y: Math.random() > 0.5 ? Math.random() * h : -Math.random() * h,
      speed: 0.6 + Math.random() * 1.4,
      alpha: 0.18 + Math.random() * 0.22,
      len: 8 + Math.floor(Math.random() * 8),
      chars: Array.from({ length: 16 }, () => Math.random() > 0.5 ? "1" : "0"),
    }));

    let t = 0;
    const draw = () => {
      t += 0.018;
      ctx.clearRect(0, 0, w, h);

      // ── Неоновый дым ──
      smoke.forEach(o => {
        for (let layer = 0; layer < 3; layer++) {
          const lr = o.r * (1 - layer * 0.28) * (1 + 0.1 * Math.sin(t * o.spd * 40 + layer));
          const lx = o.x + Math.sin(t * o.spd * 2.2 + o.phase + layer) * 25;
          const ly = o.y + Math.cos(t * o.spd * 1.8 + o.phase + layer) * 18;
          const ops = ["55","28","10"][layer];
          const opf = ["1a","0a","04"][layer];
          const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr);
          g.addColorStop(0, o.color + ops);
          g.addColorStop(0.45, o.color + opf);
          g.addColorStop(1, "transparent");
          ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx.fillStyle = g; ctx.fill();
        }
      });

      // ── Цифровой дождь ──
      ctx.save();
      ctx.font = `bold ${FONT}px monospace`;
      rain.forEach(col => {
        col.y += col.speed;
        if (col.y - col.len * FONT > h) {
          col.y = -FONT * (3 + Math.random() * 6);
          col.chars = Array.from({ length: 16 }, () => Math.random() > 0.5 ? "1" : "0");
        }
        col.chars.slice(0, col.len).forEach((ch, idx) => {
          const cy = col.y - idx * FONT;
          if (cy < -FONT || cy > h + FONT) return;
          const fade = 1 - idx / col.len;
          if (idx === 0) {
            ctx.shadowColor = "#e040fb"; ctx.shadowBlur = 8;
            ctx.globalAlpha = col.alpha; ctx.fillStyle = "#f0abfc";
          } else if (idx < 3) {
            ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 4;
            ctx.globalAlpha = col.alpha * 0.7; ctx.fillStyle = "#c084fc";
          } else {
            ctx.shadowBlur = 0;
            ctx.globalAlpha = col.alpha * fade * 0.4; ctx.fillStyle = "#7c3aed";
          }
          ctx.fillText(ch, col.x - FONT / 2, cy);
          ctx.shadowBlur = 0;
        });
      });
      ctx.restore();

      // ── Частицы ──
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.tw += 0.03;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.globalAlpha = p.alpha * (0.4 + 0.6 * Math.sin(p.tw));
        ctx.fillStyle = "#a855f7"; ctx.fill(); ctx.globalAlpha = 1;
      });

      id = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

const NAV_ITEMS = [
  { href: "/",           icon: Home,        labelKey: "home"       as const },
  { href: "/shop",       icon: ShoppingBag, labelKey: "shop"       as const },
  { href: "/services",   icon: Printer,     labelKey: "services"   as const },
  { href: "/prices",     icon: Tag,         labelKey: "prices"     as const },
  { href: "/gallery",    icon: Image,       labelKey: "gallery"    as const },
  { href: "/reviews",    icon: Star,        labelKey: "reviews"    as const },
  { href: "/calculator", icon: Calculator,  labelKey: "calculator" as const },
  { href: "/tracker",    icon: Search,      labelKey: "tracker"    as const },
];

// Иконка-цвет для каждого пункта
const ITEM_COLOR: Record<string, string> = {
  "/shop": "#f0abfc",
  "/gallery": "#c084fc",
  "/calculator": "#a78bfa",
};

function MobileNavItem({
  href, icon: Icon, label, index, onClick,
}: {
  href: string; icon: any; label: string; index: number; onClick: () => void;
}) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  const accent = ITEM_COLOR[href] || "#a855f7";

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.045, type: "spring", damping: 22, stiffness: 280 }}
    >
      <Link href={href} onClick={onClick}>
        <div className={`relative flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group overflow-hidden ${
          isActive ? "border border-primary/35" : "hover:bg-white/[0.04] border border-transparent"
        }`}
          style={isActive ? { background: `linear-gradient(120deg, ${accent}18 0%, ${accent}08 100%)` } : {}}
        >
          {/* Active neon left border */}
          {isActive && (
            <div
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
              style={{ background: `linear-gradient(180deg, ${accent}, ${accent}60)`, boxShadow: `0 0 8px ${accent}` }}
            />
          )}

          {/* Icon box */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${
              isActive ? "" : "group-hover:scale-105"
            }`}
            style={isActive
              ? { background: `linear-gradient(135deg, ${accent}35, ${accent}18)`, border: `1px solid ${accent}40`, boxShadow: `0 0 14px ${accent}22` }
              : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }
            }
          >
            <Icon
              className="w-4 h-4 transition-colors"
              style={{ color: isActive ? accent : "rgba(255,255,255,0.35)" }}
            />
          </div>

          {/* Label */}
          <span
            className="text-sm font-semibold transition-colors"
            style={{ color: isActive ? accent : "rgba(255,255,255,0.6)" }}
          >
            {label}
          </span>

          {/* Active dot indicator */}
          {isActive && (
            <div className="ml-auto flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: accent, boxShadow: `0 0 6px ${accent}` }}
              />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function MobileMenu({
  isOpen, onClose, user, isAdmin, activeCount, logout, t,
}: {
  isOpen: boolean; onClose: () => void;
  user: any; isAdmin: boolean; activeCount: number;
  logout: () => void; t: any; lang: string; setLang: (l: any) => void;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const initials = user?.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99] bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-[320px] max-w-[92vw] flex flex-col overflow-hidden"
            style={{ background: "linear-gradient(160deg, #0a0015 0%, #0f0022 55%, #0a0015 100%)" }}
          >
            {/* Animated canvas background */}
            <MenuCanvas />

            {/* Top border glow */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #9333ea60, #c084fc80, #9333ea60, transparent)" }}
            />
            {/* Left border glow */}
            <div
              className="absolute top-0 left-0 bottom-0 w-px"
              style={{ background: "linear-gradient(180deg, transparent, #7c3aed50, #a855f760, #7c3aed50, transparent)" }}
            />

            {/* Corner glow top-right */}
            <div className="absolute top-0 right-0 w-52 h-52 bg-primary/15 blur-[90px] rounded-full pointer-events-none" />
            {/* Corner glow bottom-left */}
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-violet-700/12 blur-[70px] rounded-full pointer-events-none" />

            {/* ── Header ── */}
            <div className="relative flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07]">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/30 blur-md rounded-full group-hover:bg-primary/40 transition-all" />
                  <img src="/logo.png" alt="BRUCE 3D SHOP" className="relative h-10 w-10 object-contain" />
                </div>
                <div>
                  <span className="text-sm font-black tracking-tight text-white leading-none block">
                    BRUCE <span className="text-primary" style={{ textShadow: "0 0 12px #a855f780" }}>3D</span> SHOP
                  </span>
                  <span className="text-[10px] text-white/25 font-medium tracking-widest uppercase">Studio</span>
                </div>
              </Link>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <X style={{ width: 16, height: 16, color: "rgba(255,255,255,0.5)" }} />
              </button>
            </div>

            {/* ── User block ── */}
            <div className="relative px-4 pt-3 pb-3 border-b border-white/[0.06]">
              {user ? (
                <div className="space-y-1">
                  <Link href="/dashboard" onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all group hover:bg-white/[0.04]"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all group-hover:scale-105"
                      style={{
                        background: "linear-gradient(135deg, #7c3aed40, #9333ea25)",
                        border: "1px solid #9333ea50",
                        boxShadow: "0 0 12px #9333ea20",
                        color: "#c084fc",
                      }}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{user.name}</div>
                      <div className="text-[11px] text-white/35">Личный кабинет</div>
                    </div>
                    {activeCount > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-[10px] font-black text-white px-2 py-0.5 rounded-full"
                        style={{ background: "linear-gradient(90deg, #7c3aed, #a855f7)", boxShadow: "0 0 10px #9333ea60" }}
                      >
                        {activeCount}
                      </motion.span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-500/8 w-full text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-white/25 group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="text-sm text-white/35 group-hover:text-red-400 transition-colors">{t.nav.logout}</span>
                  </button>
                </div>
              ) : (
                <Link href="/login" onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-primary/30 transition-colors">
                    <LogIn className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white/55 group-hover:text-white transition-colors">{t.nav.login}</div>
                    <div className="text-[11px] text-white/25">Войдите в аккаунт</div>
                  </div>
                </Link>
              )}
            </div>

            {/* ── Nav items ── */}
            <nav className="relative flex-1 overflow-y-auto px-3.5 py-3 space-y-0.5">
              {NAV_ITEMS.map(({ href, icon, labelKey }, i) => (
                <MobileNavItem
                  key={href}
                  href={href}
                  icon={icon}
                  label={t.nav[labelKey]}
                  index={i}
                  onClick={onClose}
                />
              ))}

              {isAdmin && (
                <>
                  <div className="my-3 mx-1" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(234,179,8,0.2), transparent)" }} />
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: NAV_ITEMS.length * 0.045 + 0.05 }}
                  >
                    <Link href="/admin" onClick={onClose}
                      className="flex items-center gap-3.5 px-3 py-3 rounded-xl hover:bg-yellow-500/8 transition-all group border border-transparent hover:border-yellow-500/20"
                    >
                      <div className="w-9 h-9 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0 group-hover:bg-yellow-500/18 transition-colors">
                        <Shield className="w-4 h-4 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-yellow-400/60 group-hover:text-yellow-400 transition-colors">{t.nav.admin}</span>
                    </Link>
                  </motion.div>
                </>
              )}

              <div className="flex items-center justify-between px-3 py-2 mt-1">
                <span className="text-[11px] text-white/20 font-medium">Язык</span>
                <LangToggle dark />
              </div>
            </nav>

            {/* ── CTA Button ── */}
            <div className="relative px-4 pb-7 pt-3 border-t border-white/[0.06]">
              <Link href="/order" onClick={onClose}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative w-full rounded-2xl overflow-hidden group"
                  style={{ height: 54 }}
                >
                  {/* Gradient background */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(120deg, #6d28d9 0%, #9333ea 50%, #7c3aed 100%)" }}
                  />
                  {/* Shimmer */}
                  <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)" }}
                  />
                  {/* Glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ boxShadow: "0 0 30px #9333ea80 inset" }}
                  />
                  {/* Border glow */}
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ border: "1px solid rgba(192,132,252,0.4)", boxShadow: "0 0 20px #9333ea40" }}
                  />
                  <div className="relative flex items-center justify-center gap-2 text-white font-black text-sm tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    {t.nav.order}
                  </div>
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DesktopNavLink({ href, label }: { href: string; label: string }) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  return (
    <Link href={href} className="relative group">
      <span className={`text-sm font-medium transition-all duration-200 ${
        isActive ? "text-primary" : "text-muted-foreground hover:text-white"
      }`}>
        {label}
      </span>
      {/* Underline glow */}
      <div
        className={`absolute -bottom-0.5 left-0 right-0 h-px rounded-full transition-all duration-300 ${
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50"
        }`}
        style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }}
      />
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<{ orders: { status: string }[] }>("orders/my"),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const activeCount = ordersData?.orders?.filter(
    o => !["completed","rejected","confirmed","cancelled"].includes(o.status)
  ).length ?? 0;

  const links = [
    { href: "/",           label: t.nav.home },
    { href: "/shop",       label: t.nav.shop },
    { href: "/services",   label: t.nav.services },
    { href: "/prices",     label: t.nav.prices },
    { href: "/gallery",    label: t.nav.gallery },
    { href: "/reviews",    label: t.nav.reviews },
    { href: "/calculator", label: t.nav.calculator },
    { href: "/tracker",    label: t.nav.tracker },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(8,0,20,0.92)"
            : "rgba(5,0,14,0.75)",
          backdropFilter: "blur(20px)",
          borderBottom: scrolled
            ? "1px solid rgba(147,51,234,0.2)"
            : "1px solid rgba(147,51,234,0.08)",
          boxShadow: scrolled
            ? "0 4px 30px rgba(120,50,200,0.12)"
            : "none",
        }}
      >
        {/* Top neon line */}
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-60"
          style={{ background: "linear-gradient(90deg, transparent 0%, #7c3aed 30%, #c084fc 50%, #7c3aed 70%, transparent 100%)" }}
        />

        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full blur-md transition-all duration-300 group-hover:opacity-80"
                style={{ background: "radial-gradient(circle, #9333ea40, transparent)" }}
              />
              <img src="/logo.png" alt="BRUCE 3D SHOP" className="relative h-11 w-11 object-contain" />
            </div>
            <span className="text-base font-black tracking-tight leading-none">
              BRUCE{" "}
              <span
                className="text-primary"
                style={{ textShadow: "0 0 16px #a855f760, 0 0 32px #7c3aed30" }}
              >
                3D
              </span>{" "}
              SHOP
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {links.map(l => <DesktopNavLink key={l.href} {...l} />)}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-1.5">
            <LangToggle />
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-yellow-400/60 hover:text-yellow-400 text-xs px-2 hover:bg-yellow-500/8">
                  <Shield className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5 relative hover:bg-primary/10 hover:text-primary">
                    <User className="w-4 h-4" />
                    {user.name.split(" ")[0]}
                    {activeCount > 0 && (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.8 }}
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary"
                        style={{ boxShadow: "0 0 6px #a855f7" }}
                      />
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost" size="sm"
                  className="gap-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/8"
                  onClick={() => logout()}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5 hover:text-primary hover:bg-primary/8">
                  <LogIn className="w-4 h-4" /> {t.nav.login}
                </Button>
              </Link>
            )}

            {/* CTA */}
            <Link href="/order">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex h-9 items-center gap-1.5 px-4 rounded-full text-sm font-bold text-white overflow-hidden group"
                style={{
                  background: "linear-gradient(120deg, #6d28d9, #9333ea, #7c3aed)",
                  boxShadow: "0 0 16px rgba(147,51,234,0.4)",
                }}
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)" }}
                />
                <Zap className="w-3.5 h-3.5 relative" />
                <span className="relative">{t.nav.order}</span>
              </motion.button>
            </Link>
          </div>

          {/* Mobile Toggle */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="md:hidden relative p-2 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(147,51,234,0.2)" }}
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5 text-white/70" />
            {activeCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"
                style={{ boxShadow: "0 0 6px #a855f7" }}
              />
            )}
          </motion.button>
        </div>
      </header>

      <MobileMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        isAdmin={isAdmin}
        activeCount={activeCount}
        logout={logout}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    </>
  );
}
