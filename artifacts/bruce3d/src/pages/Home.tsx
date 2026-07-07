import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Printer, PencilRuler, ScanLine, Wrench,
  CheckCircle, Clock, Star, Users, Calculator, Zap, Shield,
  ShoppingBag, Search, MessageSquare, Package,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { VideoBackground } from "@/components/VideoBackground";

const TELEGRAM_URL = "https://t.me/BRUCE_3D_SHOP_BOT";

function AnimatedCounter({ target, suffix = "", fixed = false }: { target: number; suffix?: string; fixed?: boolean }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (fixed) { setCount(target); return; }
    const duration = 1800, steps = 60, inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target, fixed]);
  return <>{fixed ? target.toFixed(1) : count.toLocaleString("ru")}{suffix}</>;
}

const ACCENT_COLORS = ["#c084fc", "#818cf8", "#22d3ee", "#f472b6", "#4ade80"] as const;

const services = [
  { num: "01", icon: <Printer className="w-6 h-6" />, title: "3D Печать", desc: "FDM и фотополимерная. PLA, PETG, ABS, TPU. Любая сложность.", href: "/services", accent: "#a855f7" },
  { num: "02", icon: <PencilRuler className="w-6 h-6" />, title: "3D Моделирование", desc: "По фото, чертежам, размерам. Реверс-инжиниринг деталей.", href: "/services", accent: "#3b82f6" },
  { num: "03", icon: <ScanLine className="w-6 h-6" />, title: "3D Сканирование", desc: "Высокоточное сканирование. Автозапчасти, техника, декор.", href: "/services", accent: "#06b6d4" },
  { num: "04", icon: <Wrench className="w-6 h-6" />, title: "Ремонт техники", desc: "3D принтеры и оборудование. Быстро и профессионально.", href: "/services", accent: "#10b981" },
];

