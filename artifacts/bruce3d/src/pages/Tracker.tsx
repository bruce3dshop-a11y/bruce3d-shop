import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, CheckCircle, Clock, Truck, XCircle, ArrowRight, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TrackResult {
  order_number: string;
  status: string;
  service_type: string;
  material: string;
  created_at: string;
  updated_at: string;
  history: { status: string; comment?: string; created_at: string }[];
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string }> = {
  new: { label: "Новый", icon: <Clock className="w-5 h-5" />, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", desc: "Заказ получен, ожидает рассмотрения" },
  calculating: { label: "Рассчитывается", icon: <Zap className="w-5 h-5" />, color: "text-yellow-400 border-yellow-500/30 bg-yellow-500/10", desc: "Специалист рассчитывает стоимость" },
  accepted: { label: "Принят", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400 border-green-500/30 bg-green-500/10", desc: "Заказ принят в производство" },
  working: { label: "В работе", icon: <Package className="w-5 h-5" />, color: "text-orange-400 border-orange-500/30 bg-orange-500/10", desc: "Идёт подготовка к печати" },
  printing: { label: "На печати", icon: <Package className="w-5 h-5" />, color: "text-violet-400 border-violet-500/30 bg-violet-500/10", desc: "Изделие печатается прямо сейчас" },
  postprocess: { label: "Постобработка", icon: <Zap className="w-5 h-5" />, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", desc: "Финишная обработка и контроль качества" },
  ready: { label: "Готов", icon: <CheckCircle className="w-5 h-5" />, color: "text-purple-400 border-purple-500/30 bg-purple-500/10", desc: "Заказ готов к выдаче или отправке" },
  shipped: { label: "Отправлен", icon: <Truck className="w-5 h-5" />, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", desc: "Посылка в пути к вам" },
  completed: { label: "Завершён", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-400 border-green-500/30 bg-green-500/10", desc: "Заказ успешно получен" },
  rejected: { label: "Отклонён", icon: <XCircle className="w-5 h-5" />, color: "text-red-400 border-red-500/30 bg-red-500/10", desc: "Заказ был отклонён" },
};

const SERVICE_LABELS: Record<string, string> = {
  "3d-print": "3D Печать", "3d-modeling": "3D Моделирование",
  "3d-scanning": "3D Сканирование", "repair": "Ремонт техники",
};

const STEPS = ["new", "calculating", "accepted", "working", "printing", "postprocess", "ready", "shipped", "completed"];

export default function Tracker() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState("");

  async function handleTrack() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/orders/track/${input.trim().replace("#", "")}`);
      if (!res.ok) { setError("Заказ не найден. Проверьте номер."); return; }
      const data = await res.json();
      setResult(data);
    } catch { setError("Ошибка подключения. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  }

  const sc = result ? (STATUS_CONFIG[result.status] || STATUS_CONFIG.new) : null;
  const currentStepIdx = result ? Math.max(0, STEPS.indexOf(result.status)) : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[#060008]" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center max-w-2xl">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-black font-display uppercase mb-4 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Трекер заказа
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg mb-8">
            Введите номер заказа, чтобы узнать статус
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="flex gap-3">
            <Input
              placeholder="Например: B3DA1B2C3D"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleTrack()}
              className="bg-card/50 border-primary/20 text-base h-12"
            />
            <Button onClick={handleTrack} disabled={loading} className="rounded-full h-12 px-6 shrink-0">
              {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/60 border-t-transparent rounded-full animate-spin" /> : <><Search className="w-4 h-4 mr-2" /> Найти</>}
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 py-16 bg-background">
        <div className="container mx-auto px-4 md:px-8 max-w-2xl">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">
                {error}
              </motion.div>
            )}

            {result && sc && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className={`rounded-2xl border p-6 bg-gradient-to-br from-primary/5 to-transparent ${sc.color.split(" ").find(c => c.startsWith("border-")) || "border-primary/30"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${sc.color}`}>
                      {sc.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-display font-black text-2xl">#{result.order_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${sc.color}`}>{sc.label}</span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">{sc.desc}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{SERVICE_LABELS[result.service_type] || result.service_type}</span>
                        <span>·</span>
                        <span>{result.material?.toUpperCase()}</span>
                        <span>·</span>
                        <span>{new Date(result.created_at).toLocaleDateString("ru")}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {!["rejected"].includes(result.status) && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/15">
                    <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
                      {STEPS.slice(0, -1).map((step, i) => (
                        <div key={step} className="flex items-center gap-1 shrink-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${i <= currentStepIdx ? "bg-primary border-primary text-white" : "border-primary/20 text-muted-foreground"}`}>
                            {i < currentStepIdx ? "✓" : i + 1}
                          </div>
                          {i < STEPS.length - 2 && (
                            <div className={`h-0.5 w-6 transition-all ${i < currentStepIdx ? "bg-primary" : "bg-primary/15"}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Шаг {Math.min(currentStepIdx + 1, STEPS.length - 1)} из {STEPS.length - 1}: <span className="text-foreground font-medium">{sc.label}</span>
                    </p>
                  </div>
                )}

                {/* History */}
                {result.history && result.history.length > 0 && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/15">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-primary" /> История статусов
                    </h3>
                    <div className="space-y-2">
                      {[...result.history].reverse().map((h, i) => {
                        const hsc = STATUS_CONFIG[h.status] || STATUS_CONFIG.new;
                        return (
                          <div key={i} className="flex items-start gap-3 text-sm">
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${i === 0 ? "bg-primary" : "bg-muted"}`} />
                            <div className="flex-1">
                              <span className="font-medium">{hsc.label}</span>
                              {h.comment && <span className="text-muted-foreground ml-2">— {h.comment}</span>}
                              <div className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("ru")}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </motion.div>
  );
}
