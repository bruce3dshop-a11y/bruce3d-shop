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
import { useEffect } from "react";

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

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!user) return null;
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
          <Route path="/order/:id">
            <RequireAuth><OrderDetail /></RequireAuth>
          </Route>
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
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            <GlobalBackground />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
