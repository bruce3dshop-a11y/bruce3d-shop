import { Link, useRoute } from "wouter";
import { Menu, X, User, Shield, LogOut, LogIn } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useI18n, type Lang } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

function LangToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className="flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-accent/30 border border-transparent hover:border-border/30"
      title="Switch language"
    >
      <span className={lang === "ru" ? "text-foreground" : "text-muted-foreground/50"}>RU</span>
      <span className="text-border/60">·</span>
      <span className={lang === "en" ? "text-foreground" : "text-muted-foreground/50"}>EN</span>
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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const { t } = useI18n();

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<{ orders: { status: string }[] }>("orders/my"),
    enabled: !!user,
    refetchInterval: 30000,
    staleTime: 20000,
  });
  const activeCount = ordersData?.orders?.filter(o => !["completed","rejected","confirmed"].includes(o.status)).length ?? 0;

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/services", label: t.nav.services },
    { href: "/prices", label: t.nav.prices },
    { href: "/gallery", label: t.nav.gallery },
    { href: "/reviews", label: t.nav.reviews },
    { href: "/tracker", label: t.nav.tracker },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-12 w-12 object-contain" />
          <span className="font-display font-bold text-lg tracking-tight text-foreground">
            BRUCE <span className="text-primary">3D</span> <span className="text-sm font-normal text-muted-foreground">SHOP</span>
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
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-b border-border/40 bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {links.map((link) => (
              <NavLink key={link.href} {...link} onClick={() => setIsOpen(false)} />
            ))}
            <hr className="border-border/40" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Язык / Language</span>
              <LangToggle />
            </div>
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <User className="w-4 h-4" /> {user.name}
                </Link>
                <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-400 transition-colors">
                  <LogOut className="w-4 h-4" /> {t.nav.logout}
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <LogIn className="w-4 h-4" /> {t.nav.login}
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-sm text-yellow-400 hover:text-yellow-300 transition-colors">
                <Shield className="w-4 h-4" /> {t.nav.admin}
              </Link>
            )}
            <Link
              href="/order"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-10 w-full items-center justify-center whitespace-nowrap rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 mt-1"
            >
              {t.nav.order}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
