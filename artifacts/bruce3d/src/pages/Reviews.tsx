import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Quote, Plus, X, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import reviewsImg from "@assets/B0520D0A-FD5F-499A-A0D0-48819F4CCDA8_1782231561624.png";

interface Review {
  id: number; name: string; role?: string; rating: number; text: string; created_at: string;
}

const staticReviews: Review[] = [
  { id: -1, name: "Иван П.", role: "Инженер-конструктор", rating: 5, text: "Отличное качество печати сложных деталей. Все размеры точно соответствуют модели. Будем сотрудничать!", created_at: "" },
  { id: -2, name: "Алексей К.", role: "Коллекционер", rating: 5, text: "Фигурка получилась просто потрясающая! Проработка деталей на высоте. Спасибо за качественную работу!", created_at: "" },
  { id: -3, name: "Мария С.", role: "Архитектор", rating: 5, text: "Заказываю архитектурные макеты не в первый раз. Всегда всё аккуратно, быстро и с учётом всех пожеланий.", created_at: "" },
  { id: -4, name: "Дмитрий В.", role: "Разработчик устройств", rating: 5, text: "Печатал функциональные детали для прототипа. Всё собралось идеально. Отличное качество и быстрая доставка!", created_at: "" },
  { id: -5, name: "Ольга М.", role: "Дизайнер", rating: 5, text: "Нужна была деталь сложной формы. Сделали даже лучше, чем я ожидала. Спасибо за профессионализм!", created_at: "" },
  { id: -6, name: "Сергей Л.", role: "Автолюбитель", rating: 5, text: "Напечатали редкую деталь для моего авто. Прочная, точная как оригинал. Очень выручили!", created_at: "" },
];

const INPUT_CLS = "rounded-2xl border bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:ring-0 text-sm transition-all";

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(0)} className="transition-transform hover:scale-115">
          <Star className={`w-7 h-7 transition-colors ${i <= (hovered || value) ? "fill-primary text-primary drop-shadow-[0_0_6px_rgba(147,51,234,0.8)]" : "text-white/20"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const initials = review.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative flex flex-col gap-4 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/22 hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-1"
    >
      <Quote className="w-6 h-6 text-primary/30 absolute top-5 right-5" />
      <div className="flex gap-0.5">
        {[...Array(review.rating)].map((_,i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-white/65 text-sm leading-relaxed italic">"{review.text}"</p>
      <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06]">
        <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center text-xs font-black text-primary shrink-0">
          {initials}
        </div>
        <div>
          <div className="text-white/80 font-semibold text-sm">{review.name}</div>
          {review.role && <div className="text-white/35 text-xs">{review.role}</div>}
        </div>
      </div>
    </motion.div>
  );
}

export default function Reviews() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", role: "", rating: 5, text: "" });
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
    mutationFn: () => apiFetch<{ message: string }>("reviews", { method: "POST", body: JSON.stringify(formData) }),
    onSuccess: (data) => {
      toast({ title: "✅ " + (data.message || "Отзыв отправлен на модерацию!") });
      setFormData({ name: "", role: "", rating: 5, text: "" });
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: () => toast({ title: "Ошибка отправки", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.text.trim()) {
      toast({ title: "Заполните имя и текст отзыва", variant: "destructive" });
      return;
    }
    submitMutation.mutate();
  };

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
            <Star className="w-3.5 h-3.5 fill-primary" /> Отзывы клиентов
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none text-gradient-cosmic">
            Отзывы
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="text-white/45 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-8">
            Более 500 довольных клиентов. Рейтинг 5.0 ★ на всех платформах.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="flex justify-center gap-3">
            <button
              onClick={() => setShowForm(v => !v)}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-sm font-semibold hover:bg-primary/18 hover:border-primary/45 transition-all">
              {showForm ? <><X className="w-4 h-4" /> Отмена</> : <><Plus className="w-4 h-4" /> Оставить отзыв</>}
            </button>
          </motion.div>
        </div>
      </section>

      <div className="h-px section-sep" />

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.section
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="container mx-auto px-4 md:px-8 max-w-xl py-10">
              <form onSubmit={handleSubmit} className="space-y-4 p-7 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                <h3 className="text-lg font-black text-white mb-5 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Написать отзыв
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Ваше имя *" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} className={INPUT_CLS} />
                  <Input placeholder="Профессия / должность" value={formData.role} onChange={e => setFormData(f => ({ ...f, role: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <p className="text-xs text-white/40 mb-2">Ваша оценка</p>
                  <StarRating value={formData.rating} onChange={v => setFormData(f => ({ ...f, rating: v }))} />
                </div>
                <Textarea placeholder="Расскажите о вашем опыте работы с нами *" rows={4} value={formData.text}
                  onChange={e => setFormData(f => ({ ...f, text: e.target.value }))}
                  className={`${INPUT_CLS} resize-none p-4 leading-relaxed`} />
                <Button type="submit" disabled={submitMutation.isPending} className="w-full h-11 rounded-2xl font-semibold">
                  {submitMutation.isPending ? "Отправка..." : "Отправить отзыв"}
                </Button>
                <p className="text-xs text-white/25 text-center">Отзыв появится после модерации</p>
              </form>
            </div>
            <div className="h-px section-sep" />
          </motion.section>
        )}
      </AnimatePresence>

      {/* Reviews grid */}
      <section className="relative z-10 py-12 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Photo */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-12">
            <div className="relative rounded-3xl overflow-hidden border border-purple-500/15 shadow-[0_0_60px_rgba(147,51,234,0.10)]">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />
              <img src={reviewsImg} alt="Отзывы клиентов BRUCE 3D SHOP" className="w-full object-cover" loading="lazy" decoding="async" />
            </div>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
