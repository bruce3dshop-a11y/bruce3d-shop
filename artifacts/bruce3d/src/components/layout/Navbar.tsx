import { Link, useRoute } from "wouter";
import { Menu, X, User, Shield, LogOut, LogIn, Home, ShoppingBag, Tag, Image, Star, Search, Printer, ChevronRight, Zap, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

function LangToggle({ dark }: { dark?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className={`flex items-center gap-1 text-xs font-bold transition-colors px-2.5 py-1.5 rounded-lg border ${
        dark
          ? "text-white/50 hover:text-white border-white/10 hover:border-white/20 hover:bg-white/5"
          : "text-muted-foreground hover:text-foreground border-transparent hover:border-border/30 hover:bg-accent/30"
      }`}
    >
      <span className={lang === "ru" ? (dark ? "text-white" : "text-foreground") : "opacity-40"}>RU</span>
      <span className="opacity-30">·</span>
      <span className={lang === "en" ? (dark ? "text-white" : "text-foreground") : "opacity-40"}>EN</span>
    </button>
  );
}

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  const isShop = href === "/shop";
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`text-sm font-medium transition-colors hover:text-primary ${isActive ? "text-primary" : isShop ? "text-purple-300 hover:text-primary" : "text-muted-foreground"}`}
    >
      {label}
    </Link>
  );
}

const NAV_ITEMS = [
  { href: "/",            icon: Home,        labelKey: "home" as const },
  { href: "/shop",        icon: ShoppingBag, labelKey: "shop" as const },
  { href: "/services",    icon: Printer,     labelKey: "services" as const },
  { href: "/prices",      icon: Tag,         labelKey: "prices" as const },
  { href: "/gallery",     icon: Image,       labelKey: "gallery" as const },
  { href: "/reviews",     icon: Star,        labelKey: "reviews" as const },
  { href: "/calculator",  icon: Calculator,  labelKey: "calculator" as const },
  { href: "/tracker",     icon: Search,      labelKey: "tracker" as const },
];

function MobileMenu({
  isOpen, onClose, user, isAdmin, activeCount, logout, t, lang, setLang,
}: {
  isOpen: boolean; onClose: () => void;
  user: any; isAdmin: boolean; activeCount: number;
  logout: () => void; t: any; lang: string; setLang: (l: any) => void;
}) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const initials = user?.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-[320px] max-w-[90vw] flex flex-col"
            style={{ background: "linear-gradient(160deg, #0d0d1a 0%, #111127 60%, #0d0d1a 100%)" }}
          >
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/5">
              <Link href="/" onClick={onClose} className="flex items-center gap-2.5">
                <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-10 w-10 object-contain" />
                <span className="text-sm font-black tracking-tight leading-none text-white">
                  BRUCE <span className="text-primary">3D</span> SHOP
                </span>
              </Link>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* ── USER BLOCK AT TOP ── */}
            <div className="relative px-4 pt-3 pb-2 border-b border-white/5">
              {user ? (
                <div className="space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-black shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                      <div className="text-xs text-white/40">Личный кабинет</div>
                    </div>
                    {activeCount > 0 && (
                      <span className="text-[10px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">
                        {activeCount}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </Link>
                  <button
                    onClick={() => { logout(); onClose(); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 w-full text-left transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4 text-white/30 group-hover:text-red-400 transition-colors" />
                    </div>
                    <span className="text-sm text-white/40 group-hover:text-red-400 transition-colors">{t.nav.logout}</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <LogIn className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/60 group-hover:text-white transition-colors">{t.nav.login}</div>
                    <div className="text-xs text-white/30">Войдите в аккаунт</div>
                  </div>
                </Link>
              )}
            </div>

            {/* Nav links */}
            <nav className="relative flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {NAV_ITEMS.map(({ href, icon: Icon, labelKey }, i) => (
                <MobileNavItem
                  key={href}
                  href={href}
                  icon={Icon}
                  label={t.nav[labelKey]}
                  delay={i * 0.04}
                  onClick={onClose}
                  isShop={href === "/shop"}
                />
              ))}

              {isAdmin && (
                <>
                  <div className="my-3 border-t border-white/5" />
                  <Link
                    href="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-500/10 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-yellow-400/60 group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <span className="text-sm text-yellow-400/70 group-hover:text-yellow-400 transition-colors">{t.nav.admin}</span>
                  </Link>
                </>
              )}

              {/* Lang */}
              <div className="flex items-center justify-between px-3 py-2 mt-2">
                <span className="text-xs text-white/25">Язык / Language</span>
                <LangToggle dark />
              </div>
            </nav>

            {/* CTA button */}
            <div className="relative px-4 pb-6 pt-3 border-t border-white/5">
              <Link href="/order" onClick={onClose}>
                <button className="relative w-full rounded-2xl overflow-hidden group" style={{ height: 52 }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-white/10 to-violet-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <div className="relative flex items-center justify-center gap-2 text-white font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    {t.nav.order}
                  </div>
                </button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MobileNavItem({
  href, icon: Icon, label, delay, onClick, isShop,
}: {
  href: string; icon: any; label: string; delay: number; onClick: () => void; isShop?: boolean;
}) {
  const [isActive] = useRoute(href === "/" ? "/" : href);
  return (
    <Link href={href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group cursor-pointer ${
          isActive
            ? "bg-primary/15 border border-primary/30"
            : "hover:bg-white/5 border border-transparent"
        }`}
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          isActive
            ? "bg-primary/20 text-primary"
            : isShop
            ? "bg-purple-500/10 text-purple-300 group-hover:bg-purple-500/20"
            : "bg-white/5 text-white/30 group-hover:bg-white/10 group-hover:text-white/70"
        }`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`text-sm font-medium transition-colors ${
          isActive ? "text-primary" : isShop ? "text-purple-300" : "text-white/60 group-hover:text-white"
        }`}>
          {label}
        </span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
      </div>
    </Link>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { t, lang, setLang } = useI18n();

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<{ orders: { status: string }[] }>("orders/my"),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const activeCount = ordersData?.orders?.filter(o => !["completed","rejected","confirmed","cancelled"].includes(o.status)).length ?? 0;

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/services", label: t.nav.services },
    { href: "/prices", label: t.nav.prices },
    { href: "/gallery", label: t.nav.gallery },
    { href: "/reviews", label: t.nav.reviews },
    { href: "/calculator", label: t.nav.calculator },
    { href: "/tracker", label: t.nav.tracker },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-11 w-11 object-contain" />
            <span className="text-base font-black tracking-tight leading-none">
              BRUCE <span className="text-primary">3D</span> SHOP
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5">
            {links.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            <LangToggle />
            {isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5 text-yellow-500/70 hover:text-yellow-400 text-xs px-2">
                  <Shield className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-1.5 relative">
                    <User className="w-4 h-4" />
                    {user.name.split(" ")[0]}
                    {activeCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary dot-pulse" />
                    )}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground"
                  onClick={() => logout()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LogIn className="w-4 h-4" /> {t.nav.login}
                </Button>
              </Link>
            )}
            <Link href="/order" className="btn-shimmer inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
              {t.nav.order}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-6 w-6" />
            {activeCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </header>

      <MobileMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
        isAdmin={isAdmin}
        activeCount={activeCount}
        logout={logout}
        t={t}
        lang={lang}
        setLang={setLang}
      />
    </>
  );
}
