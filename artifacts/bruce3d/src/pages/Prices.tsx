import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Tag, Layers, Settings, Zap } from "lucide-react";
import pricesImg from "@assets/D380AA27-3B0E-451D-9A99-CBA52AFF1177_1782231561624.png";

const printPrices = [
  { material: "PETG",        price: "от 300 ₽", desc: "Прочный и устойчивый",       color: "#3b82f6" },
  { material: "PLA",         price: "от 300 ₽", desc: "Простой и экологичный",      color: "#10b981" },
  { material: "ABS",         price: "от 400 ₽", desc: "Термостойкий и прочный",     color: "#f59e0b" },
  { material: "TPU",         price: "от 350 ₽", desc: "Гибкий и эластичный",        color: "#f97316" },
  { material: "Многоцветная",price: "от 500 ₽", desc: "Печать в нескольких цветах", color: "#ec4899" },
  { material: "Фотополимер", price: "от 700 ₽", desc: "Высокая детализация",        color: "#a855f7" },
];

const servicePrices = [
  { service: "3D Моделирование",    price: "от 500 ₽",         desc: "Создание моделей любой сложности", color: "#06b6d4" },
  { service: "3D Сканирование",     price: "от 1 000 ₽",       desc: "Высокая точность и детализация",   color: "#8b5cf6" },
  { service: "Фотополимерная печать",price: "от 700 ₽",        desc: "Для мелких деталей и миниатюр",    color: "#a855f7" },
  { service: "Ремонт техники",      price: "по согласованию",  desc: "3D принтеры и оборудование",       color: "#10b981" },
];

export default function Prices() {
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
            <Tag className="w-3.5 h-3.5" /> Честные цены
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none text-gradient-cosmic">
            Цены на услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="text-white/45 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Итоговая стоимость зависит от сложности модели и качества печати. Расчёт — бесплатно.
          </motion.p>
        </div>
      </section>

      <div className="h-px section-sep" />

      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">

          {/* 3D Print */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-10 h-10 rounded-2xl bg-primary/[0.10] border border-primary/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase text-gradient-purple leading-none">3D Печать</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {printPrices.map((item, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.06 }}
                  className="group flex flex-col items-center text-center p-5 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-[var(--c)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden"
                  style={{ "--c": `${item.color}40` } as any}
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
                  <div className="w-2 h-2 rounded-full mb-3" style={{ background: item.color, boxShadow: `0 0 10px ${item.color}` }} />
                  <div className="text-sm font-bold text-white mb-1.5">{item.material}</div>
                  <div className="text-lg font-black mb-1.5" style={{ color: item.color }}>{item.price}</div>
                  <div className="text-[11px] text-white/35 leading-tight">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Other services */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-10 h-10 rounded-2xl bg-primary/[0.10] border border-primary/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase text-gradient-purple leading-none">Другие услуги</h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {servicePrices.map((item, idx) => (
                <motion.div key={idx}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.07 }}
                  className="group flex flex-col p-6 rounded-3xl bg-white/[0.03] border border-white/[0.07] hover:border-[var(--c)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                  style={{ "--c": `${item.color}40` } as any}
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-3xl" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
                  <div className="font-bold text-white mb-2 text-sm">{item.service}</div>
                  <div className="text-xl font-black mb-2" style={{ color: item.color }}>{item.price}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Photo */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-14">
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/18 shadow-[0_0_80px_rgba(147,51,234,0.12)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
              <img src={pricesImg} alt="Цены на услуги 3D печати" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl neon-card p-10 md:p-12 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-violet-600/[0.05] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/[0.06] blur-[60px] rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
                <Zap className="w-3 h-3" /> Бесплатный расчёт
              </div>
              <h2 className="text-3xl md:text-4xl font-black font-display mb-4 text-gradient-cosmic">Узнайте точную стоимость</h2>
              <p className="text-white/40 mb-7 max-w-md mx-auto text-sm leading-relaxed">
                Используйте онлайн-калькулятор или отправьте заявку — рассчитаем за несколько часов.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/calculator"
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary font-bold text-white text-sm shadow-[0_0_30px_rgba(147,51,234,0.4)] hover:shadow-[0_0_50px_rgba(147,51,234,0.6)] hover:scale-105 transition-all">
                  Калькулятор <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/order"
                  className="inline-flex items-center h-12 px-8 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/65 hover:text-white hover:border-white/22 hover:bg-white/[0.08] transition-all text-sm font-semibold">
                  Оформить заказ
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
