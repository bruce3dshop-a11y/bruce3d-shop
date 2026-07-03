import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calculator as CalcIcon, ArrowRight, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const materials = [
  { id: "pla", name: "PLA", pricePerGram: 3.5, density: 1.24, color: "bg-green-500" },
  { id: "petg", name: "PETG", pricePerGram: 4.0, density: 1.27, color: "bg-blue-500" },
  { id: "abs", name: "ABS", pricePerGram: 4.5, density: 1.05, color: "bg-yellow-500" },
  { id: "tpu", name: "TPU", pricePerGram: 5.0, density: 1.21, color: "bg-orange-500" },
  { id: "resin", name: "Фотополимер", pricePerGram: 8.0, density: 1.10, color: "bg-purple-500" },
];

const qualities = [
  { id: "draft", name: "Черновое", multiplier: 1.0, layerHeight: "0.3 мм", desc: "Быстро, видны слои" },
  { id: "standard", name: "Стандарт", multiplier: 1.3, layerHeight: "0.2 мм", desc: "Баланс качества и скорости" },
  { id: "fine", name: "Детальное", multiplier: 1.7, layerHeight: "0.1 мм", desc: "Высокая точность" },
];

export default function Calculator() {
  const [material, setMaterial] = useState(materials[0]);
  const [quality, setQuality] = useState(qualities[1]);
  const [weight, setWeight] = useState([50]);
  const [infill, setInfill] = useState([20]);
  const [copies, setCopies] = useState([1]);

  const materialCost = weight[0] * material.pricePerGram;
  const qualityCost = materialCost * quality.multiplier;
  const baseCost = Math.max(300, qualityCost * (0.5 + infill[0] / 100 * 0.5));
  const totalCost = Math.round(baseCost * copies[0]);
  const minCost = Math.round(totalCost * 0.9);
  const maxCost = Math.round(totalCost * 1.2);

  const printTime = Math.round((weight[0] / material.density / 10) * quality.multiplier * (1 + infill[0] / 100));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[#060008]" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <CalcIcon className="w-3.5 h-3.5" /> Онлайн-калькулятор
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-4 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Рассчитайте стоимость
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto">
            Предварительный расчёт стоимости 3D-печати. Точная цена — после анализа вашего файла.
          </motion.p>
        </div>
      </section>

      <section className="relative z-10 py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <h3 className="font-display font-bold text-base mb-4">Материал</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {materials.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterial(m)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        material.id === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-primary/15 hover:border-primary/35 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${m.color} mx-auto mb-1.5`} />
                      {m.name}
                      <div className="text-xs text-muted-foreground mt-0.5">{m.pricePerGram} ₽/г</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
                className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <h3 className="font-display font-bold text-base mb-4">Качество печати</h3>
                <div className="grid grid-cols-3 gap-2">
                  {qualities.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q)}
                      className={`p-3 rounded-xl border text-sm text-center transition-all ${
                        quality.id === q.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-primary/15 hover:border-primary/35 hover:bg-primary/5"
                      }`}
                    >
                      <div className="font-medium mb-0.5">{q.name}</div>
                      <div className="text-xs text-muted-foreground">{q.layerHeight}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{q.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent p-6 space-y-6">
                <h3 className="font-display font-bold text-base">Параметры</h3>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Вес изделия</span>
                    <span className="text-sm font-bold text-primary">{weight[0]} г</span>
                  </div>
                  <Slider value={weight} onValueChange={setWeight} min={5} max={500} step={5} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>5 г</span><span>500 г</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium flex items-center gap-1">
                      Заполнение
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </span>
                    <span className="text-sm font-bold text-primary">{infill[0]}%</span>
                  </div>
                  <Slider value={infill} onValueChange={setInfill} min={10} max={100} step={5} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>10% (лёгкое)</span><span>100% (монолит)</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Количество копий</span>
                    <span className="text-sm font-bold text-primary">{copies[0]} шт.</span>
                  </div>
                  <Slider value={copies} onValueChange={setCopies} min={1} max={50} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1 шт.</span><span>50 шт.</span></div>
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-6 space-y-4">
                  <h3 className="font-display text-lg font-bold">Результат</h3>
                  <div className="text-center py-4">
                    <div className="text-sm text-muted-foreground mb-1">Примерная стоимость</div>
                    <div className="text-4xl font-black text-primary">{minCost}–{maxCost} <span className="text-2xl">₽</span></div>
                    <div className="text-xs text-muted-foreground mt-1">за {copies[0]} шт.</div>
                  </div>

                  <div className="space-y-2 text-sm border-t border-primary/15 pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Материал</span>
                      <span className="font-medium">{material.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Качество</span>
                      <span className="font-medium">{quality.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Вес</span>
                      <span className="font-medium">{weight[0]} г × {copies[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Заполнение</span>
                      <span className="font-medium">{infill[0]}%</span>
                    </div>
                    <div className="flex justify-between border-t border-primary/15 pt-2">
                      <span className="text-muted-foreground">Примерное время</span>
                      <span className="font-medium">{printTime} ч</span>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
                    Это приблизительный расчёт. Точная стоимость определяется после анализа STL-файла.
                  </div>

                  <Link
                    href="/order"
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105"
                  >
                    Оформить заказ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
