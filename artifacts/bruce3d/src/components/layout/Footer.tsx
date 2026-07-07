import { Link } from "wouter";
import { Shield, Send, Search, ShoppingBag, ArrowUpRight } from "lucide-react";

const TELEGRAM_URL = "https://t.me/BRUCE_3D_SHOP_BOT";

export function Footer() {
  return (
    <footer className="relative border-t border-purple-500/10 overflow-hidden">
      {/* Glass background */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      {/* Ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-purple-800/10 blur-3xl pointer-events-none" />
      {/* Top border glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="mb-4">
              <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-10 w-auto max-w-[140px] object-contain" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Профессиональная 3D-печать в Москве. Отправляем заказы по всей России и миру. Killer Bunny™
            </p>
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border border-primary/25 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all">
              <Send className="w-3.5 h-3.5" /> Написать в Telegram <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground/90 uppercase tracking-wider">Услуги</h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link href="/services" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">3D Печать</Link>
              <Link href="/services" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">3D Моделирование</Link>
              <Link href="/services" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">3D Сканирование</Link>
              <Link href="/calculator" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200 flex items-center gap-1.5">Калькулятор цен</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground/90 uppercase tracking-wider">Разделы</h4>
            <div className="flex flex-col gap-2.5 text-sm text-muted-foreground">
              <Link href="/gallery" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200">Галерея работ</Link>
              <Link href="/reviews" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200">Отзывы</Link>
              <Link href="/prices" className="hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200">Цены</Link>
              <Link href="/shop" className="flex items-center gap-1.5 hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200">
                <ShoppingBag className="w-3.5 h-3.5 shrink-0" /> Killer Bunny™ Shop
              </Link>
              <Link href="/tracker" className="flex items-center gap-1.5 hover:text-primary transition-colors hover:translate-x-1 transition-transform duration-200">
                <Search className="w-3.5 h-3.5 shrink-0" /> Трекер заказа
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-foreground/90 uppercase tracking-wider">Контакты</h4>
            <div className="flex flex-col gap-2.5">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Send className="w-4 h-4 text-primary/60" /> Telegram Bot
              </a>
              <Link href="/order" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary/60" /> Оформить заказ
              </Link>
              <div className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
                Москва и Московская область<br />
                Доставка по всей России и миру
              </div>
              <Link href="/admin" className="flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-yellow-400 transition-colors mt-2">
                <Shield className="w-3 h-3" /> Панель администратора
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground/50">
          <span>&copy; {new Date().getFullYear()} BRUCE 3D SHOP. Все права защищены.</span>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_4px_#4ade80]" />
            <span>Принимаем заказы</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