const advantages = [
  { icon: <Zap className="w-5 h-5" />, title: "Срок от 24 часов", desc: "Быстрое производство без потери качества", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/15" },
  { icon: <Shield className="w-5 h-5" />, title: "Гарантия качества", desc: "Переделаем бесплатно, если что-то не так", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/15" },
  { icon: <Star className="w-5 h-5" />, title: "Рейтинг 5.0", desc: "Более 500 довольных клиентов", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/15" },
  { icon: <Calculator className="w-5 h-5" />, title: "Честные цены", desc: "Калькулятор онлайн, без скрытых платежей", color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/15" },
];

const quickActions = [
  { icon: <Calculator className="w-4 h-4" />, label: "Калькулятор", href: "/calculator", cls: "border-blue-500/30 bg-blue-500/8 text-blue-300 hover:bg-blue-500/18 hover:border-blue-400/55" },
  { icon: <ShoppingBag className="w-4 h-4" />, label: "Killer Bunny™", href: "/shop", cls: "border-purple-500/30 bg-purple-500/8 text-purple-300 hover:bg-purple-500/18 hover:border-purple-400/55" },
  { icon: <Search className="w-4 h-4" />, label: "Трекер", href: "/tracker", cls: "border-cyan-500/30 bg-cyan-500/8 text-cyan-300 hover:bg-cyan-500/18 hover:border-cyan-400/55" },
  { icon: <Star className="w-4 h-4" />, label: "Отзывы", href: "/reviews", cls: "border-yellow-500/30 bg-yellow-500/8 text-yellow-300 hover:bg-yellow-500/18 hover:border-yellow-400/55" },
  { icon: <Package className="w-4 h-4" />, label: "Галерея", href: "/gallery", cls: "border-green-500/30 bg-green-500/8 text-green-300 hover:bg-green-500/18 hover:border-green-400/55" },
  { icon: <MessageSquare className="w-4 h-4" />, label: "Telegram", href: TELEGRAM_URL, cls: "border-primary/30 bg-primary/8 text-primary hover:bg-primary/18 hover:border-primary/55", external: true },
];

export default function Home() {
  const { data: statsData } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiFetch<{ stats: Record<string, number> }>("stats"),
    staleTime: 60000,
  });

  const ordersCount = Math.max(100, statsData?.stats?.orders_count ?? 100);
  const clientsCount = Math.max(100, statsData?.stats?.clients_count ?? 100);

  const stats = [
    { value: clientsCount, suffix: "+", label: "Клиентов" },
    { value: ordersCount, suffix: "+", label: "Проектов" },
    { value: 5.0, suffix: "", label: "Рейтинг ★", fixed: true },
    { value: 24, suffix: "ч", label: "Срок от" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* ══════ HERO ══════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 pt-6 pb-12">
        <VideoBackground />

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_40%,rgba(147,51,234,0.12),transparent)] pointer-events-none z-[1]" />
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-20" style={{
          backgroundImage: "linear-gradient(rgba(147,51,234,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.08) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }} />
        {/* Bottom fade-out */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[1]" />

        <div className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto">

          {/* Live pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 text-primary text-xs font-semibold mb-7 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
            Принимаем заказы • Москва и вся Россия
          </motion.div>

          {/* Floating logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, duration: 0.7 }}
            className="relative flex items-center justify-center w-[220px] h-[220px] md:w-[270px] md:h-[270px] mb-5"
          >
            <div className="absolute inset-0 rounded-full bg-violet-700/25 blur-3xl" />
            <div className="absolute inset-6 rounded-full bg-primary/20 blur-2xl animate-pulse" />
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full pointer-events-none"
              style={{ border: "1px dashed rgba(147,51,234,0.35)" }} />
            <motion.div animate={{ rotate: -360 }} transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: "1px solid rgba(192,132,252,0.18)" }} />
            {([0, 72, 144, 216, 288] as const).map((deg, i) => (
              <motion.div key={deg} className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ACCENT_COLORS[i],
                  boxShadow: `0 0 8px ${ACCENT_COLORS[i]}`,
                  top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 120}px - 4px)`,
                  left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 120}px - 4px)`,
                }}
                animate={{ scale: [0.8, 1.6, 0.8], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
            <motion.img src="/logo-wide.png" alt="BRUCE 3D SHOP — Killer Bunny™"
              animate={{ y: [0, -14, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 w-[170px] md:w-[210px] drop-shadow-[0_0_40px_rgba(147,51,234,0.8)]"
            />
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.55 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-1"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #c084fc 50%, #9333ea 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              filter: "drop-shadow(0 0 28px rgba(147,51,234,0.55))",
            }}
          >BRUCE 3D SHOP</motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
            className="text-xs md:text-sm font-bold tracking-[0.5em] uppercase mb-4"
            style={{ background: "linear-gradient(90deg,#a855f7,#e879f9,#818cf8,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >KILLER BUNNY™</motion.p>

          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
            className="text-muted-foreground text-sm md:text-base max-w-md mb-8 leading-relaxed"
          >
            Детали, прототипы, фигурки и корпуса — по фото, чертежам, образцам.<br />
            Срок от&nbsp;24&nbsp;часов. Отправляем по всей России и миру.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.37 }}
            className="flex flex-col sm:flex-row gap-3 mb-8 w-full max-w-xs sm:max-w-none justify-center"
          >
            <Link href="/order"
              className="group relative inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 text-sm font-black text-white overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all hover:scale-[1.04] hover:shadow-[0_0_50px_rgba(147,51,234,0.7)]">
              <span className="relative z-10 flex items-center gap-2">Оформить заказ <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/calculator"
              className="inline-flex h-12 items-center justify-center rounded-2xl border border-primary/35 bg-primary/8 px-8 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-primary hover:bg-primary/15 hover:scale-[1.04]">
              <Calculator className="mr-2 h-4 w-4 text-primary" /> Рассчитать стоимость
            </Link>
          </motion.div>

          {/* Quick-action pills */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
            className="flex flex-wrap gap-2 justify-center max-w-sm md:max-w-lg"
          >
            {quickActions.map((a, i) =>
              a.external ? (
                <a key={i} href={a.href} target="_blank" rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold backdrop-blur-sm transition-all hover:scale-105 ${a.cls}`}>
                  {a.icon}{a.label}
                </a>
              ) : (
                <Link key={i} href={a.href}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs font-semibold backdrop-blur-sm transition-all hover:scale-105 ${a.cls}`}>
                  {a.icon}{a.label}
                </Link>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* ══════ STATS BAR ══════ */}
      <section className="relative z-10 border-y border-purple-500/10">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/25 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-purple-500/10">
            {stats.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="flex flex-col items-center justify-center py-8 px-4 text-center"
              >
                <div className="text-3xl md:text-4xl font-black tabular-nums leading-none mb-1"
                  style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} fixed={s.fixed} />
                </div>
                <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section fade */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/10 to-transparent" />

      {/* ══════ KILLER BUNNY PROMO ══════ */}
      <section className="relative z-10 py-14 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/8 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative rounded-3xl overflow-hidden glass-card p-8 md:p-10"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-violet-700/8 blur-3xl pointer-events-none" />

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              <div className="w-52 shrink-0 mx-auto md:mx-0">
                <img src="/killer-bunny-catalog.png" alt="Killer Bunny™ Каталог"
                  className="w-full rounded-2xl object-cover shadow-[0_0_40px_rgba(147,51,234,0.4)]" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/12 border border-primary/25 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-3">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Эксклюзивно
                </div>
                <h2 className="text-2xl md:text-4xl font-black font-display uppercase mb-3">
                  KILLER BUNNY™<br /><span className="text-primary">Shop</span>
                </h2>
                <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-md leading-relaxed">
                  Коллекционные виниловые фигурки ручной работы. Series&nbsp;01 — First Edition.<br />
                  10 уникальных персонажей. Ограниченный тираж 200 штук.
                </p>
                <Link href="/shop"
                  className="inline-flex items-center gap-2 h-11 rounded-xl bg-primary px-6 text-sm font-bold text-white shadow-[0_0_20px_rgba(147,51,234,0.35)] transition-all hover:bg-primary/90 hover:scale-105">
                  <ShoppingBag className="w-4 h-4" /> Перейти в магазин <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/12 to-transparent" />

      {/* ══════ SERVICES ══════ */}
      <section className="relative z-10 py-14">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="flex items-end gap-4 mb-1">
              <h2 className="text-4xl md:text-5xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Услуги
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/35 to-transparent mb-2" />
            </div>
            <p className="text-muted-foreground text-xs">Полный цикл от идеи до готового изделия • Принимаем заказы из любой точки мира</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {services.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}>
                <Link href={s.href}
                  className="group relative flex flex-col gap-4 p-6 rounded-2xl glass-card glass-card-hover h-full overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${s.accent}50, transparent)` }} />
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: `${s.accent}18`, color: s.accent }}>
                      {s.icon}
                    </div>
                    <span className="text-4xl font-black opacity-10 group-hover:opacity-22 transition-opacity tabular-nums leading-none"
                      style={{ color: s.accent }}>{s.num}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1.5 group-hover:text-purple-200 transition-colors">{s.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: s.accent }}>
                    Подробнее <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/12 to-transparent" />

      {/* ══════ ADVANTAGES ══════ */}
      <section className="relative z-10 py-14">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10">
            <div className="flex items-end gap-4 mb-1">
              <h2 className="text-4xl md:text-5xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Почему мы
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/35 to-transparent mb-2" />
            </div>
            <p className="text-muted-foreground text-xs">Работаем по всей России и отправляем за рубеж</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {advantages.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -14 : 14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className={`flex items-start gap-4 p-6 rounded-2xl glass-card glass-card-hover transition-all`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${a.color} ${a.bg} border ${a.border}`}>{a.icon}</div>
                <div>
                  <div className="font-bold text-white text-sm mb-1.5">{a.title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{a.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/12 to-transparent" />

      {/* ══════ TOOLS ══════ */}
      <section className="relative z-10 py-14">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
        <div className="relative z-10 container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
            <div className="flex items-end gap-4 mb-1">
              <h2 className="text-4xl md:text-5xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Инструменты
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/35 to-transparent mb-2" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="group flex flex-col gap-5 p-7 rounded-2xl glass-card glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/12 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Трекер заказов</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Отслеживайте статус в реальном времени</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Введите номер заказа — узнайте где ваше изделие прямо сейчас. Обновления каждые 30 секунд.
              </p>
              <Link href="/tracker"
                className="inline-flex items-center gap-2 h-10 self-start rounded-xl border border-cyan-500/35 bg-cyan-500/8 px-5 text-xs font-bold text-cyan-400 transition-all hover:bg-cyan-500/18 hover:border-cyan-400 hover:scale-[1.02]">
                <Search className="w-3.5 h-3.5" /> Открыть трекер
              </Link>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.07 }}
              className="group flex flex-col gap-5 p-7 rounded-2xl glass-card glass-card-hover relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Калькулятор стоимости</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Рассчитайте за 30 секунд</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Укажите материал, вес и качество печати — получите точную стоимость без скрытых платежей.
              </p>
              <Link href="/calculator"
                className="inline-flex items-center gap-2 h-10 self-start rounded-xl bg-primary px-5 text-xs font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all hover:bg-primary/90 hover:scale-[1.02]">
                <Calculator className="w-3.5 h-3.5" /> Открыть калькулятор
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════ FINAL CTA ══════ */}
      <section className="relative py-28 overflow-hidden">
        <VideoBackground subtle />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60 pointer-events-none z-[1]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(147,51,234,0.12),transparent)] pointer-events-none z-[1]" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.93 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-semibold mb-6">
              <Zap className="w-3 h-3" /> Работаем 7 дней в неделю
            </div>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black font-display uppercase mb-5 leading-tight">
              ОТ ИДЕИ ДО<br />
              <span style={{ background: "linear-gradient(90deg,#c084fc,#9333ea)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 20px rgba(147,51,234,0.5))" }}>
                ГОТОВОГО РЕЗУЛЬТАТА
              </span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
              Воплощаем ваши идеи в реальность. Принимаем заказы из любой точки мира.
              Пришлите файл или опишите задачу — рассчитаем стоимость бесплатно.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/order"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-base font-bold text-white shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(147,51,234,0.7)]">
                Заказать сейчас <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/gallery"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/8 backdrop-blur-sm px-10 text-base font-semibold text-white transition-all hover:border-primary/45 hover:bg-primary/14">
                Галерея работ
              </Link>
              <Link href="/shop"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-purple-500/35 bg-purple-500/8 backdrop-blur-sm px-10 text-base font-semibold text-purple-300 transition-all hover:border-purple-400 hover:bg-purple-500/15">
                <ShoppingBag className="mr-2 h-5 w-5" /> Killer Bunny™ Shop
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
