import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Tag, Layers, Settings } from "lucide-react";
import pricesImg from "@assets/D380AA27-3B0E-451D-9A99-CBA52AFF1177_1782231561624.png";

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

const printPrices = [
  { material: "PETG", price: "от 300 ₽", desc: "Прочный и устойчивый", color: "#3b82f6" },
  { material: "PLA", price: "от 300 ₽", desc: "Простой и экологичный", color: "#10b981" },
  { material: "ABS", price: "от 400 ₽", desc: "Термостойкий и прочный", color: "#f59e0b" },
  { material: "TPU", price: "от 350 ₽", desc: "Гибкий и эластичный", color: "#f97316" },
  { material: "Многоцветная", price: "от 500 ₽", desc: "Печать в нескольких цветах", color: "#ec4899" },
  { material: "Фотополимер", price: "от 700 ₽", desc: "Высокая детализация", color: "#a855f7" },
];

const servicePrices = [
  { service: "3D Моделирование", price: "от 500 ₽", desc: "Создание моделей любой сложности", color: "#06b6d4" },
  { service: "3D Сканирование", price: "от 1000 ₽", desc: "Высокая точность и детализация", color: "#8b5cf6" },
  { service: "Фотополимерная печать", price: "от 700 ₽", desc: "Для мелких деталей и миниатюр", color: "#a855f7" },
  { service: "Ремонт техники", price: "по согласованию", desc: "3D принтеры и оборудование", color: "#10b981" },
];

export default function Prices() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-industrial-grid opacity-30" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/18 blur-[140px] pointer-events-none -translate-y-1/2 ambient-glow" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/14 blur-[120px] pointer-events-none -translate-y-1/2 ambient-glow" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Tag className="w-3.5 h-3.5" /> Честные цены
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(147,51,234,0.4))" }}>
            Цены на услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Качественно. Точно. Надёжно. Итоговая стоимость зависит от сложности модели и качества печати.
          </motion.p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">

          {/* 3D Print */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                3D Печать
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {printPrices.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="group flex flex-col items-center text-center p-5 rounded-2xl glass-card glass-card-hover relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${item.color}60, transparent)` }} />
                  <div className="w-2 h-2 rounded-full mb-3" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                  <div className="text-sm font-bold text-white mb-1">{item.material}</div>
                  <div className="text-lg font-black mb-1" style={{ color: item.color }}>{item.price}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Other services */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/12 border border-primary/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Другие услуги
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {servicePrices.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="group flex flex-col p-6 rounded-2xl glass-card glass-card-hover relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, transparent, ${item.color}60, transparent)` }} />
                  <div className="font-bold text-white mb-2 group-hover:text-purple-200 transition-colors">{item.service}</div>
                  <div className="text-xl font-black mb-2" style={{ color: item.color }}>{item.price}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-14">
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_60px_rgba(147,51,234,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-10" />
              <img src={pricesImg} alt="Цены на услуги 3D печати" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl glass-card p-10 text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-700/15 blur-3xl pointer-events-none" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <h3 className="relative z-10 text-2xl md:text-3xl font-black font-display uppercase mb-3">Нужен точный расчёт?</h3>
            <p className="relative z-10 text-muted-foreground mb-6 max-w-xl mx-auto">
              Пришлите вашу 3D-модель (STL, OBJ, STEP) — бесплатно рассчитаем стоимость и сроки.
            </p>
            <Link href="/order"
              className="relative z-10 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-10 text-base font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all hover:bg-primary/90 hover:scale-105">
              Рассчитать стоимость <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
