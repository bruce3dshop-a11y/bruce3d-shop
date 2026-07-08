import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { I18nProvider } from "./lib/i18n";
import { GlobalBackground } from "./components/VideoBackground";
import ContactWidget from "./components/ContactWidget";
import SupportChat from "./components/SupportChat";
import NotFound from "@/pages/not-found";
import { useEffect, Component, type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import Home from "@/pages/Home";
import Services from "@/pages/Services";
import Materials from "@/pages/Materials";
import Prices from "@/pages/Prices";
import Reviews from "@/pages/Reviews";
import Order from "@/pages/Order";
import Calculator from "@/pages/Calculator";
import Gallery from "@/pages/Gallery";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import OrderDetail from "@/pages/OrderDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Shop from "@/pages/Shop";
import Tracker from "@/pages/Tracker";
import Privacy from "@/pages/Privacy";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient();

/* ── Per-page meta ─────────────────────────────────────────────────────── */
const ROUTE_META: Record<string, { title: string; description: string }> = {
  "/": {
    title: "BRUCE 3D SHOP — 3D-печать в Москве",
    description: "Профессиональная 3D-печать: PLA, PETG, ABS, TPU, смола. Онлайн-заказ, доставка по России.",
  },
  "/services": {
    title: "Услуги — BRUCE 3D SHOP",
    description: "3D-печать, постобработка, покраска, прототипирование. Killer Bunny™.",
  },
  "/materials": {
    title: "Материалы — BRUCE 3D SHOP",
    description: "PLA, PETG, ABS, TPU, Resin — характеристики и применение каждого материала.",
  },
  "/prices": {
    title: "Цены — BRUCE 3D SHOP",
    description: "Актуальные цены на 3D-печать. Прозрачный расчёт стоимости.",
  },
  "/reviews": {
    title: "Отзывы — BRUCE 3D SHOP",
    description: "Отзывы клиентов BRUCE 3D SHOP о качестве 3D-печати и сервисе.",
  },
  "/calculator": {
    title: "Калькулятор — BRUCE 3D SHOP",
    description: "Онлайн-калькулятор стоимости 3D-печати. Рассчитайте цену за секунды.",
  },
  "/gallery": {
    title: "Галерея работ — BRUCE 3D SHOP",
    description: "Примеры наших 3D-работ: фигурки, детали, прототипы, арт.",
  },
  "/shop": {
    title: "Магазин — BRUCE 3D SHOP",
    description: "Готовые изделия и 3D-модели BRUCE 3D SHOP. Купить онлайн.",
  },
  "/tracker": {
    title: "Трекинг заказа — BRUCE 3D SHOP",
    description: "Отследите статус вашего заказа по номеру.",
  },
  "/order": {
    title: "Заказать печать — BRUCE 3D SHOP",
    description: "Оформите заказ на 3D-печать онлайн. Быстро, удобно, надёжно.",
  },
  "/dashboard": {
    title: "Мои заказы — BRUCE 3D SHOP",
    description: "История и статус ваших заказов в BRUCE 3D SHOP.",
  },
  "/profile": {
    title: "Профиль — BRUCE 3D SHOP",
    description: "Редактируйте профиль, аватар и сохранённый адрес доставки.",
  },
  "/privacy": {
    title: "Политика конфиденциальности — BRUCE 3D SHOP",
    description: "Политика обработки персональных данных BRUCE 3D SHOP.",
  },
  "/login": {
    title: "Войти — BRUCE 3D SHOP",
    description: "Войдите в аккаунт BRUCE 3D SHOP.",
  },
  "/register": {
    title: "Регистрация — BRUCE 3D SHOP",
    description: "Создайте аккаунт BRUCE 3D SHOP.",
  },
};

function updateMeta(path: string) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const route = path.startsWith(base) ? path.slice(base.length) || "/" : path;
  // match longest prefix
  const matched =
    Object.keys(ROUTE_META)
      .filter((k) => route === k || (k !== "/" && route.startsWith(k + "/")))
      .sort((a, b) => b.length - a.length)[0] ?? "/";
  const m = ROUTE_META[matched] ?? ROUTE_META["/"];
  document.title = m.title;
  const setMeta = (sel: string, val: string) => {
    const el = document.querySelector<HTMLMetaElement>(sel);
    if (el) el.setAttribute("content", val);
  };
  setMeta('meta[name="description"]', m.description);
  setMeta('meta[property="og:title"]', m.title);
  setMeta('meta[property="og:description"]', m.description);
  setMeta('meta[name="twitter:title"]', m.title);
  setMeta('meta[name="twitter:description"]', m.description);
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message || "Неизвестная ошибка" };
  }
  componentDidCatch(error: Error, info: any) { console.error("[ErrorBoundary]", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
          <p className="text-muted-foreground mb-6 max-w-md">{this.state.error}</p>
          <button className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
            onClick={() => { this.setState({ hasError: false, error: "" }); window.location.reload(); }}>
            Обновить страницу
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    updateMeta(location);
  }, [location]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  useEffect(() => {
    if (!isLoading && !user && !isAdmin) navigate("/login");
  }, [user, isAdmin, isLoading, navigate]);
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }
  if (!user && !isAdmin) return null;
  return <>{children}</>;
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/services" component={Services} />
          <Route path="/materials" component={Materials} />
          <Route path="/prices" component={Prices} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/shop" component={Shop} />
          <Route path="/tracker" component={Tracker} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/order">
            <RequireAuth><Order /></RequireAuth>
          </Route>
          <Route path="/order/:id" component={OrderDetail} />
          <Route path="/dashboard">
            <RequireAuth><Dashboard /></RequireAuth>
          </Route>
          <Route path="/profile">
            <RequireAuth><Profile /></RequireAuth>
          </Route>
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <ContactWidget />
      <SupportChat />
    </div>
  );
}

/* ── Анимированный прелоадер ── */
function Preloader({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "#020009" }}
    >
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-700/20 rounded-full blur-[80px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-violet-600/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: "0.8s" }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex flex-col items-center gap-6"
      >
        <motion.img
          src="/logo-wide.png"
          alt="BRUCE 3D SHOP"
          className="w-36 md:w-44 drop-shadow-[0_0_40px_rgba(147,51,234,0.8)]"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-2xl font-black tracking-widest mb-1"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 55%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            BRUCE 3D SHOP
          </div>
          <div className="text-xs font-bold tracking-[0.4em] text-purple-400/70 uppercase">KILLER BUNNY™</div>
        </motion.div>
        <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg,#7c3aed,#c084fc,#a855f7)" }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-white/30 tracking-wider"
        >
          Загрузка...
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  const isFirstVisit = !sessionStorage.getItem("visited");

  useEffect(() => {
    sessionStorage.setItem("visited", "1");
    updateMeta(window.location.pathname);
    if (!isFirstVisit) setLoading(false);
  }, [isFirstVisit]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <GlobalBackground />
              <AnimatePresence>
                {loading && isFirstVisit && (
                  <Preloader key="preloader" onDone={() => setLoading(false)} />
                )}
              </AnimatePresence>
              {(!loading || !isFirstVisit) && (
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                </WouterRouter>
              )}
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
