import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Clock, CheckCircle, Truck, XCircle,
  ArrowRight, ExternalLink, CreditCard, Plus,
  Star, Search, ShoppingBag, LogOut, RefreshCw,
  Printer, PencilRuler, ScanLine, Wrench, MessageSquare, Download,
} from "lucide-react";
import ClientMiniChat from "@/components/ClientMiniChat";
import { printOrderPDF } from "@/lib/printOrderPDF";
import { useState } from "react";

interface Order {
  id: number; order_number: string; service_type: string; material: string;
  status: string; price?: number; payment_link?: string;
  created_at: string; description: string; delivery_type: string;
}

const STATUS = {
  new:        { label: "Новый",          color: "bg-blue-500/15 text-blue-400 border-blue-500/30",       icon: Clock },
  calculating:{ label: "Рассчитывается", color: "bg-sky-500/15 text-sky-400 border-sky-500/30",          icon: Clock },
  accepted:   { label: "Принят",         color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: CheckCircle },
  working:    { label: "В работе",       color: "bg-amber-500/15 text-amber-400 border-amber-500/30",     icon: Package },
  printing:   { label: "На печати",      color: "bg-violet-500/15 text-violet-400 border-violet-500/30", icon: Printer },
  postprocess:{ label: "Постобработка",  color: "bg-pink-500/15 text-pink-400 border-pink-500/30",        icon: Star },
  ready:      { label: "Готов",          color: "bg-purple-500/15 text-purple-400 border-purple-500/30", icon: CheckCircle },
  shipped:    { label: "Отправлен",      color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",       icon: Truck },
  completed:  { label: "Завершён",       color: "bg-green-500/15 text-green-400 border-green-500/30",    icon: CheckCircle },
  confirmed:  { label: "Подтверждён",    color: "bg-green-500/15 text-green-400 border-green-500/30",    icon: CheckCircle },
  rejected:   { label: "Отклонён",       color: "bg-red-500/15 text-red-400 border-red-500/30",          icon: XCircle },
} as const;

const SERVICE_ICONS: Record<string, React.ElementType> = {
  "3d-print": Printer, "3d-modeling": PencilRuler,
  "3d-scanning": ScanLine, "repair": Wrench,
};
const SERVICE_LABELS: Record<string, string> = {
  "3d-print": "3D Печать", "3d-modeling": "Моделирование",
  "3d-scanning": "Сканирование", "repair": "Ремонт",
};

const STATUS_STEPS = ["new","accepted","working","ready","shipped","completed"];

function StatusProgress({ status }: { status: string }) {
  const idx = STATUS_STEPS.indexOf(status);
  if (idx < 0 || status === "rejected") return null;
  return (
    <div className="flex items-center gap-0 mt-3">
      {STATUS_STEPS.map((s, i) => {
        const done = i <= idx;
        return (
          <div key={s} className="flex items-center flex-1">
            <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 transition-all ${done ? "bg-primary border-primary shadow-[0_0_8px_rgba(147,51,234,0.6)]" : "border-border/40 bg-background"}`} />
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-px flex-1 transition-all ${done && i < idx ? "bg-primary" : "bg-border/30"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, onConfirm, confirming }: { order: Order; onConfirm: () => void; confirming: boolean }) {
  const sc = STATUS[order.status as keyof typeof STATUS] || STATUS.new;
  const StatusIcon = sc.icon;
  const ServiceIcon = SERVICE_ICONS[order.service_type] || Package;
  const needsConfirm = order.price && order.status === "accepted";
  const isDone = ["completed","rejected","confirmed"].includes(order.status);
    const paymentUrl = (() => {
      if (!order.payment_link) return null;
      if (order.payment_link.startsWith("yookassa:")) {
        const parts = order.payment_link.slice(9).split("|");
        return parts[1] && parts[1].startsWith("http") ? parts[1] : null;
      }
      if (order.payment_link.startsWith("http")) return order.payment_link;
      return null;
    })();
  const { t } = useI18n();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className={`relative rounded-2xl border bg-card/40 backdrop-blur-sm p-5 transition-all hover:bg-card/60 ${needsConfirm ? "border-primary/40 shadow-lg shadow-primary/10" : "border-border/40 hover:border-primary/20"} ${isDone ? "opacity-70" : ""}`}>
        {needsConfirm && (
          <div className="absolute -top-px left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <ServiceIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-display font-bold text-base">#{order.order_number}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.color}`}>
                  <StatusIcon className="w-3 h-3" /> {sc.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mb-1">{order.description}</p>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground/70">
                <span className="font-medium text-foreground/50">{SERVICE_LABELS[order.service_type] || order.service_type}</span>
                <span>·</span>
                <span>{order.material?.toUpperCase()}</span>
                <span>·</span>
                <span>{new Date(order.created_at).toLocaleDateString("ru", { day: "numeric", month: "short" })}</span>
              </div>
              <StatusProgress status={order.status} />
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end shrink-0">
            {needsConfirm && (
                paymentUrl ? (
                  <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="rounded-full h-9 text-xs px-4 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 border-0 font-bold">
                      💳 Оплатить заказ
                    </Button>
                  </a>
                ) : (
                  <Button size="sm" className="rounded-full h-8 text-xs shadow-lg shadow-primary/30" onClick={onConfirm} disabled={confirming}>
                    {confirming ? "..." : "Подтвердить"}
                  </Button>
                )
              )}
              {needsConfirm && order.price && (
                <span className="text-xs text-emerald-400 font-bold text-right">К оплате: {order.price} ₽</span>
              )}
                          )}
            <Link href={`/order/${order.id}`}>
              <Button variant="outline" size="sm" className="rounded-full h-8 text-xs border-border/50 hover:border-primary/50">
                {t.dashboard.details} <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => setChatOpen(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-medium transition-colors px-2 py-1 rounded-lg ${chatOpen ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/5"}`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> {t.dashboard.chat}
            </button>
            <button
              type="button"
              onClick={() => printOrderPDF({ order: { ...order, email: null, phone: null, telegram: null }, history: [] })}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors px-2 py-1 rounded-lg"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {order.price && (
          <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">{t.dashboard.toPay}</div>
              <div className="text-primary font-black text-xl">{Number(order.price).toLocaleString("ru")} ₽</div>
            </div>
            {order.payment_link && (
              <a href={order.payment_link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 transition-colors px-4 py-2 rounded-full">
                <CreditCard className="w-3.5 h-3.5" /> {t.dashboard.pay} <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {chatOpen && <ClientMiniChat orderId={order.id} />}
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiFetch<{ orders: Order[] }>("orders/my"),
    enabled: !!user,
    refetchInterval: 20000,
  });

  const confirmMutation = useMutation({
    mutationFn: (orderId: number) => apiFetch(`orders/${orderId}/confirm`, { method: "POST" }),
    onSuccess: () => { toast({ title: "✅ Заказ подтверждён!" }); queryClient.invalidateQueries({ queryKey: ["my-orders"] }); },
  });

  const orders = ordersData?.orders || [];
  const activeOrders = orders.filter(o => !["completed","rejected","confirmed"].includes(o.status));
  const doneOrders = orders.filter(o => ["completed","rejected","confirmed"].includes(o.status));

  const initials = user?.name?.split(" ").map((p: string) => p[0]).join("").slice(0,2).toUpperCase() || "?";
  const totalSpent = orders.reduce((s, o) => s + (["confirmed","completed"].includes(o.status) ? Number(o.price || 0) : 0), 0);

  const quickLinks = [
    { icon: Plus, label: t.dashboard.newOrder, href: "/order", color: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" },
    { icon: Search, label: t.dashboard.tracker, href: "/tracker", color: "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/20" },
    { icon: ShoppingBag, label: t.dashboard.shop, href: "/shop", color: "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border-purple-500/20" },
    { icon: Star, label: t.dashboard.reviews, href: "/reviews", color: "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-10 max-w-3xl relative z-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="flex items-center justify-between mb-8 p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-primary/30">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-black font-display">
                  {t.dashboard.greeting} <span className="text-primary">{user?.name?.split(" ")[0]}!</span>
                </h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0" onClick={() => refetch()}>
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="rounded-full border-border/50" onClick={logout}>
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> {t.dashboard.logout}
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: t.dashboard.totalOrders, value: orders.length, icon: <Package className="w-4 h-4" /> },
              { label: t.dashboard.active, value: activeOrders.length, icon: <Clock className="w-4 h-4 text-amber-400" /> },
              { label: t.dashboard.spent, value: totalSpent > 0 ? `${totalSpent.toLocaleString("ru")}₽` : "—", icon: <CreditCard className="w-4 h-4 text-green-400" /> },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 rounded-xl border border-border/30 bg-card/30">
                <div className="text-muted-foreground mb-1">{s.icon}</div>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-4 gap-2 mb-8">
            {quickLinks.map((q, i) => (
              <Link key={i} href={q.href}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all hover:scale-105 text-center ${q.color}`}>
                <q.icon className="w-4 h-4" />
                <span className="text-xs font-medium leading-tight">{q.label}</span>
              </Link>
            ))}
          </motion.div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[0,1,2].map(i => <div key={i} className="h-28 rounded-2xl bg-card/30 animate-pulse border border-border/30" />)}
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="text-center py-20 rounded-2xl border border-dashed border-border/40 bg-card/20">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-1">{t.dashboard.noOrders}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">{t.dashboard.noOrdersDesc}</p>
              <Link href="/order">
                <Button className="rounded-full shadow-lg shadow-primary/30">
                  {t.dashboard.placeOrder} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {activeOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(147,51,234,0.6)]" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{t.dashboard.activeOrders}</h2>
                    <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{activeOrders.length}</span>
                  </div>
                  <div className="space-y-3">
                    {activeOrders.map(order => (
                      <OrderCard key={order.id} order={order} onConfirm={() => confirmMutation.mutate(order.id)} confirming={confirmMutation.isPending} />
                    ))}
                  </div>
                </div>
              )}
              {doneOrders.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-border/60" />
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/60">{t.dashboard.completed}</h2>
                  </div>
                  <div className="space-y-3">
                    {doneOrders.map(order => (
                      <OrderCard key={order.id} order={order} onConfirm={() => confirmMutation.mutate(order.id)} confirming={false} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
