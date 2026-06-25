import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import pricesImg from "@assets/D380AA27-3B0E-451D-9A99-CBA52AFF1177_1782231561624.png";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

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
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="container mx-auto px-4 py-16 md:py-24"
    >
      <div className="max-w-3xl mb-16">
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold font-display mb-6"
        >
          Цены на <span className="text-primary">Услуги</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground"
        >
          Качественно. Точно. Надёжно. Итоговая стоимость зависит от сложности модели и качества печати.
        </motion.p>
      </div>

      <motion.div variants={itemVariants} className="mb-12">
        <h2 className="text-xl font-display font-bold text-primary uppercase tracking-wider mb-5 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary inline-block" />
          3D Печать
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {printPrices.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center text-center p-4 rounded-xl border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="text-sm font-bold text-foreground mb-1">{item.material}</div>
              <div className="text-lg font-black text-primary mb-1">{item.price}</div>
              <div className="text-xs text-muted-foreground leading-tight">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-16">
        <h2 className="text-xl font-display font-bold text-primary uppercase tracking-wider mb-5 flex items-center gap-2">
          <span className="w-6 h-0.5 bg-primary inline-block" />
          Другие услуги
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {servicePrices.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col p-5 rounded-xl border border-border/50 bg-card/40 hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <div className="font-bold text-foreground mb-1">{item.service}</div>
              <div className="text-xl font-black text-primary mb-2">{item.price}</div>
              <div className="text-xs text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6 mb-12">
        <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.12)]">
          <img
            src={pricesImg}
            alt="Цены на услуги 3D печати"
            className="w-full object-cover"
          />
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-primary/5 border border-primary/20 p-8 rounded-2xl text-center"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.08)_0%,transparent_70%)] pointer-events-none" />
        <h3 className="text-xl font-display font-bold mb-3 relative z-10">Нужен точный расчёт?</h3>
        <p className="text-muted-foreground mb-6 max-w-xl mx-auto relative z-10">
          Пришлите вашу 3D-модель (STL, OBJ, STEP) — бесплатно рассчитаем стоимость и сроки.
        </p>
        <Link
          href="/order"
          className="relative z-10 inline-flex h-12 items-center justify-center rounded-full bg-primary px-10 text-base font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 hover:scale-105"
        >
          Рассчитать стоимость <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
