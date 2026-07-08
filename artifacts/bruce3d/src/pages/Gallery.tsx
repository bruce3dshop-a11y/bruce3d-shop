import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface GalleryItem { id: number; title: string; description?: string; imageUrl: string; category?: string; }

const CATS = ["Все", "3D Печать", "Моделирование", "Сканирование", "Фигурки", "Детали"];

function SkeletonCard() {
  return (
    <div className="rounded-3xl overflow-hidden bg-white/[0.03] border border-white/[0.07] aspect-square animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent skeleton-shimmer" />
    </div>
  );
}

export default function Gallery() {
  const [active, setActive] = useState("Все");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["gallery"],
    queryFn: () => apiFetch<{ items: GalleryItem[] }>("gallery"),
  });
  const items = data?.items || [];
  const filtered = active === "Все" ? items : items.filter(i => i.category === active);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-industrial-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/15 blur-[130px] pointer-events-none -translate-y-1/2 orb-a" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[110px] pointer-events-none -translate-y-1/2 orb-b" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/[0.08] backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Package className="w-3.5 h-3.5" /> Наши работы
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none text-gradient-cosmic">
            Галерея
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="text-white/45 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Примеры нашей работы — детали, фигурки, прototipы, архитектурные макеты.
          </motion.p>
        </div>
      </section>

      <div className="h-px section-sep" />

      {/* Filters */}
      <section className="relative z-10 pt-10 pb-6">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {CATS.map(cat => (
              <button key={cat} onClick={() => setActive(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === cat
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(147,51,234,0.4)] scale-105"
                    : "bg-white/[0.05] border border-white/[0.08] text-white/50 hover:border-primary/35 hover:text-white/80 hover:bg-white/[0.08]"
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative z-10 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <SkeletonCard />
                </motion.div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20 text-white/25">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">Галерея пуста</p>
              <p className="text-sm mt-1">Скоро здесь появятся наши работы</p>
            </motion.div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => setSelected(item)}
                    className="group relative rounded-3xl overflow-hidden cursor-pointer bg-white/[0.03] border border-white/[0.07] hover:border-primary/35 transition-all duration-300 hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] hover:-translate-y-1 aspect-square"
                  >
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <p className="text-white font-bold text-sm leading-tight">{item.title}</p>
                      {item.category && <p className="text-white/50 text-xs mt-1">{item.category}</p>}
                    </div>
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                      <ZoomIn className="w-3.5 h-3.5 text-white" />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/88 backdrop-blur-lg"
            onClick={() => setSelected(null)}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative max-w-3xl w-full rounded-3xl overflow-hidden border border-white/[0.12] shadow-2xl"
            >
              <img src={selected.imageUrl} alt={selected.title} className="w-full max-h-[72vh] object-contain bg-black/50" />
              {(selected.title || selected.description) && (
                <div className="p-5 bg-black/80 backdrop-blur-md">
                  <h3 className="font-bold text-white text-lg">{selected.title}</h3>
                  {selected.description && <p className="text-white/50 text-sm mt-1">{selected.description}</p>}
                </div>
              )}
              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/80 transition-all">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
