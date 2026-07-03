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
import servicesImg from "@assets/IMG_3676_1782231561624.jpeg";

const TELEGRAM_URL = "https://t.me/BRUCE_3D_SHOP_BOT";

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const duration = 1800;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString("ru")}{suffix}</>;
}

const services = [
  { icon: <Printer className="w-7 h-7" />, title: "3D Печать", desc: "FDM и фотополимерная. PLA, PETG, ABS, TPU. Любая сложность.", href: "/services" },
  { icon: <PencilRuler className="w-7 h-7" />, title: "3D Моделирование", desc: "По фото, чертежам, размерам. Реверс-инжиниринг деталей.", href: "/services" },
  { icon: <ScanLine className="w-7 h-7" />, title: "3D Сканирование", desc: "Высокоточное сканирование. Автозапчасти, техника, декор.", href: "/services" },
  { icon: <Wrench className="w-7 h-7" />, title: "Ремонт техники", desc: "3D принтеры и оборудование. Быстро и профессионально.", href: "/services" },
];

const advantages = [
  { icon: <Zap className="w-6 h-6" />, title: "Срок от 24 часов", desc: "Быстрое производство без потери качества" },
  { icon: <Shield className="w-6 h-6" />, title: "Гарантия качества", desc: "Переделаем бесплатно, если что-то не так" },
  { icon: <Star className="w-6 h-6" />, title: "Рейтинг 5.0", desc: "Более 500 довольных клиентов" },
  { icon: <Calculator className="w-6 h-6" />, title: "Честные цены", desc: "Калькулятор онлайн, без скрытых платежей" },
];

