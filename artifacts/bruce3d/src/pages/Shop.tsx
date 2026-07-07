import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { ExternalLink, ShoppingBag, Star, Zap, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
const killerBunnyCollection = "/killer-bunny-catalog.png";

interface Product {
  id: number;
  title: string;
  description?: string;
  price?: string;
  discount_price?: string;
  image_url: string;
  extra_images?: string;
  external_link?: string;
  badge?: string;
  series?: string;
  in_stock: boolean;
}

const BADGE_STYLES: Record<string, string> = {
  "хит": "bg-orange-500 text-white",
  "новинка": "bg-green-500 text-white",
  "осталось мало": "bg-yellow-500 text-black",
  "ограниченное количество": "bg-red-500 text-white",
  "exclusive": "bg-purple-600 text-white",
};

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const badgeStyle = product.badge ? (BADGE_STYLES[product.badge.toLowerCase()] || "bg-primary text-white") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/50 hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-primary/10 hover:shadow-2xl">
        {badgeStyle && (
          <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${badgeStyle}`}>
            {product.badge}
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/80 px-3 py-1 rounded-full">Нет в наличии</span>
          </div>
        )}
        <div className="aspect-square overflow-hidden bg-black/20">
          <img src={product.image_url} alt={product.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        </div>
        <div className="p-4">
          <h3 className="font-display font-bold text-base text-white mb-1 line-clamp-1">{product.title}</h3>
          {product.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div>
              {product.discount_price && (
                <div className="text-muted-foreground text-xs line-through">{product.price} ₽</div>
              )}
              {(product.price || product.discount_price) && (
                <div className="text-primary font-bold text-lg">
                  {product.discount_price || product.price} ₽
                </div>
              )}
            </div>
            {product.external_link && (
              <a href={product.external_link} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors font-medium">
                Купить <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProductModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [activeImg, setActiveImg] = useState(product.image_url);
  const extras: string[] = product.extra_images ? JSON.parse(product.extra_images) : [];
  const allImages = [product.image_url, ...extras];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-3xl w-full bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors">
          <X className="w-4 h-4" />
        </button>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="bg-black/20">
            <div className="aspect-square overflow-hidden">
              <img src={activeImg} alt={product.title} className="w-full h-full object-cover" />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {allImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(img)}
                    className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${activeImg === img ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col">
            {product.badge && (
              <div className={`self-start px-3 py-1 rounded-full text-xs font-bold uppercase mb-3 ${BADGE_STYLES[product.badge.toLowerCase()] || "bg-primary text-white"}`}>
                {product.badge}
              </div>
            )}
            <h2 className="text-2xl font-display font-black mb-2">{product.title}</h2>
            {product.series && (
              <div className="text-xs text-primary uppercase tracking-wider mb-3 font-bold">KILLER BUNNY™ — {product.series.toUpperCase()}</div>
            )}
            {product.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4 flex-1">{product.description}</p>
            )}
            <div className="mt-auto">
              {product.price && (
                <div className="mb-4">
                  {product.discount_price && (
                    <div className="text-muted-foreground text-sm line-through">{product.price} ₽</div>
                  )}
                  <div className="text-primary font-black text-3xl">{product.discount_price || product.price} ₽</div>
                </div>
              )}
              {!product.in_stock && (
                <div className="text-red-400 text-sm font-medium mb-3">Нет в наличии</div>
              )}
              {product.external_link && product.in_stock && (
                <a href={product.external_link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-primary hover:bg-primary/90 text-white font-bold transition-all hover:scale-105">
                  <ShoppingBag className="w-4 h-4" /> Перейти к покупке <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Shop() {
  const [selected, setSelected] = useState<Product | null>(null);

  const { data } = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<{ products: Product[] }>("products"),
  });

  const products = data?.products || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03000a]/55 via-[#03000a]/40 to-[#03000a]/60" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-bold mb-6 uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 fill-current" /> Эксклюзивная коллекция
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-black font-display uppercase mb-4 leading-none">
                KILLER<br /><span className="text-primary">BUNNY</span><sup className="text-2xl align-super">™</sup>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-muted-foreground text-lg max-w-md mb-8">
                Коллекционные виниловые фигурки. Каждая — уникальный характер. Премиум-материал, высота 25 см.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 text-sm">
                  <Zap className="w-4 h-4 text-primary" /> <span>Ограниченный тираж</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 text-sm">
                  <Package className="w-4 h-4 text-primary" /> <span>Высота 25 см</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/50 border border-border/50 text-sm">
                  <Star className="w-4 h-4 text-primary" /> <span>Премиум-винил</span>
                </div>
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}
              className="flex-shrink-0 w-full max-w-sm lg:max-w-md">
              <div className="relative rounded-2xl overflow-hidden border border-primary/30 shadow-[0_0_80px_rgba(147,51,234,0.25)]">
                <img src={killerBunnyCollection} alt="Killer Bunny Collection Series 01" className="w-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CATALOG */}
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black font-display uppercase mb-3">
              Каталог <span className="text-primary">коллекции</span>
            </h2>
            <p className="text-muted-foreground">Series 01 — First Edition · 10 уникальных персонажей · По 20 шт каждый</p>
          </motion.div>

          {products.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Товары скоро появятся</p>
              <p className="text-sm mt-2">Следите за обновлениями!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SERIES INFO */}
      <section className="py-16 bg-primary/5 border-t border-primary/20">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-2xl md:text-3xl font-black font-display uppercase mb-3">
            Совместный проект<br /><span className="text-primary">Killer Bunny™ × Bruce 3D Shop</span>
          </motion.h3>
          <p className="text-muted-foreground max-w-xl mx-auto">Собери всю коллекцию Series 01. Ограниченный тираж — 200 экземпляров.</p>
        </div>
      </section>

      <AnimatePresence>
        {selected && <ProductModal product={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
