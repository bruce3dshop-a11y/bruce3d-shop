import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Printer, PencilRuler, ScanLine, Wrench, CheckCircle, Clock, Zap, Shield } from "lucide-react";

const services = [
  {
    icon: Printer, num: "01", title: "3D Печать", accent: "#a855f7",
    desc: "FDM и фотополимерная печать. Любая сложность и объём.",
    features: ["PLA, PETG, ABS, TPU, Resin", "Высокая точность ±0.2мм", "Любой размер и цвет", "Срок от 24 часов"],
    gradient: "from-violet-500/20 to-purple-500/5",
  },
  {
    icon: PencilRuler, num: "02", title: "3D Моделирование", accent: "#3b82f6",
    desc: "Создание 3D-моделей по фото, чертежам, образцам.",
    features: ["По фото и эскизам", "Реверс-инжиниринг", "Любые форматы STL, OBJ", "Правки входят в стоимость"],
    gradient: "from-blue-500/20 to-cyan-500/5",
  },
  {
    icon: ScanLine, num: "03", title: "3D Сканирование", accent: "#06b6d4",
    desc: "Высокоточное сканирование деталей и изделий любой формы.",
    features: ["Точность до 0.05мм", "Автозапчасти и механизмы", "Результат в STL / STEP", "Быстро и без повреждений"],
    gradient: "from-cyan-500/20 to-teal-500/5",
  },
  {
    icon: Wrench, num: "04", title: "Ремонт техники", accent: "#10b981",
    desc: "Профессиональный ремонт 3D-принтеров и оборудования.",
    features: ["Любые марки принтеров", "Замена деталей на лету", "Диагностика бесплатно", "Гарантия на ремонт"],
    gradient: "from-emerald-500/20 to-green-500/5",
  },
];

const advantages = [
  { icon: Zap,          text: "Срок от 24 часов",    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { icon: Shield,       text: "Гарантия качества",   color: "text-green-400 bg-green-500/10 border-green-500/20" },
  { icon: CheckCircle,  text: "Честные цены",         color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  { icon: Clock,        text: "Работаем 7/7",         color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
];

export default function Services() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-industrial-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/15 blur-[130px] pointer-events-none -translate-y-1/2 orb-a" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[110px] pointer-events-none -translate-y-1/2 orb-b" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/[0.08] backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Printer className="w-3.5 h-3.5" /> Полный цикл 3D-услуг
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none text-gradient-cosmic">
            Наши услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="text-white/45 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            От идеи до готового изделия. Принимаем заказы из любой точки России и мира.
          </motion.p>
          {/* Advantage pills */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="flex flex-wrap gap-2 justify-center">
            {advantages.map(({ icon: Icon, text, color }, i) => (
              <div key={i} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
                <Icon className="w-3 h-3" /> {text}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="h-px section-sep" />

      {/* Services */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`group relative flex flex-col gap-5 p-8 rounded-3xl bg-gradient-to-br ${s.gradient} border border-white/[0.07] hover:border-[var(--accent)] backdrop-blur-sm transition-all duration-300 hover:shadow-[0_8px_48px_rgba(0,0,0,0.4)] overflow-hidden`}
                style={{ "--accent": `${s.accent}35` } as any}
              >
                {/* Top accent line */}
                <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl opacity-60 transition-opacity group-hover:opacity-100"
                  style={{ background: `linear-gradient(90deg,transparent,${s.accent}80,transparent)` }} />
                {/* Number watermark */}
                <span className="absolute top-5 right-6 text-6xl font-black opacity-[0.06] group-hover:opacity-[0.10] transition-opacity leading-none tabular-nums select-none"
                  style={{ color: s.accent }}>{s.num}</span>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{ background: `${s.accent}18`, color: s.accent, border: `1px solid ${s.accent}25` }}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="font-black text-xl text-white leading-tight">{s.title}</h2>
                    <p className="text-white/45 text-sm mt-1">{s.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-1">
                  {s.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.accent, boxShadow: `0 0 6px ${s.accent}` }} />
                      {f}
                    </div>
                  ))}
                </div>

                <Link href="/order"
                  className="mt-auto inline-flex items-center gap-2 self-start px-5 py-2.5 rounded-full text-xs font-bold transition-all border hover:scale-105"
                  style={{ background: `${s.accent}15`, borderColor: `${s.accent}35`, color: s.accent }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${s.accent}25`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = `${s.accent}15`; }}
                >
                  Заказать <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px section-sep" />

      {/* CTA */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl neon-card p-10 md:p-14 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-transparent to-violet-600/[0.06] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/[0.07] blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                <Zap className="w-3 h-3" /> Бесплатный расчёт
              </div>
              <h2 className="text-3xl md:text-5xl font-black font-display uppercase mb-4 text-gradient-cosmic">
                Готовы начать?
              </h2>
              <p className="text-white/45 text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed">
                Пришлите файл или опишите задачу — рассчитаем стоимость и сроки бесплатно.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/order"
                  className="inline-flex items-center gap-2 h-13 px-10 rounded-full bg-primary font-bold text-white shadow-[0_0_40px_rgba(147,51,234,0.45)] hover:shadow-[0_0_60px_rgba(147,51,234,0.65)] hover:scale-105 transition-all text-sm">
                  Оформить заказ <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/calculator"
                  className="inline-flex items-center h-13 px-10 rounded-full border border-white/[0.12] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25 hover:bg-white/[0.08] transition-all text-sm font-semibold">
                  Калькулятор цен
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
