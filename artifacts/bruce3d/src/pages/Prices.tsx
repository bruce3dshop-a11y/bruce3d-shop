import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import pricesImg from "@assets/D380AA27-3B0E-451D-9A99-CBA52AFF1177_1782231561624.png";

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const printPrices = [
  { material: "PETG", price: "от 300 ₽", desc: "Прочный и устойчивый" },
  { material: "PLA", price: "от 300 ₽", desc: "Простой и экологичный" },
  { material: "ABS", price: "от 400 ₽", desc: "Термостойкий и прочный" },
  { material: "TPU", price: "от 350 ₽", desc: "Гибкий и эластичный" },
  { material: "Многоцветная", price: "от 500 ₽", desc: "Печать в нескольких цветах" },
  { material: "Фотополимер", price: "от 700 ₽", desc: "Высокая детализация" },
];

const servicePrices = [
  { service: "3D Моделирование", price: "от 500 ₽", desc: "Создание моделей любой сложности" },
  { service: "3D Сканирование", price: "от 1000 ₽", desc: "Высокая точность и детализация" },
  { service: "Фотополимерная печать", price: "от 700 ₽", desc: "Для мелких деталей и миниатюр" },
  { service: "Ремонт техники", price: "по согласованию", desc: "3D принтеры и оборудование" },
];

export default function Prices() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03000a]/55 via-[#03000a]/40 to-[#03000a]/60" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-4 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Цены на услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto">
            Качественно. Точно. Надёжно. Итоговая стоимость зависит от сложности модели и качества печати.
          </motion.p>
        </div>
      </section>

      <section className="relative z-10 py-16 md:py-20 bg-transparent">
        <div className="container mx-auto px-4 md:px-8">

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-end gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                3D Печать
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent mb-2" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {printPrices.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="flex flex-col items-center text-center p-5 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/35 transition-all">
                  <div className="text-sm font-bold text-white mb-1">{item.material}</div>
                  <div className="text-lg font-black text-primary mb-1">{item.price}</div>
                  <div className="text-xs text-muted-foreground leading-tight">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
            <div className="flex items-end gap-4 mb-6">
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase leading-none"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Другие услуги
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent mb-2" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {servicePrices.map((item, idx) => (
                <motion.div key={idx} variants={itemVariants}
                  className="flex flex-col p-6 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/35 transition-all">
                  <div className="font-bold text-white mb-1">{item.service}</div>
                  <div className="text-xl font-black text-primary mb-2">{item.price}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-14">
            <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.15)]">
              <img src={pricesImg} alt="Цены на услуги 3D печати" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/60 via-background to-violet-950/30 p-10 text-center">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-violet-700/10 blur-3xl pointer-events-none" />
            <h3 className="relative z-10 text-2xl md:text-3xl font-black font-display uppercase mb-3">Нужен точный расчёт?</h3>
            <p className="relative z-10 text-muted-foreground mb-6 max-w-xl mx-auto">
              Пришлите вашу 3D-модель (STL, OBJ, STEP) — бесплатно рассчитаем стоимость и сроки.
            </p>
            <Link href="/order"
              className="relative z-10 inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-10 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105">
              Рассчитать стоимость <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
