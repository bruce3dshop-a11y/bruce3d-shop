import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote, Plus, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

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
  // Pinned reviews shown first
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
    <motion.div initial="hidden" animate="show" className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-3xl mb-12">
        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold font-display mb-4">
          Отзывы <span className="text-primary">клиентов</span>
        </motion.h1>
        <motion.p variants={itemVariants} className="text-lg text-muted-foreground">
          Более 500 довольных клиентов. Качество. Точность. Надёжность.
        </motion.p>
      </div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {allReviews.map((review) => (
          <motion.div key={review.id} variants={itemVariants}>
            <Card className={`h-full bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors relative overflow-hidden ${(review as any).pinned ? "border-primary/40 bg-primary/5" : ""}`}>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/60 to-transparent" />
              <Quote className="absolute top-4 right-4 w-10 h-10 text-primary/10 rotate-180" />
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted"}`} />
                    ))}
                  </div>
                  {(review as any).pinned && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">📌</span>}
                </div>
                <h3 className="font-display text-lg font-semibold">{review.name}</h3>
                {review.role && <p className="text-sm text-primary/80">{review.role}</p>}
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed italic text-sm">"{review.text}"</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-16">
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
            <Card className="bg-card/40 border-border/50">
              <CardContent className="pt-6">
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2">
            Отзывы <span className="text-primary">наших клиентов</span>
          </h2>
          <p className="text-muted-foreground">Качество. Точность. Надёжность.</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.12)]">
          <img src={reviewsImg} alt="Отзывы клиентов BRUCE 3D SHOP" className="w-full object-cover" />
        </div>
      </motion.div>
    </motion.div>
  );
}
