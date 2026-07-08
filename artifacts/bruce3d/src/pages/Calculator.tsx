import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Calculator as CalcIcon, ArrowRight, Info, Zap, Clock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { CALC_MATERIALS, CALC_QUALITIES, CALC_INFILLS, calcEstimate } from "@/lib/calc";

export default function Calculator() {
  const [materialId, setMaterialId] = useState(CALC_MATERIALS[0].id);
  const [qualityId, setQualityId]   = useState(CALC_QUALITIES[1].id);
  const [weight, setWeight]         = useState([50]);
  const [infill, setInfill]         = useState([20]);
  const [copies, setCopies]         = useState([1]);

  const material = CALC_MATERIALS.find(m => m.id === materialId)!;
  const result   = calcEstimate({
    weightG:    weight[0],
    materialId,
    infillPct:  infill[0],
    qty:        copies[0],
    qualityId,
  });

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
            className="text-white/50 text-base md:text-lg max-w-xl mx-auto">
            Введите параметры и получите ориентировочную цену мгновенно
          </motion.p>
        </div>
      </section>

      <div className="h-px section-sep" />

      {/* CALCULATOR */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* LEFT: Controls */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="space-y-6 p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">

              {/* Material */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Материал</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CALC_MATERIALS.filter(m => m.id !== "other").map(m => (
                    <button key={m.id} onClick={() => setMaterialId(m.id)}
                      className={`flex flex-col items-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                        materialId === m.id
                          ? "border-[color:var(--ac)] bg-[color:var(--ac)]/10 shadow-[0_0_16px_var(--ac)/30]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                      }`}
                      style={{ "--ac": m.accent } as React.CSSProperties}>
                      <div className="w-2.5 h-2.5 rounded-full mb-1.5 mt-0.5" style={{ background: m.accent, boxShadow: `0 0 8px ${m.accent}80` }} />
                      <span className={`text-sm font-bold ${materialId === m.id ? "text-white" : "text-white/60"}`}>{m.name}</span>
                      <span className="text-[10px] text-white/30 mt-0.5">от {m.minPrice} ₽</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Качество печати</h3>
                <div className="grid grid-cols-3 gap-2">
                  {CALC_QUALITIES.map(q => (
                    <button key={q.id} onClick={() => setQualityId(q.id)}
                      className={`flex flex-col p-3 rounded-2xl border text-left transition-all duration-200 ${
                        qualityId === q.id
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_rgba(147,51,234,0.2)]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                      }`}>
                      <span className={`text-sm font-bold mb-0.5 ${qualityId === q.id ? "text-white" : "text-white/60"}`}>{q.name}</span>
                      <span className="text-[10px] text-white/35">{q.layerHeight}</span>
                      <span className="text-[10px] text-white/25 leading-tight">{q.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Вес детали</h3>
                  <span className="text-sm font-bold text-white">{weight[0]} г</span>
                </div>
                <Slider value={weight} onValueChange={setWeight} min={5} max={2000} step={5}
                  className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/80 [&_.relative]:bg-white/10 [&_.absolute]:bg-primary" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1.5"><span>5 г</span><span>2 кг</span></div>
              </div>

              {/* Infill */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Заполнение</h3>
                  <span className="text-sm font-bold text-white">{infill[0]}%</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {CALC_INFILLS.map(v => (
                    <button key={v} onClick={() => setInfill([v])}
                      className={`flex-1 min-w-[44px] h-9 rounded-xl text-xs font-bold border transition-all ${
                        infill[0] === v
                          ? "bg-primary/20 border-primary/60 text-white shadow-[0_0_10px_rgba(147,51,234,0.2)]"
                          : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}>
                      {v}%
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-white/20 mt-2">
                  <span>Декор/Прototip</span><span>Монолит</span>
                </div>
              </div>

              {/* Copies */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Количество</h3>
                  <span className="text-sm font-bold text-white">{copies[0]} шт.</span>
                </div>
                <Slider value={copies} onValueChange={setCopies} min={1} max={100} step={1}
                  className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/80 [&_.relative]:bg-white/10 [&_.absolute]:bg-primary" />
                <div className="flex justify-between text-[10px] text-white/20 mt-1.5"><span>1</span><span>100</span></div>
              </div>
            </motion.div>

            {/* RIGHT: Result */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col gap-5">

              {/* Price card */}
              <div className="relative p-8 rounded-3xl border border-primary/20 bg-primary/[0.04] backdrop-blur-sm overflow-hidden">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-purple-700/20 blur-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

                <h3 className="font-display text-lg font-bold flex items-center gap-2 mb-6 relative">
                  <Zap className="w-4 h-4 text-primary" /> Результат
                </h3>

                {result ? (
                  <div className="text-center py-6 rounded-2xl bg-primary/8 border border-primary/15 relative mb-5">
                    <div className="text-xs text-muted-foreground mb-1">Примерная стоимость</div>
                    <div className="text-4xl font-black text-primary leading-none">
                      {result.min.toLocaleString("ru")}–{result.max.toLocaleString("ru")}
                    </div>
                    <div className="text-lg font-bold text-primary mt-1">₽</div>
                    <div className="text-xs text-muted-foreground mt-1">за {copies[0]} шт.</div>
                  </div>
                ) : (
                  <div className="text-center py-6 rounded-2xl bg-white/[0.02] border border-white/[0.07] mb-5">
                    <div className="text-4xl font-black text-white/15 leading-none">—</div>
                    <div className="text-xs text-white/25 mt-2">Задайте параметры выше</div>
                  </div>
                )}

                <div className="space-y-2.5 text-sm border-t border-white/6 pt-4">
                  {[
                    { label: "Материал",     value: material.name },
                    { label: "Качество",     value: CALC_QUALITIES.find(q => q.id === qualityId)?.name || "—" },
                    { label: "Вес",          value: `${weight[0]} г × ${copies[0]} шт.` },
                    { label: "Заполнение",   value: `${infill[0]}%` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                    </div>
                  ))}
                  {result && (
                    <div className="flex justify-between border-t border-white/6 pt-2">
                      <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Примерное время</span>
                      <span className="font-medium">~{result.printTimeH} ч</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-yellow-500/8 border border-yellow-500/20 text-xs text-yellow-400/80 leading-relaxed flex gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Это приблизительный расчёт. Точная стоимость определяется после анализа вашего STL-файла администратором.
              </div>

              <Link
                href="/order"
                className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-[0_0_20px_rgba(147,51,234,0.35)] hover:bg-primary/90 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)]"
              >
                Оформить заказ <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
