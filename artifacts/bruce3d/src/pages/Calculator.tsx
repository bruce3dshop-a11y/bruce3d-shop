import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calculator as CalcIcon, ArrowRight, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

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
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      className="container mx-auto px-4 py-16 md:py-24"
    >
      <div className="max-w-3xl mb-12">
        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <CalcIcon className="w-6 h-6 text-primary" />
          </div>
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Онлайн-калькулятор</span>
        </motion.div>
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold font-display mb-4">
          Рассчитайте <span className="text-primary">стоимость</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="text-lg text-muted-foreground">
          Предварительный расчёт стоимости 3D-печати. Точная цена — после анализа вашего файла.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="bg-card/40 border-border/50">
              <CardHeader><CardTitle className="text-base font-display">Материал</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {materials.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMaterial(m)}
                      className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                        material.id === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${m.color} mx-auto mb-1.5`} />
                      {m.name}
                      <div className="text-xs text-muted-foreground mt-0.5">{m.pricePerGram} ₽/г</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/40 border-border/50">
              <CardHeader><CardTitle className="text-base font-display">Качество печати</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {qualities.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setQuality(q)}
                      className={`p-3 rounded-xl border text-sm text-center transition-all ${
                        quality.id === q.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      <div className="font-medium mb-0.5">{q.name}</div>
                      <div className="text-xs text-muted-foreground">{q.layerHeight}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{q.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/40 border-border/50">
              <CardHeader><CardTitle className="text-base font-display">Параметры</CardTitle></CardHeader>
              <CardContent className="space-y-6">
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
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <Card className="bg-primary/5 border-primary/30">
              <CardHeader>
                <CardTitle className="font-display text-lg">Результат</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-sm text-muted-foreground mb-1">Примерная стоимость</div>
                  <div className="text-4xl font-black text-primary">{minCost}–{maxCost} <span className="text-2xl">₽</span></div>
                  <div className="text-xs text-muted-foreground mt-1">за {copies[0]} шт.</div>
                </div>

                <div className="space-y-2 text-sm border-t border-border/30 pt-4">
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
                  <div className="flex justify-between border-t border-border/30 pt-2">
                    <span className="text-muted-foreground">Примерное время</span>
                    <span className="font-medium">{printTime} ч</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
                  Это приблизительный расчёт. Точная стоимость определяется после анализа STL-файла.
                </div>

                <Link
                  href="/order"
                  className="flex items-center justify-center gap-2 w-full h-11 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all hover:scale-105"
                >
                  Оформить заказ <ArrowRight className="w-4 h-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