const quickActions = [
  { icon: <Calculator className="w-5 h-5" />, label: "Калькулятор", href: "/calculator", color: "border-blue-500/30 hover:border-blue-400/50 text-blue-400" },
  { icon: <ShoppingBag className="w-5 h-5" />, label: "Killer Bunny™", href: "/shop", color: "border-purple-500/30 hover:border-purple-400/50 text-purple-400" },
  { icon: <Search className="w-5 h-5" />, label: "Трекер", href: "/tracker", color: "border-cyan-500/30 hover:border-cyan-400/50 text-cyan-400" },
  { icon: <Star className="w-5 h-5" />, label: "Отзывы", href: "/reviews", color: "border-yellow-500/30 hover:border-yellow-400/50 text-yellow-400" },
  { icon: <Package className="w-5 h-5" />, label: "Галерея", href: "/gallery", color: "border-green-500/30 hover:border-green-400/50 text-green-400" },
  { icon: <MessageSquare className="w-5 h-5" />, label: "Telegram", href: TELEGRAM_URL, color: "border-primary/30 hover:border-primary/60 text-primary", external: true },
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
    { icon: <Users className="w-5 h-5" />, value: clientsCount, suffix: "+", label: "Клиентов" },
    { icon: <CheckCircle className="w-5 h-5" />, value: ordersCount, suffix: "+", label: "Проектов" },
    { icon: <Star className="w-5 h-5" />, value: 5.0, suffix: "", label: "Рейтинг", fixed: true },
    { icon: <Clock className="w-5 h-5" />, value: 24, suffix: "ч", label: "Срок от" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* ====== CINEMATIC HERO ====== */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <VideoBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-background/80 pointer-events-none z-[1]" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 py-24">
          <div className="text-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/50 bg-primary/10 text-primary text-sm font-semibold mb-5 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]" />
              Принимаем заказы • Москва и вся Россия
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-2"
              style={{
                background: "linear-gradient(135deg, #ffffff 0%, #c084fc 45%, #9333ea 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 32px rgba(147,51,234,0.7))",
              }}
            >
              BRUCE 3D SHOP
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.5 }}
              className="text-base md:text-lg font-bold tracking-[0.45em] uppercase mb-0"
              style={{
                background: "linear-gradient(90deg, #a855f7, #e879f9, #818cf8, #a855f7)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              KILLER BUNNY™
            </motion.p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
                className="mb-6 flex items-center justify-center lg:justify-start"
              >
                {/* Floating logo in glowing circle */}
                <div className="relative flex items-center justify-center w-[340px] h-[340px]">
                  {/* Deep glow layers */}
                  <div className="absolute inset-0 rounded-full bg-violet-700/25 blur-3xl" />
                  <div className="absolute inset-10 rounded-full bg-primary/20 blur-2xl animate-pulse" />

                  {/* Rotating dashed orbit ring */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full pointer-events-none"
                    style={{ border: "1px dashed rgba(147,51,234,0.35)" }}
                  />
                  {/* Counter-rotating solid ring */}
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ border: "1px solid rgba(192,132,252,0.18)" }}
                  />

                  {/* Orbit sparks */}
                  {[0, 72, 144, 216, 288].map((deg, i) => (
                    <motion.div
                      key={deg}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        background: ["#c084fc","#818cf8","#22d3ee","#f472b6","#4ade80"][i],
                        boxShadow: `0 0 8px ${["#c084fc","#818cf8","#22d3ee","#f472b6","#4ade80"][i]}`,
                        top: `calc(50% + ${Math.sin((deg * Math.PI) / 180) * 162}px - 4px)`,
                        left: `calc(50% + ${Math.cos((deg * Math.PI) / 180) * 162}px - 4px)`,
                      }}
                      animate={{ scale: [0.8, 1.5, 0.8], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ))}

                  {/* The logo — floats up and down */}
                  <motion.img
                    src="/logo-wide.png"
                    alt="BRUCE 3D SHOP — Killer Bunny™"
                    animate={{ y: [0, -18, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 w-[260px] drop-shadow-[0_0_50px_rgba(147,51,234,0.7)]"
                  />
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-muted-foreground max-w-lg mb-8 text-base md:text-lg leading-relaxed"
              >
                Изготавливаем детали, прототипы, фигурки и корпуса по фото, чертежам и образцам.
                Любая сложность. Срок от&nbsp;24 часов. Отправляем по всей России и миру.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
                className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start mb-6"
              >
                <Link
                  href="/order"
                  className="group relative inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-base font-black text-white overflow-hidden shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_45px_rgba(147,51,234,0.7)]"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Оформить заказ <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <Link
                  href="/calculator"
                  className="inline-flex h-14 items-center justify-center rounded-full border-2 border-primary/50 bg-primary/5 px-10 text-base font-semibold text-white backdrop-blur-sm transition-all hover:border-primary hover:bg-primary/15 hover:scale-105"
                >
                  <Calculator className="mr-2 h-4 w-4" /> Калькулятор
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}
                className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto lg:mx-0"
              >
                {quickActions.map((a, i) =>
                  a.external ? (
                    <a key={i} href={a.href} target="_blank" rel="noopener noreferrer"
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card/20 backdrop-blur-sm transition-all hover:scale-105 text-center ${a.color}`}>
                      {a.icon}
                      <span className="text-xs font-medium leading-tight text-foreground/80">{a.label}</span>
                    </a>
                  ) : (
                    <Link key={i} href={a.href}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card/20 backdrop-blur-sm transition-all hover:scale-105 text-center ${a.color}`}>
                      {a.icon}
                      <span className="text-xs font-medium leading-tight text-foreground/80">{a.label}</span>
                    </Link>
                  )
                )}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.75, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.9, type: "spring", stiffness: 80 }}
              className="flex-shrink-0 relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(147,51,234,0.35) 0%, transparent 70%)",
                  transform: "scale(1.4)",
                }}
                animate={{ scale: [1.4, 1.65, 1.4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/20 pointer-events-none"
                style={{ transform: "scale(1.6)" }}
                animate={{ scale: [1.6, 1.8, 1.6], opacity: [0.4, 0.15, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <div
                className="relative w-64 h-64 md:w-80 md:h-80 lg:w-[420px] lg:h-[420px] rounded-full overflow-hidden flex items-center justify-center"
                style={{ background: "#050010" }}
              >
                <motion.img
                  src="/logo.png"
                  alt="BRUCE 3D SHOP"
                  className="w-full h-full object-contain"
                  style={{
                    filter: "drop-shadow(0 0 40px rgba(147,51,234,0.8)) drop-shadow(0 0 80px rgba(168,85,247,0.4))",
                  }}
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/60 to-transparent pointer-events-none z-[1]" />

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-primary/50"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-5 h-8 rounded-full border border-primary/30 flex items-start justify-center pt-1">
            <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/60"
              animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
          <span className="text-xs tracking-widest uppercase">scroll</span>
        </motion.div>
      </section>

      {/* ====== LIVE STATS BAR ====== */}
      <section className="relative z-10 py-14 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/60 via-background to-indigo-950/40 pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(147,51,234,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px"
        }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(147,51,234,0.07),transparent)] pointer-events-none" />

        <div className="container relative mx-auto px-4 md:px-8">
          {/* Section header */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/8 text-primary text-xs font-bold tracking-widest uppercase mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Live данные
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight"
              style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 60%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              В цифрах
            </h2>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {[
              { ...stats[0], accent: "#c084fc", glow: "rgba(192,132,252,0.15)", border: "rgba(192,132,252,0.25)", stripe: "from-violet-500 to-purple-600" },
              { ...stats[1], accent: "#22d3ee", glow: "rgba(34,211,238,0.12)", border: "rgba(34,211,238,0.25)", stripe: "from-cyan-400 to-sky-500" },
              { ...stats[2], accent: "#fbbf24", glow: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.25)", stripe: "from-amber-400 to-orange-500" },
              { ...stats[3], accent: "#4ade80", glow: "rgba(74,222,128,0.10)", border: "rgba(74,222,128,0.25)", stripe: "from-green-400 to-emerald-500" },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, type: "spring", stiffness: 120 }}
                whileHover={{ scale: 1.04, y: -4 }}
                className="relative rounded-2xl overflow-hidden cursor-default"
                style={{ background: "rgba(15,10,30,0.7)", border: `1px solid ${stat.border}`, boxShadow: `0 0 32px ${stat.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` }}
              >
                {/* Top gradient stripe */}
                <div className={`h-1 w-full bg-gradient-to-r ${stat.stripe}`} />

                {/* Corner glow blob */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-30"
                  style={{ background: stat.accent }} />

                <div className="p-5 md:p-6 flex flex-col gap-2">
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1"
                    style={{ background: `${stat.glow}`, border: `1px solid ${stat.border}`, color: stat.accent }}>
                    {stat.icon}
                  </div>

                  {/* Big number */}
                  <div className="text-4xl md:text-5xl font-black font-display leading-none"
                    style={{ color: stat.accent, textShadow: `0 0 24px ${stat.accent}80` }}>
                    {(stat as any).fixed
                      ? `${stat.value}${stat.suffix}`
                      : <AnimatedCounter target={stat.value as number} suffix={stat.suffix} />}
                  </div>

                  {/* Label */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mt-1">{stat.label}</p>

                  {/* Bottom scan line */}
                  <motion.div
                    animate={{ scaleX: [0, 1, 0], opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 }}
                    className="h-px mt-2 rounded-full bg-gradient-to-r from-transparent via-current to-transparent origin-left"
                    style={{ color: stat.accent }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== KILLER BUNNY SHOP PROMO ====== */}
      <section className="py-12 bg-background relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-violet-900/10 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center gap-8 p-6 rounded-3xl border border-primary/30 bg-card/40 backdrop-blur">
            <img src="/killer-bunny-catalog.png" alt="Killer Bunny™ Каталог" className="w-full md:w-64 rounded-xl object-cover shrink-0 shadow-[0_0_30px_rgba(147,51,234,0.3)]" />
            <div className="flex-1 text-center md:text-left">
              <div className="text-xs text-primary uppercase tracking-widest font-bold mb-2">Эксклюзивно</div>
              <h3 className="text-2xl md:text-3xl font-black font-display uppercase mb-2">KILLER BUNNY™ Shop</h3>
              <p className="text-muted-foreground mb-4">Коллекционные виниловые фигурки ручной работы. Series 01 — First Edition. 10 уникальных персонажей. Ограниченный тираж 200 штук.</p>
              <Link href="/shop"
                className="inline-flex items-center gap-2 h-11 rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105">
                <ShoppingBag className="w-4 h-4" /> Перейти в магазин <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ====== SERVICES ====== */}
      <section className="py-20 bg-background relative z-10">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black font-display uppercase mb-3">Наши <span className="text-primary">Услуги</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Полный цикл от идеи до готового изделия. Принимаем заказы из любой точки мира.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {services.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link href={s.href}
                  className="group flex flex-col gap-4 p-6 rounded-2xl border border-border/50 bg-card/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg mb-1 text-white group-hover:text-primary transition-colors">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="mt-auto flex items-center text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Подробнее <ArrowRight className="ml-1 h-3 w-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_40px_rgba(147,51,234,0.1)]">
            <img src={servicesImg} alt="3D моделирование, печать, сканирование" className="w-full object-cover" />
          </motion.div>
        </div>
      </section>

      {/* ====== ADVANTAGES ====== */}
      <section className="py-16 bg-primary/5 border-y border-primary/20 relative z-10">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2">Почему выбирают <span className="text-primary">BRUCE 3D</span></h2>
            <p className="text-muted-foreground text-sm">Работаем по всей России и отправляем за рубеж</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {advantages.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3 p-5 rounded-2xl border border-border/40 bg-card/30">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{a.icon}</div>
                <div>
                  <div className="font-bold text-sm text-white mb-1">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRACKER + CALCULATOR PROMOS ====== */}
      <section className="py-12 bg-background relative z-10">
        <div className="container mx-auto px-4 md:px-8 flex flex-col gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Отслеживайте статус заказа онлайн</h3>
                <p className="text-xs text-muted-foreground">Введите номер заказа — узнайте где ваше изделие прямо сейчас</p>
              </div>
            </div>
            <Link href="/tracker"
              className="shrink-0 inline-flex h-10 items-center justify-center rounded-full border border-cyan-500/40 bg-cyan-500/10 px-6 text-sm font-bold text-cyan-400 transition-all hover:bg-cyan-500/20">
              <Search className="mr-2 h-3.5 w-3.5" /> Открыть трекер
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border border-primary/20 bg-primary/5">
            <div>
              <h3 className="text-2xl font-black font-display uppercase mb-2">
                Узнайте стоимость <span className="text-primary">за 30 секунд</span>
              </h3>
              <p className="text-muted-foreground">Наш калькулятор мгновенно рассчитает примерную стоимость по материалу, весу и качеству.</p>
            </div>
            <Link href="/calculator"
              className="shrink-0 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105">
              <Calculator className="mr-2 h-4 w-4" /> Открыть калькулятор
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ====== CINEMATIC CTA BANNER ====== */}
      <section className="relative py-28 overflow-hidden">
        <VideoBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-background/60 pointer-events-none z-[1]" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-semibold mb-6">
              <Zap className="w-3.5 h-3.5" /> Работаем 7 дней в неделю
            </div>
            <h2 className="text-4xl md:text-6xl font-black font-display uppercase mb-4 leading-tight">
              ОТ ИДЕИ ДО<br /><span className="text-primary">ГОТОВОГО РЕЗУЛЬТАТА!</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-10">
              Воплощаем ваши идеи в реальность. Принимаем заказы из любой точки мира.
              Пришлите файл или опишите задачу — рассчитаем стоимость бесплатно.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/order"
                className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-12 text-lg font-bold text-white shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(147,51,234,0.7)]">
                Заказать сейчас <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/gallery"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-primary/40 bg-transparent px-12 text-lg font-semibold text-white transition-all hover:border-primary hover:bg-primary/10">
                Галерея работ
              </Link>
              <Link href="/shop"
                className="inline-flex h-14 items-center justify-center rounded-full border-2 border-purple-500/40 bg-purple-500/5 px-12 text-lg font-semibold text-purple-300 transition-all hover:border-purple-400 hover:bg-purple-500/10">
                <ShoppingBag className="mr-2 h-5 w-5" /> Killer Bunny™ Shop
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
