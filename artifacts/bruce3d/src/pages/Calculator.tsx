import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calculator as CalcIcon, ArrowRight, Info, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const materials = [
  { id: "pla", name: "PLA", pricePerGram: 3.5, density: 1.24, color: "bg-green-500", accent: "#10b981" },
  { id: "petg", name: "PETG", pricePerGram: 4.0, density: 1.27, color: "bg-blue-500", accent: "#3b82f6" },
  { id: "abs", name: "ABS", pricePerGram: 4.5, density: 1.05, color: "bg-yellow-500", accent: "#f59e0b" },
  { id: "tpu", name: "TPU", pricePerGram: 5.0, density: 1.21, color: "bg-orange-500", accent: "#f97316" },
  { id: "resin", name: "Фотополимер", pricePerGram: 8.0, density: 1.10, color: "bg-purple-500", accent: "#a855f7" },
];

const qualities = [
  { id: "draft", name: "Черновое", multiplier: 1.0, layerHeight: "0.3 мм", desc: "Быстро, видны слои" },
  { id: "standard", name: "Стандарт", multiplier: 1.3, layerHeight: "0.2 мм", desc: "Баланс качества" },
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
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-industrial-grid opacity-30" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/18 blur-[140px] pointer-events-none -translate-y-1/2 ambient-glow" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/14 blur-[120px] pointer-events-none -translate-y-1/2 ambient-glow" style={{ animationDelay: "1.5s" }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <CalcIcon className="w-3.5 h-3.5" /> Онлайн-калькулятор
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(147,51,234,0.4))" }}>
            Рассчитайте стоимость
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Предварительный расчёт стоимости 3D-печати. Точная цена — после анализа вашего файла.
          </motion.p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">

              {/* Material */}
              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="rounded-2xl glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <h3 className="font-display font-bold text-base mb-4">Материал</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {materials.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterial(m)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
                        material.id === m.id
                          ? "border-primary bg-primary/12 text-primary shadow-[0_0_15px_rgba(147,51,234,0.2)]"
                          : "border-white/8 hover:border-primary/25 hover:bg-white/3 text-muted-foreground hover:text-white"
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${m.color} mx-auto mb-1.5`} />
                      <div>{m.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{m.pricePerGram} ₽/г</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Quality */}
              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}
                className="rounded-2xl glass-card p-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <h3 className="font-display font-bold text-base mb-4">Качество печати</h3>
                <div className="grid grid-cols-3 gap-2">
                  {qualities.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q)}
                      className={`p-4 rounded-xl border text-sm text-center transition-all duration-200 ${
                        quality.id === q.id
                          ? "border-primary bg-primary/12 text-primary shadow-[0_0_15px_rgba(147,51,234,0.2)]"
                          : "border-white/8 hover:border-primary/25 hover:bg-white/3 text-muted-foreground hover:text-white"
                      }`}
                    >
                      <div className="font-semibold mb-1">{q.name}</div>
                      <div className="text-xs text-muted-foreground">{q.layerHeight}</div>
                      <div className="text-xs text-muted-foreground/70 mt-1">{q.desc}</div>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Sliders */}
              <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="rounded-2xl glass-card p-6 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <h3 className="font-display font-bold text-base">Параметры</h3>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Вес изделия</span>
                    <span className="text-sm font-bold text-primary">{weight[0]} г</span>
                  </div>
                  <Slider value={weight} onValueChange={setWeight} min={5} max={500} step={5} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>5 г</span><span>500 г</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium flex items-center gap-1.5">
                      Заполнение <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </span>
                    <span className="text-sm font-bold text-primary">{infill[0]}%</span>
                  </div>
                  <Slider value={infill} onValueChange={setInfill} min={10} max={100} step={5} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>10% (лёгкое)</span><span>100% (монолит)</span></div>
                </div>
                <div>
                  <div className="flex justify-between mb-3">
                    <span className="text-sm font-medium">Количество копий</span>
                    <span className="text-sm font-bold text-primary">{copies[0]} шт.</span>
                  </div>
                  <Slider value={copies} onValueChange={setCopies} min={1} max={50} step={1} className="w-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5"><span>1 шт.</span><span>50 шт.</span></div>
                </div>
              </motion.div>
            </div>

            {/* Result panel */}
            <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
              className="lg:col-span-1">
              <div className="sticky top-24">
                <div className="rounded-2xl glass-card p-6 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-purple-700/20 blur-2xl pointer-events-none" />

                  <h3 className="font-display text-lg font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> Результат
                  </h3>

                  <div className="text-center py-5 rounded-xl bg-primary/5 border border-primary/12">
                    <div className="text-xs text-muted-foreground mb-1">Примерная стоимость</div>
                    <div className="text-4xl font-black text-primary leading-none">{minCost}–{maxCost}</div>
                    <div className="text-lg font-bold text-primary mt-1">₽</div>
                    <div className="text-xs text-muted-foreground mt-1">за {copies[0]} шт.</div>
                  </div>

                  <div className="space-y-2.5 text-sm border-t border-white/6 pt-4">
                    {[
                      { label: "Материал", value: material.name },
                      { label: "Качество", value: quality.name },
                      { label: "Вес", value: `${weight[0]} г × ${copies[0]}` },
                      { label: "Заполнение", value: `${infill[0]}%` },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/6 pt-2">
                      <span className="text-muted-foreground">Примерное время</span>
                      <span className="font-medium">{printTime} ч</span>
                    </div>
                  </div>

                  <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400/80 leading-relaxed">
                    Это приблизительный расчёт. Точная стоимость определяется после анализа STL-файла.
                  </div>

                  <Link
                    href="/order"
                    className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:bg-primary/90 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
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
