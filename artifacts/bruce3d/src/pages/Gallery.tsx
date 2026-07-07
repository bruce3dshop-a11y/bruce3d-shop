import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { X, ImageOff, Trash2, Images } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import worksImg from "@assets/8D788C17-9E43-4D1F-8268-E53394789804_1782231561624.png";

interface GalleryItem {
  id: number;
  title?: string;
  description?: string;
  image_url: string;
  category?: string;
}

const categories = ["Все", "Фигурки", "Детали", "Прототипы", "Архитектура", "Ювелирка"];

const placeholderItems: GalleryItem[] = [
  { id: 1, title: "Примеры работ", description: "Разнообразие изделий", image_url: worksImg, category: "Фигурки" },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("Все");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => apiFetch<{ items: GalleryItem[] }>("gallery"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`gallery/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gallery"] });
      setConfirmDelete(null);
      if (selectedItem && selectedItem.id === confirmDelete) setSelectedItem(null);
      toast({ title: "Фото удалено из галереи" });
    },
    onError: () => {
      toast({ title: "Ошибка удаления", variant: "destructive" });
    },
  });

  const items = data?.items?.length ? data.items : placeholderItems;
  const filtered = activeCategory === "Все" ? items : items.filter(i => i.category === activeCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-industrial-grid opacity-30" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/18 blur-[140px] pointer-events-none -translate-y-1/2 ambient-glow" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/14 blur-[120px] pointer-events-none -translate-y-1/2 ambient-glow" style={{ animationDelay: "4s" }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Images className="w-3.5 h-3.5" /> Реальные проекты
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(147,51,234,0.4))" }}>
            Галерея работ
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Реальные проекты наших клиентов. Каждое изделие — ваша идея, воплощённая в пластике.
          </motion.p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">

          {/* Category filter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] border border-primary/50"
                    : "glass-card border-primary/12 hover:border-primary/35 text-muted-foreground hover:text-foreground hover:bg-primary/8"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {filtered.length > 0 ? (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence>
                {filtered.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="group cursor-pointer rounded-2xl overflow-hidden border border-purple-500/12 hover:border-purple-400/35 transition-all duration-300 relative glass-card"
                    style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
                  >
                    <div
                      className="aspect-square relative overflow-hidden"
                      onClick={() => setSelectedItem(item)}
                    >
                      <img
                        src={item.image_url}
                        alt={item.title || "Работа"}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                        {item.title && (
                          <span className="text-white text-sm font-medium">{item.title}</span>
                        )}
                      </div>
                      {/* Purple glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/0 to-violet-600/0 group-hover:from-purple-900/10 group-hover:to-violet-600/10 transition-all duration-300" />
                    </div>

                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(item.id); }}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        title="Удалить фото"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <ImageOff className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Нет работ в этой категории</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative max-w-3xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute -top-4 -right-4 z-10 w-9 h-9 rounded-full bg-black/70 border border-white/10 hover:bg-primary/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => setConfirmDelete(selectedItem.id)}
                  className="absolute -top-4 -right-14 z-10 w-9 h-9 rounded-full bg-red-600/80 hover:bg-red-600 flex items-center justify-center transition-colors"
                  title="Удалить из галереи"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
              <div className="rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_60px_rgba(147,51,234,0.2)]">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title || ""}
                  className="w-full"
                />
              </div>
              {(selectedItem.title || selectedItem.description) && (
                <div className="mt-4 text-center glass-card rounded-xl px-6 py-3 mx-4">
                  {selectedItem.title && <h3 className="text-white font-semibold">{selectedItem.title}</h3>}
                  {selectedItem.description && <p className="text-white/60 text-sm mt-1">{selectedItem.description}</p>}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">Удалить фото?</h3>
              <p className="text-muted-foreground text-sm mb-6">Это действие необратимо. Фото будет удалено из галереи.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-2 rounded-lg border border-primary/20 hover:bg-white/5 transition-colors text-sm"
                >
                  Отмена
                </button>
                <button
                  onClick={() => deleteMutation.mutate(confirmDelete)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {deleteMutation.isPending ? "Удаление..." : "Удалить"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
