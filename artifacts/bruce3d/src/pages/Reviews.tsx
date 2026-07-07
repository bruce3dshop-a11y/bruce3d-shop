import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Plus, X } from "lucide-react";
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
        >
          <Star className={`w-7 h-7 transition-colors ${i <= (hovered || value) ? "fill-primary text-primary" : "text-muted"}`} />
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
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03000a]/55 via-[#03000a]/40 to-[#03000a]/60" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-4 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Отзывы клиентов
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto">
            Более 500 довольных клиентов. Качество. Точность. Надёжность.
          </motion.p>
        </div>
      </section>

      <section className="relative z-10 py-16 md:py-20 bg-transparent">
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
                className={`relative overflow-hidden rounded-2xl border p-6 h-full transition-all ${
                  (review as any).pinned
                    ? "border-primary/40 bg-primary/8"
                    : "border-primary/15 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/30"
                }`}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent" />
                <Quote className="absolute top-4 right-4 w-10 h-10 text-primary/10 rotate-180" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                    ))}
                  </div>
                  {(review as any).pinned && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">📌</span>}
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-0.5">{review.name}</h3>
                {review.role && <p className="text-sm text-primary/80 mb-3">{review.role}</p>}
                <p className="text-muted-foreground leading-relaxed italic text-sm">"{review.text}"</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-16">
            {!showForm ? (
              <div className="text-center">
                <Button
                  onClick={() => setShowForm(true)}
                  className="rounded-full gap-2"
                  variant="outline"
                >
                  <Plus className="w-4 h-4" /> Оставить отзыв
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto">
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg">Оставить отзыв</h3>
                    <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label>Оценка</Label>
                      <div className="mt-1">
                        <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Имя *</Label>
                        <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Ваше имя" className="mt-1 bg-background/50" />
                      </div>
                      <div>
                        <Label>Кем работаете</Label>
                        <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                          placeholder="Инженер, дизайнер..." className="mt-1 bg-background/50" />
                      </div>
                    </div>
                    <div>
                      <Label>Отзыв *</Label>
                      <Textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                        placeholder="Расскажите о своём опыте с BRUCE 3D SHOP..." className="mt-1 bg-background/50 min-h-[100px]" />
                    </div>
                    <p className="text-xs text-muted-foreground">После отправки отзыв пройдёт модерацию и будет опубликован.</p>
                    <Button type="submit" className="w-full rounded-full" disabled={submitMutation.isPending}>
                      {submitMutation.isPending ? "Отправляем..." : "Отправить отзыв"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2"
                style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Отзывы наших клиентов
              </h2>
              <p className="text-muted-foreground">Качество. Точность. Надёжность.</p>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.15)]">
              <img src={reviewsImg} alt="Отзывы клиентов BRUCE 3D SHOP" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
