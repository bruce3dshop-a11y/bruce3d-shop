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
  import { useEffect, Component, type ReactNode } from "react";

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

  const queryClient = new QueryClient();

  // Catches any React render error and shows a friendly screen instead of white screen
  class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false, error: "" };
    }
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error: error.message || "Неизвестная ошибка" };
    }
    componentDidCatch(error: Error, info: any) {
      console.error("[ErrorBoundary]", error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
            <p className="text-muted-foreground mb-6 max-w-md">{this.state.error}</p>
            <button
              className="px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:opacity-90 transition-opacity"
              onClick={() => { this.setState({ hasError: false, error: "" }); window.location.reload(); }}
            >
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
    }, [location]);
    return null;
  }

  function RequireAuth({ children }: { children: ReactNode }) {
    const { user, isAdmin, isLoading } = useAuth();
    const [, navigate] = useLocation();

    useEffect(() => {
      if (!isLoading && !user && !isAdmin) {
        navigate("/login");
      }
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
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/order">
              <RequireAuth><Order /></RequireAuth>
            </Route>
            <Route path="/order/:id" component={OrderDetail} />
            <Route path="/dashboard">
              <RequireAuth><Dashboard /></RequireAuth>
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

  function App() {
    return (
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <AuthProvider>
              <TooltipProvider>
                <GlobalBackground />
                <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                  <ErrorBoundary>
                    <Router />
                  </ErrorBoundary>
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </AuthProvider>
          </I18nProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  export default App;
  