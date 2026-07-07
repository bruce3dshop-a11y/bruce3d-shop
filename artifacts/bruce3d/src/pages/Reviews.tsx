import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Plus, X, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import reviewsImg from "@assets/B0520D0A-FD5F-499A-A0D0-48819F4CCDA8_1782231561624.png";

interface Review {
  id: number;
  name: string;
  role?: string;
  rating: number;
  text: string;
  created_at: string;
}

const staticReviews: Review[] = [
  { id: -1, name: "Иван П.", role: "Инженер-конструктор", rating: 5, text: "Отличное качество печати сложных деталей. Все размеры точно соответствуют модели. Будем сотрудничать!", created_at: "" },
  { id: -2, name: "Алексей К.", role: "Коллекционер", rating: 5, text: "Фигурка получилась просто потрясающая! Проработка деталей на высоте. Спасибо за качественную работу!", created_at: "" },
  { id: -3, name: "Мария С.", role: "Архитектор", rating: 5, text: "Заказываю архитектурные макеты не в первый раз. Всегда всё аккуратно, быстро и с учётом всех пожеланий.", created_at: "" },
  { id: -4, name: "Дмитрий В.", role: "Разработчик устройств", rating: 5, text: "Печатал функциональные детали для прототипа. Всё собралось идеально. Отличное качество и быстрая доставка!", created_at: "" },
  { id: -5, name: "Ольга М.", role: "Дизайнер", rating: 5, text: "Нужна была деталь сложной формы. Сделали даже лучше, чем я ожидала. Спасибо за профессионализм!", created_at: "" },
  { id: -6, name: "Сергей Л.", role: "Автолюбитель", rating: 5, text: "Напечатали редкую деталь для моего авто. Прочная, точная как оригинал. Очень выручили!", created_at: "" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-7 h-7 transition-colors ${i <= (hovered || value) ? "fill-primary text-primary drop-shadow-[0_0_6px_rgba(147,51,234,0.8)]" : "text-muted"}`} />
        </button>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", rating: 5, text: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["reviews"],
    queryFn: () => apiFetch<{ reviews: Review[] }>("reviews"),
  });

  const dbReviews = data?.reviews || [];
  const sortedDb = [...dbReviews].sort((a: any, b: any) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
  const allReviews = [...sortedDb, ...staticReviews];

  const submitMutation = useMutation({
    mutationFn: () => apiFetch<{ message: string }>("reviews", {
      method: "POST",
      body: JSON.stringify(form),
    }),
    onSuccess: (data) => {
      toast({ title: "✅ " + (data.message || "Отзыв отправлен на модерацию!") });
      setForm({ name: "", role: "", rating: 5, text: "" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: () => toast({ title: "Ошибка отправки", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.text.trim()) {
      toast({ title: "Заполните имя и текст отзыва", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-industrial-grid opacity-30" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/18 blur-[140px] pointer-events-none -translate-y-1/2 ambient-glow" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/14 blur-[120px] pointer-events-none -translate-y-1/2 ambient-glow" style={{ animationDelay: "2.5s" }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-current" /> Рейтинг 5.0 · Более 500 клиентов
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(147,51,234,0.4))" }}>
            Отзывы клиентов
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Более 500 довольных клиентов. Качество. Точность. Надёжность.
          </motion.p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12"
          >
            {allReviews.map((review) => (
              <motion.div key={review.id} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className={`relative overflow-hidden rounded-2xl glass-card glass-card-hover p-6 h-full transition-all ${
                  (review as any).pinned ? "border-primary/35" : ""
                }`}>
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 via-primary/30 to-transparent" />
                {/* Quote icon bg */}
                <Quote className="absolute top-4 right-4 w-12 h-12 text-primary/8 rotate-180" />

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                    ))}
                  </div>
                  {(review as any).pinned && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">📌</span>}
                </div>

                {/* Avatar initial */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white leading-none">{review.name}</h3>
                    {review.role && <p className="text-xs text-primary/70 mt-0.5">{review.role}</p>}
                  </div>
                </div>

                <p className="text-muted-foreground leading-relaxed italic text-sm">"{review.text}"</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Submit form toggle */}
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            {!showForm ? (
              <div className="text-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="rounded-full gap-2 border-primary/30 hover:border-primary/60"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" /> Оставить отзыв
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
                <div className="rounded-2xl glass-card p-6 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      <h3 className="font-display font-bold text-lg">Оставить отзыв</h3>
                    </div>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground text-xs mb-1.5 block">Оценка</Label>
                      <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Имя *</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ваше имя" className="bg-black/30 border-white/10 focus:border-primary/40" />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1.5 block">Кем работаете</Label>
                        <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                          placeholder="Инженер, дизайнер..." className="bg-black/30 border-white/10 focus:border-primary/40" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1.5 block">Отзыв *</Label>
                      <Textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                        placeholder="Расскажите о своём опыте с BRUCE 3D SHOP..." className="bg-black/30 border-white/10 focus:border-primary/40 min-h-[100px]" />
                    </div>
                    <p className="text-xs text-muted-foreground/70">После отправки отзыв пройдёт модерацию и будет опубликован.</p>
                    <Button type="submit" className="w-full rounded-full" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? "Отправляем..." : "Отправить отзыв"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Photo */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Отзывы наших клиентов
              </h2>
              <p className="text-muted-foreground">Качество. Точность. Надёжность.</p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_60px_rgba(147,51,234,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-10" />
              <img src={reviewsImg} alt="Отзывы клиентов BRUCE 3D SHOP" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
