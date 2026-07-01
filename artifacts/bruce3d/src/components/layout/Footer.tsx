import { Link } from "wouter";
import { Shield, Send, Search, ShoppingBag } from "lucide-react";

const TELEGRAM_URL = "https://t.me/BRUCE_3D_SHOP_BOT";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background py-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <div className="mb-3">
              <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-10 w-auto max-w-[140px] object-contain" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Профессиональная 3D-печать в Москве и Московской области. Отправляем заказы по всей России и миру. Killer Bunny™
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Услуги</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/services" className="hover:text-primary transition-colors">3D Печать</Link>
              <Link href="/services" className="hover:text-primary transition-colors">3D Моделирование</Link>
              <Link href="/services" className="hover:text-primary transition-colors">3D Сканирование</Link>
              <Link href="/calculator" className="hover:text-primary transition-colors">Калькулятор</Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Разделы</h4>
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/gallery" className="hover:text-primary transition-colors">Галерея работ</Link>
              <Link href="/reviews" className="hover:text-primary transition-colors">Отзывы</Link>
              <Link href="/prices" className="hover:text-primary transition-colors">Цены</Link>
              <Link href="/shop" className="flex items-center gap-1 hover:text-primary transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" /> Killer Bunny™ Shop
              </Link>
              <Link href="/tracker" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Search className="w-3.5 h-3.5" /> Трекер заказа
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-foreground">Контакты</h4>
            <div className="flex flex-col gap-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Send className="w-4 h-4" /> Telegram
              </a>
              <Link href="/order" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Оформить заказ
              </Link>
              <Link href="/admin" className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-yellow-400 transition-colors mt-2">
                <Shield className="w-3 h-3" /> Панель администратора
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-muted-foreground/60">
          <span>&copy; {new Date().getFullYear()} BRUCE 3D SHOP. Все права защищены.</span>
          <span>Москва и Московская область · Доставка по всей России и миру</span>
        </div>
      </div>
    </footer>
  );
}
