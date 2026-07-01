import { useState, useRef } from "react";
import AdminOrderChat from "@/components/AdminOrderChat";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, saveAdminToken, clearAdminToken } from "@/lib/api";
import { getUploadSignature, uploadFileToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Package, Users, DollarSign, RefreshCw, Webhook, Star,
  BarChart3, Image, ShoppingBag, Search, Send, Pin, Trash2,
  CheckCircle, XCircle, Eye, EyeOff, Plus, Upload, ImageIcon, Link2,
  TrendingUp, Clock, Zap, MessageCircle, Users2, X,
  Download, ArrowUp, ArrowDown,
} from "lucide-react";

// ====== TYPES ======
interface Order {
  id: number; order_number: string; name: string; email?: string; phone?: string;
  telegram?: string; service_type: string; material: string; status: string;
  price?: string; payment_link?: string; delivery_type: string;
  created_at: string; description: string; file_name?: string;
}
interface Client {
  id: number; name: string; email: string; phone?: string; telegram?: string;
  created_at: string; orderCount: number; totalSpent: number;
}
interface Review {
  id: number; name: string; role?: string; rating?: number; text: string;
  approved: boolean; pinned: boolean; created_at: string;
}
interface GalleryItem { id: number; title?: string; image_url: string; category?: string; created_at: string; }
interface Product { id: number; title: string; price?: string; discount_price?: string; image_url: string; badge?: string; in_stock: boolean; hidden: boolean; series?: string; }
interface Stats { ordersByStatus: { status: string; total: number }[]; totalUsers: number; totalRevenue: number; ordersLast30Days: number; popularServices: { service: string; count: number }[]; }

const statusLabels: Record<string, string> = {
  new: "Новый", calculating: "Рассчитывается", accepted: "Принят",
  working: "В работе", printing: "На печати", postprocess: "Постобработка",
  ready: "Готов", shipped: "Отправлен", completed: "Завершён",
  confirmed: "Подтверждён клиентом", rejected: "Отклонён",
};
const statusColors: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  calculating: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  working: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  printing: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  postprocess: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  ready: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  shipped: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  confirmed: "bg-teal-500/15 text-teal-400 border-teal-500/30",
  rejected: "bg-red-500/15 text-red-400 border-red-500/30",
};
const serviceLabels: Record<string, string> = {
  "3d-print": "3D Печать", "3d-modeling": "Моделирование",
  "3d-scanning": "Сканирование", "repair": "Ремонт",
};

// ====== LOGIN ======
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd] = useState("");
  const { toast } = useToast();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch("auth/admin-login", { method: "POST", body: JSON.stringify({ password: pwd }) });
      onLogin();
      toast({ title: "Вы вошли как администратор" });
    } catch { toast({ title: "Неверный пароль", variant: "destructive" }); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-900/10 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-sm relative z-10">
        <div className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/50">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/10">
              <img src="/logo.png" alt="BRUCE 3D" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-2xl font-black font-display">Панель <span className="text-primary">администратора</span></h1>
            <p className="text-sm text-muted-foreground mt-1">BRUCE 3D SHOP</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input type="password" placeholder="Пароль администратора" value={pwd}
              onChange={e => setPwd(e.target.value)} className="bg-background/50 h-11 rounded-xl border-border/40 focus:border-primary/50" />
            <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg shadow-primary/30">
              <Shield className="w-4 h-4 mr-2" /> Войти
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

// ====== ORDERS TAB ======
function OrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [paymentLinkInput, setPaymentLinkInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date_desc"|"date_asc"|"price_desc"|"price_asc">("date_desc");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiFetch<{ orders: Order[]; yookassaEnabled: boolean }>("admin/orders"),
    refetchInterval: 15000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, comment }: { id: number; status: string; comment?: string }) =>
      apiFetch(`admin/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, comment }) }),
    onSuccess: () => { toast({ title: "Статус обновлён" }); queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setSelectedOrder(null); },
  });
  const priceMutation = useMutation({
    mutationFn: ({ id, price, paymentLink }: { id: number; price: number; paymentLink?: string }) =>
      apiFetch(`admin/orders/${id}/price`, { method: "PATCH", body: JSON.stringify({ price, paymentLink }) }),
    onSuccess: () => { toast({ title: "✅ Счёт выставлен!" }); queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); setPriceInput(""); setPaymentLinkInput(""); },
  });
  const createPaymentMutation = useMutation({
    mutationFn: ({ id, price }: { id: number; price: number }) =>
      apiFetch<{ ok: boolean; paymentUrl?: string; yookassaEnabled?: boolean }>(`admin/orders/${id}/price`, { method: "PATCH", body: JSON.stringify({ price }) }),
    onSuccess: (data) => {
      toast({ title: "✅ ЮКасса: счёт выставлен!", description: data?.paymentUrl ? "Ссылка скопирована в буфер" : "Уведомление отправлено клиенту" });
      if (data?.paymentUrl) navigator.clipboard.writeText(data.paymentUrl).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setPriceInput("");
    },
    onError: (e: any) => toast({ title: "Ошибка: " + (e?.message || ""), variant: "destructive" }),
  });

  const deleteMutation = useMutation({
      mutationFn: (id: number) => apiFetch(`admin/orders/${id}`, { method: "DELETE" }),
      onSuccess: () => { toast({ title: "🗑 Заказ удалён" }); queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); },
      onError: (e: any) => toast({ title: "Ошибка удаления: " + (e?.message || ""), variant: "destructive" }),
    });

    const STATUS_GROUPS: Record<string, string[]> = {
      new: ["new", "calculating"],
      active: ["accepted", "working", "printing", "postprocess"],
      ready: ["ready", "shipped"],
      done: ["completed", "confirmed", "rejected"],
    };
    const filtered = [...(ordersData?.orders || [])]
      .filter(o => {
        if (statusFilter !== "all" && !STATUS_GROUPS[statusFilter]?.includes(o.status)) return false;
        return !search || o.order_number.includes(search) || o.name.toLowerCase().includes(search.toLowerCase()) || o.email?.includes(search);
      })
      .sort((a, b) => {
        if (sortBy === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        {ordersData && (
          ordersData.yookassaEnabled
            ? <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />ЮКасса подключена</span>
            : <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />ЮКасса не настроена</span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск по номеру, имени, email..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-border/40 rounded-xl" />
          </div>
          <div className="flex gap-1.5 shrink-0 flex-wrap">
            {(["date_desc","date_asc","price_desc","price_asc"] as const).map(v => {
              const lbl: Record<string,string> = { date_desc:"Новые↓", date_asc:"Старые↑", price_desc:"₽↓", price_asc:"₽↑" };
              return <button key={v} onClick={() => setSortBy(v)} className={`text-xs px-2.5 py-2 rounded-xl border transition-all ${sortBy===v?"bg-primary/20 border-primary/40 text-primary font-semibold":"border-border/40 text-muted-foreground hover:text-foreground"}`}>{lbl[v]}</button>;
            })}
          </div>
        </div>
      {/* Status filter tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {([
            { key: "all", label: "Все" },
            { key: "new", label: "🔵 Новые" },
            { key: "active", label: "🟡 В работе" },
            { key: "ready", label: "🟣 Готовые" },
            { key: "done", label: "✅ Завершены" },
          ] as const).map(({ key, label }) => {
            const cnt = key === "all" ? (ordersData?.orders||[]).length : (ordersData?.orders||[]).filter(o => STATUS_GROUPS[key]?.includes(o.status)).length;
            return (
              <button key={key} onClick={() => setStatusFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${statusFilter===key ? "bg-primary/20 border-primary/40 text-primary font-semibold" : "border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/20"}`}>
                {label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter===key ? "bg-primary/20" : "bg-muted/40"}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
              {isLoading ? (
        <div className="space-y-3">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-2xl bg-card/30 animate-pulse border border-border/30" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id}
              className={`rounded-2xl border bg-card/40 backdrop-blur-sm transition-all cursor-pointer hover:bg-card/60 ${selectedOrder?.id === order.id ? "border-primary/40 bg-primary/5" : "border-border/40 hover:border-primary/20"}`}
              onClick={() => { setSelectedOrder(selectedOrder?.id === order.id ? null : order); setPriceInput(order.price?.toString() || ""); setPaymentLinkInput(order.payment_link || ""); setCommentInput(""); }}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-black font-display">#{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[order.status] || "bg-muted/10 text-muted-foreground border-border/40"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      {order.price && <span className="text-xs text-emerald-400 font-bold">{order.price} ₽</span>}
                    </div>
                    <div className="font-semibold text-sm">{order.name}</div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      {order.phone && <span>{order.phone}</span>}
                      {order.telegram && <span className="text-primary">{order.telegram}</span>}
                      {order.email && <span>{order.email}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{order.description}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div className="font-medium text-foreground/60">{serviceLabels[order.service_type] || order.service_type}</div>
                    <div>{order.material?.toUpperCase()}</div>
                    <div className="mt-1">{new Date(order.created_at).toLocaleDateString("ru", { day: "numeric", month: "short" })}</div>
                      <div className="text-[10px] opacity-60">{new Date(order.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>

                {selectedOrder?.id === order.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 pt-4 border-t border-border/30 space-y-4" onClick={e => e.stopPropagation()}>
                    {order.file_name && (() => {
                      let fileUrls: { url: string; name: string }[] = [];
                      try {
                        const parsed = JSON.parse(order.file_name);
                        if (Array.isArray(parsed)) {
                          fileUrls = parsed.map((u: string, i: number) => ({
                            url: u,
                            name: decodeURIComponent(u.split("/").pop()?.split("?")[0] || `file-${i + 1}`),
                          }));
                        } else {
                          fileUrls = [{ url: order.file_name, name: order.file_name }];
                        }
                      } catch {
                        fileUrls = [{ url: order.file_name, name: order.file_name }];
                      }
                      if (fileUrls.length === 0) return null;
                      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
                      const zipUrl = `${base}/api/admin/orders/${order.id}/files/zip`;
                      return (
                        <div className="space-y-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-medium">
                              📎 Файлы ({fileUrls.length})
                            </span>
                            {fileUrls.length > 0 && (
                              <a
                                href={zipUrl}
                                download
                                onClick={e => e.stopPropagation()}
                                className="flex items-center gap-1 text-xs bg-primary/20 hover:bg-primary/30 text-primary px-2 py-0.5 rounded-lg transition-colors font-medium"
                              >
                                <Download className="w-3 h-3" /> ZIP
                              </a>
                            )}
                          </div>
                          {fileUrls.map((f, i) => (
                            <a
                              key={i}
                              href={f.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              onClick={e => e.stopPropagation()}
                              className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 font-medium hover:underline"
                            >
                              <Download className="w-3 h-3 shrink-0" />
                              <span className="truncate">{f.name}</span>
                            </a>
                          ))}
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Изменить статус</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusLabels).map(([key, label]) => (
                          <button key={key} onClick={() => statusMutation.mutate({ id: order.id, status: key, comment: commentInput || undefined })}
                            disabled={statusMutation.isPending}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${order.status === key ? "border-primary bg-primary/20 text-primary font-semibold" : "border-border/40 hover:border-primary/40 text-muted-foreground hover:text-foreground"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                      <Input placeholder="Комментарий (необязательно)" value={commentInput}
                        onChange={e => setCommentInput(e.target.value)} className="mt-2 bg-background/50 text-sm h-8 rounded-xl border-border/40" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Выставить счёт</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                          <Input type="number" placeholder="Сумма (₽)" value={priceInput}
                            onChange={e => setPriceInput(e.target.value)} className="bg-background/50 h-9 text-sm rounded-xl border-border/40 w-32" />
                          <Button size="sm" className="rounded-xl shrink-0 h-9 px-4 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => createPaymentMutation.mutate({ id: order.id, price: Number(priceInput) })}
                            disabled={!priceInput || createPaymentMutation.isPending}
                            title="Создать платёж ЮКасса и отправить ссылку клиенту в Telegram">
                            ⚡ ЮКасса
                          </Button>
                          <Button size="sm" variant="outline" className="rounded-xl shrink-0 h-9 px-3 border-border/40"
                            onClick={() => priceMutation.mutate({ id: order.id, price: Number(priceInput), paymentLink: paymentLinkInput || undefined })}
                            disabled={!priceInput || priceMutation.isPending}>
                            💰 Вручную
                          </Button>
                          <Input type="url" placeholder="Ссылка на оплату (вручную)" value={paymentLinkInput}
                              onChange={e => setPaymentLinkInput(e.target.value)} className="bg-background/50 h-9 text-sm rounded-xl border-border/40 flex-1 min-w-[180px]" />
                        </div>
                        {order.payment_link?.startsWith("yookassa:") && (
                          <div className="text-xs text-emerald-400 flex items-center gap-1.5 mb-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            Платёж ЮКасса · {order.payment_link.replace("yookassa:","")}
                          </div>
                        )}
                    </div>
                                        <div className="flex items-center justify-between pt-1">
                        <a href={`${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/order/${order.id}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors"><Link2 className="w-3 h-3" /> Открыть страницу заказа</a>
                        <Button variant="ghost" size="sm"
                          onClick={() => { if (window.confirm(`Удалить заказ #${order.order_number}? Это действие нельзя отменить.`)) deleteMutation.mutate(order.id); }}
                          disabled={deleteMutation.isPending}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl h-8 px-3 text-xs">
                          <Trash2 className="w-3 h-3 mr-1" /> Удалить заказ
                        </Button>
                      </div>
                      <AdminOrderChat orderId={order.id} orderNumber={order.order_number} />
                  </motion.div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Заказов не найдено</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====== CLIENTS TAB ======
function ClientsTab() {
  const [search, setSearch] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => apiFetch<{ clients: Client[] }>("admin/clients"),
    refetchInterval: 30000,
  });
  const filtered = (data?.clients || []).filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search) || c.telegram?.includes(search)
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Поиск клиентов..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-background/50 border-border/40 rounded-xl" />
        </div>
        <div className="text-sm text-muted-foreground shrink-0">{data?.clients?.length || 0} клиентов</div>
      </div>
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl border border-border/40 bg-card/40 p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.email}</div>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                    {c.phone && <span>{c.phone}</span>}
                    {c.telegram && <a href={`https://t.me/${c.telegram.replace("@","")}`} target="_blank" className="text-primary hover:underline">{c.telegram}</a>}
                  </div>
                </div>
              </div>
              <div className="text-right text-sm shrink-0">
                <div className="text-primary font-bold">{c.orderCount} заказ.</div>
                {Number(c.totalSpent) > 0 && <div className="text-xs text-emerald-400 font-semibold">{Number(c.totalSpent).toLocaleString("ru")} ₽</div>}
                <div className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ru", { day: "numeric", month: "short" })}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== REVIEWS TAB ======
function ReviewsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: () => apiFetch<{ reviews: Review[] }>("admin/reviews"),
    refetchInterval: 30000,
  });
  const approveMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`admin/reviews/${id}/approve`, { method: "POST" }),
    onSuccess: () => { toast({ title: "✅ Опубликован!" }); queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) =>
      apiFetch(`admin/reviews/${id}/pin`, { method: "POST", body: JSON.stringify({ pinned }) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "🗑 Удалён" }); queryClient.invalidateQueries({ queryKey: ["admin-reviews"] }); },
  });
  const reviews = data?.reviews || [];
  const pending = reviews.filter(r => !r.approved);
  const approved = reviews.filter(r => r.approved);
  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">На модерации ({pending.length})</h3>
          </div>
          <div className="space-y-3">
            {pending.map(r => (
              <div key={r.id} className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{r.name} {r.role && <span className="text-muted-foreground font-normal">— {r.role}</span>}</div>
                    <div className="text-amber-400 text-xs mb-1">{"⭐".repeat(r.rating || 5)}</div>
                    <p className="text-sm text-muted-foreground">{r.text}</p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" className="rounded-xl h-8 px-3 bg-emerald-600 hover:bg-emerald-500 text-white" onClick={() => approveMutation.mutate(r.id)}><CheckCircle className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="destructive" className="rounded-xl h-8 px-3" onClick={() => deleteMutation.mutate(r.id)}><XCircle className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Опубликованные ({approved.length})</h3>
        </div>
        <div className="space-y-3">
          {approved.map(r => (
            <div key={r.id} className={`rounded-2xl border bg-card/40 p-4 ${r.pinned ? "border-primary/30" : "border-border/40"}`}>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{r.name}</span>
                    {r.pinned && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">📌 Закреплён</span>}
                  </div>
                  <div className="text-amber-400 text-xs mb-1">{"⭐".repeat(r.rating || 5)}</div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" variant="outline" className="rounded-xl h-7 px-2 border-border/40"
                    onClick={() => pinMutation.mutate({ id: r.id, pinned: !r.pinned })}>
                    <Pin className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="destructive" className="rounded-xl h-7 px-2"
                    onClick={() => deleteMutation.mutate(r.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ====== GALLERY TAB ======
function GalleryTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fixResult, setFixResult] = useState<{ fixed: number; total: number; failed: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => apiFetch<{ items: GalleryItem[] }>("admin/gallery"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`admin/gallery/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Удалено" }); queryClient.invalidateQueries({ queryKey: ["admin-gallery"] }); },
  });
  const fixUrlsMutation = useMutation({
    mutationFn: () => apiFetch<{ ok: boolean; fixed: number; total: number; failed: number; message?: string }>("admin/gallery/fix-urls", { method: "POST" }),
    onSuccess: (result) => {
      if (result.message) {
        toast({ title: result.message });
      } else {
        setFixResult({ fixed: result.fixed, total: result.total, failed: result.failed });
        toast({ title: `✅ Исправлено ${result.fixed} из ${result.total} фото` });
        queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      }
    },
    onError: (e: any) => {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    try {
      const sig = await getUploadSignature("gallery");
      if (!sig) {
        toast({ title: "Ошибка хранилища", description: "Cloudinary не настроен. Добавьте CLOUDINARY_* переменные в Railway.", variant: "destructive" });
        return;
      }
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      for (const file of Array.from(files)) {
        try {
          const { url } = await uploadFileToCloudinary(file, sig);
          const resp = await fetch(`${base}/api/admin/gallery/save-url`, {
            method: "POST", credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: url }),
          });
          if (!resp.ok) throw new Error("Не удалось сохранить");
          uploaded++;
        } catch (err: any) {
          toast({ title: `Ошибка: ${file.name}`, description: err.message, variant: "destructive" });
        }
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (uploaded > 0) {
        toast({ title: `✅ Загружено ${uploaded} фото` });
        queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <div className="flex items-center justify-between gap-2 p-3 mb-4 rounded-xl border border-primary/15 bg-primary/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ImageIcon className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm text-muted-foreground truncate">Загрузите фото напрямую или через <span className="text-primary font-medium">Telegram-бот</span></p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1.5" />Загрузка...</>
            ) : (
              <><Upload className="w-3.5 h-3.5 mr-1.5" />Загрузить фото</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => fixUrlsMutation.mutate()}
            disabled={fixUrlsMutation.isPending}
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${fixUrlsMutation.isPending ? "animate-spin" : ""}`} />
            {fixUrlsMutation.isPending ? "Исправляем..." : "Исправить ссылки"}
          </Button>
        </div>
      </div>
      {fixResult && (
        <div className="mb-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm">
          <span className="text-emerald-400 font-semibold">Готово: </span>
          <span className="text-muted-foreground">исправлено {fixResult.fixed} из {fixResult.total}, ошибок: {fixResult.failed}</span>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {(data?.items || []).map(item => (
          <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-border/40 aspect-square">
            <img src={item.image_url} alt={item.title || "gallery"} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2">
              <Button size="sm" variant="destructive" className="rounded-xl h-8 w-8 p-0"
                onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
            {item.title && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 text-xs p-2 text-white">{item.title}</div>}
          </div>
        ))}
        {(data?.items?.length || 0) === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Галерея пуста. Отправьте фото боту!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ====== IMAGE PICKER ======
type ImageSource = "url" | "upload" | "gallery";

function ImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [source, setSource] = useState<ImageSource>("url");
  const [uploading, setUploading] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: galleryData } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: () => apiFetch<{ items: GalleryItem[] }>("admin/gallery"),
    enabled: source === "gallery" || showGallery,
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const sig = await getUploadSignature("products");
      if (!sig) throw new Error("Cloudinary не настроен");
      const { url } = await uploadFileToCloudinary(file, sig);
      onChange(url);
      toast({ title: "✅ Изображение загружено!" });
    } catch (err: any) {
      toast({ title: "Ошибка загрузки", description: err.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const sources = [
    { id: "url" as ImageSource, icon: Link2, label: "URL" },
    { id: "upload" as ImageSource, icon: Upload, label: "Загрузить" },
    { id: "gallery" as ImageSource, icon: ImageIcon, label: "Из галереи" },
  ];

  return (
    <div className="space-y-3">
      {/* Source selector */}
      <div className="flex gap-1 p-1 bg-background/40 rounded-xl border border-border/30">
        {sources.map(s => (
          <button key={s.id} type="button" onClick={() => setSource(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${source === s.id ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}>
            <s.icon className="w-3 h-3" /> {s.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      {source === "url" && (
        <Input placeholder="https://example.com/image.jpg" value={value}
          onChange={e => onChange(e.target.value)} className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
      )}

      {/* File upload */}
      {source === "upload" && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 bg-background/30 transition-all text-muted-foreground hover:text-foreground">
            {uploading ? (
              <><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-xs">Загрузка...</span></>
            ) : (
              <><Upload className="w-6 h-6" /><span className="text-xs">Нажмите чтобы выбрать файл<br /><span className="text-muted-foreground/60">JPG, PNG, WebP до 10 МБ</span></span></>
            )}
          </button>
        </div>
      )}

      {/* Gallery picker */}
      {source === "gallery" && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Выберите фото из Telegram-галереи:</p>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
            {(galleryData?.items || []).map(item => (
              <button key={item.id} type="button" onClick={() => { onChange(item.image_url); toast({ title: "Фото выбрано" }); }}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${value === item.image_url ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-primary/40"}`}>
                <img src={item.image_url} alt={item.title || ""} className="w-full h-full object-cover" />
              </button>
            ))}
            {(galleryData?.items?.length || 0) === 0 && (
              <div className="col-span-4 text-center py-6 text-xs text-muted-foreground">
                Галерея пуста. Отправьте фото боту в Telegram!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <img src={value} alt="preview" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-border/40" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-400">Изображение выбрано</p>
            <p className="text-xs text-muted-foreground truncate">{value}</p>
          </div>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

// ====== SHOP TAB ======
function ShopTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => apiFetch<{ products: Product[] }>("admin/products"),
  });

  const emptyProduct = { title: "", price: "", description: "", image_url: "", external_link: "", badge: "", series: "series-01" };
  const [newProduct, setNewProduct] = useState(emptyProduct);
  const [adding, setAdding] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: ({ id, hidden }: { id: number; hidden: boolean }) =>
      apiFetch(`admin/products/${id}`, { method: "PATCH", body: JSON.stringify({ hidden }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`admin/products/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Удалено" }); queryClient.invalidateQueries({ queryKey: ["admin-products"] }); },
  });

  const handleAdd = async () => {
    if (!newProduct.title) { toast({ title: "Введите название товара", variant: "destructive" }); return; }
    if (!newProduct.image_url) { toast({ title: "Выберите изображение товара", variant: "destructive" }); return; }
    try {
      await apiFetch("products", { method: "POST", body: JSON.stringify(newProduct) });
      toast({ title: "✅ Товар добавлен!" });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setNewProduct(emptyProduct);
      setAdding(false);
    } catch { toast({ title: "Ошибка", variant: "destructive" }); }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm font-semibold">Killer Bunny™ Shop</p>
          <p className="text-xs text-muted-foreground">{data?.products?.length || 0} товаров</p>
        </div>
        <Button size="sm" className="rounded-xl h-9 px-4 shadow-lg shadow-primary/20" onClick={() => setAdding(!adding)}>
          <Plus className="w-4 h-4 mr-1.5" /> Добавить товар
        </Button>
      </div>

      {adding && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Новый товар</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Название *</label>
                <Input placeholder="Название товара" value={newProduct.title}
                  onChange={e => setNewProduct(p => ({ ...p, title: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Цена (₽)</label>
                <Input placeholder="0" value={newProduct.price} type="number"
                  onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Бейдж</label>
                <Input placeholder="Хит, Новинка..." value={newProduct.badge}
                  onChange={e => setNewProduct(p => ({ ...p, badge: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Серия</label>
                <Input placeholder="series-01" value={newProduct.series}
                  onChange={e => setNewProduct(p => ({ ...p, series: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Ссылка</label>
                <Input placeholder="https://..." value={newProduct.external_link}
                  onChange={e => setNewProduct(p => ({ ...p, external_link: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Описание</label>
                <Input placeholder="Краткое описание..." value={newProduct.description}
                  onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                  className="bg-background/50 border-border/40 rounded-xl h-9 text-sm" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Изображение товара *</label>
              <ImagePicker value={newProduct.image_url} onChange={url => setNewProduct(p => ({ ...p, image_url: url }))} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="rounded-xl h-9 shadow-lg shadow-primary/20" onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-1.5" /> Добавить товар
              </Button>
              <Button variant="outline" className="rounded-xl h-9 border-border/40" onClick={() => { setAdding(false); setNewProduct(emptyProduct); }}>
                Отмена
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {(data?.products || []).map(p => (
          <div key={p.id} className={`rounded-2xl border bg-card/40 p-3 flex gap-3 items-center transition-all ${p.hidden ? "opacity-50 border-border/30" : "border-border/40 hover:border-primary/20"}`}>
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-border/40 bg-background/50">
              {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-muted-foreground/30" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{p.title}</span>
                {p.badge && <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full border border-primary/20">{p.badge}</span>}
                {p.hidden && <span className="text-xs text-muted-foreground/50">скрыт</span>}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                {p.price && <span className="text-emerald-400 font-semibold">{p.price} ₽</span>}
                {p.series && <span>{p.series}</span>}
                {!p.in_stock && <span className="text-red-400">нет в наличии</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" className="rounded-xl h-8 w-8 p-0 border-border/40"
                onClick={() => toggleMutation.mutate({ id: p.id, hidden: !p.hidden })}>
                {p.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </Button>
              <Button size="sm" variant="destructive" className="rounded-xl h-8 w-8 p-0"
                onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== STATS TAB ======
function StatsTab({ stats }: { stats: Stats | undefined }) {
  if (!stats) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  const totalOrders = stats.ordersByStatus.reduce((s, o) => s + Number(o.total), 0);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Package, label: "Всего заказов", value: totalOrders, color: "text-primary bg-primary/10" },
          { icon: Users, label: "Клиентов", value: stats.totalUsers, color: "text-cyan-400 bg-cyan-500/10" },
          { icon: DollarSign, label: "Выручка (₽)", value: Number(stats.totalRevenue).toLocaleString("ru"), color: "text-emerald-400 bg-emerald-500/10" },
          { icon: TrendingUp, label: "За 30 дней", value: stats.ordersLast30Days, color: "text-amber-400 bg-amber-500/10" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 text-center">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">По статусам</h3>
          <div className="space-y-2">
            {stats.ordersByStatus.map(row => (
              <div key={row.status} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{statusLabels[row.status] || row.status}</span>
                <span className="font-bold">{row.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-card/40 p-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Популярные услуги</h3>
          <div className="space-y-2">
            {stats.popularServices?.map(s => (
              <div key={s.service} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{serviceLabels[s.service] || s.service}</span>
                <span className="font-bold">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====== SUPPORT CHATS TAB ======
interface SupportSession {
  id: number; session_key: string; visitor_name: string; status: string;
  created_at: string; last_message_at: string;
}
interface SupportMsg { id: number; session_id: number; sender: "admin" | "client"; message: string; created_at: string; }

function SupportChatsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<SupportSession | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData, refetch } = useQuery({
    queryKey: ["support-sessions"],
    queryFn: () => apiFetch<{ sessions: SupportSession[] }>("support/sessions"),
    refetchInterval: 10000,
  });

  const { data: msgsData } = useQuery({
    queryKey: ["support-messages", selected?.id],
    queryFn: () => apiFetch<{ messages: SupportMsg[]; session: SupportSession }>(
      `support/sessions/${selected!.id}/messages`
    ),
    enabled: !!selected,
    refetchInterval: 5000,
  });

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    try {
      await apiFetch(`support/sessions/${selected.id}/send`, {
        method: "POST", body: JSON.stringify({ message: reply.trim() }),
      });
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["support-messages", selected.id] });
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { toast({ title: "Ошибка отправки", variant: "destructive" }); }
    finally { setSending(false); }
  };

  const closeSession = async (id: number) => {
    try {
      await apiFetch(`support/sessions/${id}/close`, { method: "POST" });
      toast({ title: "Чат закрыт" });
      if (selected?.id === id) setSelected(null);
      refetch();
    } catch { toast({ title: "Ошибка", variant: "destructive" }); }
  };

  const sessions = sessionsData?.sessions || [];
  const messages = msgsData?.messages || [];
  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString("ru", { day: "numeric", month: "short" });

  return (
    <div className="grid md:grid-cols-[260px_1fr] gap-4 h-[520px]">
      {/* Sessions list */}
      <div className="rounded-2xl border border-border/40 bg-card/40 flex flex-col overflow-hidden">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Диалоги</span>
          <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
            {sessions.filter(s => s.status === "open").length} активных
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border/20">
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
              <MessageCircle className="w-8 h-8 opacity-30" />
              <p className="text-xs">Нет обращений</p>
            </div>
          )}
          {sessions.map(s => (
            <button key={s.id} onClick={() => setSelected(s)}
              className={`w-full text-left p-3 hover:bg-white/5 transition-all ${selected?.id === s.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-sm font-semibold text-white truncate">{s.visitor_name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.status === "open" ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-white/30"}`}>
                  {s.status === "open" ? "открыт" : "закрыт"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{formatDate(s.last_message_at)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat view */}
      {selected ? (
        <div className="rounded-2xl border border-border/40 bg-card/40 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <Users2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">{selected.visitor_name}</p>
                <p className="text-[10px] text-muted-foreground">Сессия #{selected.id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {selected.status === "open" && (
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-xl border-border/40"
                  onClick={() => closeSession(selected.id)}>
                  <X className="w-3 h-3 mr-1" /> Закрыть
                </Button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Нет сообщений</div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender === "admin" ? "bg-primary text-white rounded-br-sm" : "bg-white/8 text-white/90 rounded-bl-sm"
                }`}>
                  {msg.sender === "client" && <p className="text-[10px] text-primary/70 font-semibold mb-0.5">{selected.visitor_name}</p>}
                  <p className="break-words">{msg.message}</p>
                  <p className="text-[10px] mt-1 opacity-50 text-right">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          {selected.status === "open" && (
            <form onSubmit={sendReply} className="flex gap-2 p-3 border-t border-border/30">
              <Input value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Ответить клиенту..." className="h-9 rounded-xl bg-background/50 border-border/40 text-sm" />
              <Button type="submit" size="sm" className="h-9 px-4 rounded-xl shrink-0" disabled={!reply.trim() || sending}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/40 bg-card/40 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <MessageCircle className="w-12 h-12 opacity-20" />
          <p className="text-sm">Выберите диалог слева</p>
        </div>
      )}
    </div>
  );
}

// ====== GROUP CHAT SECTION ======
function GroupChatSection() {
  const { toast } = useToast();
  const [groupId, setGroupId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: cfg, refetch } = useQuery({
    queryKey: ["admin-bot-config"],
    queryFn: () => apiFetch<{ groupChatId: string }>("admin/bot-config"),
  });

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("admin/bot-config", { method: "POST", body: JSON.stringify({ groupChatId: groupId.trim() }) });
      toast({ title: "✅ Группа сохранена" });
      setGroupId("");
      refetch();
    } catch { toast({ title: "Ошибка", variant: "destructive" }); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-3">
      {cfg?.groupChatId
        ? <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20 inline-block">
            ✅ Группа: <code>{cfg.groupChatId}</code>
          </span>
        : <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20 inline-block">⚠️ Не настроена</span>
      }
      <p className="text-xs text-muted-foreground">
        Добавьте бота в группу, сделайте его <b>администратором</b>, затем отправьте любое сообщение — и получите <code>chat_id</code> через <a href="https://t.me/getidsbot" target="_blank" className="text-primary hover:underline">@getidsbot</a>
      </p>
      <div className="flex gap-2">
        <Input value={groupId} onChange={e => setGroupId(e.target.value)}
          placeholder={cfg?.groupChatId || "-100xxxxxxxxxx"} className="bg-background/50 h-8 text-sm border-border/40 rounded-xl font-mono" />
        <Button size="sm" className="rounded-xl h-8 shrink-0" onClick={save} disabled={saving || !groupId.trim()}>
          {saving ? "..." : "Сохранить"}
        </Button>
      </div>
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <Zap className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300/80">Новые заказы будут автоматически дублироваться в указанную Telegram-группу.</p>
      </div>
    </div>
  );
}

// ====== BROADCAST ======
function BroadcastSection() {
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();
  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    try {
      const r = await apiFetch<{ sent: number }>("admin/broadcast", { method: "POST", body: JSON.stringify({ message: msg }) });
      toast({ title: `📢 Рассылка отправлена ${r.sent} клиентам` });
      setMsg("");
    } catch { toast({ title: "Ошибка рассылки", variant: "destructive" }); }
    finally { setSending(false); }
  };
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Отправит сообщение всем клиентам с Telegram</p>
      <textarea value={msg} onChange={e => setMsg(e.target.value)}
        className="w-full h-24 px-3 py-2 rounded-xl bg-background/50 border border-border/40 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        placeholder="Текст рассылки..." />
      <Button size="sm" className="rounded-xl" onClick={send} disabled={sending || !msg.trim()}>
        <Send className="w-3.5 h-3.5 mr-2" /> {sending ? "Отправка..." : "Разослать"}
      </Button>
    </div>
  );
}

// ====== TELEGRAM SETTINGS ======
function WebhookSection() {
  const { toast } = useToast();
  const [botToken, setBotToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [domain, setDomain] = useState("");

  const { data: cfg, refetch: refetchCfg } = useQuery({
    queryKey: ["webhook-config"],
    queryFn: () => apiFetch<{ botTokenSet: boolean; botToken: string; adminChatId: string; webhookDomain: string }>("webhook/config"),
  });
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ["webhook-status"],
    queryFn: () => apiFetch<{ botConfigured: boolean; botUsername?: string; botName?: string; adminChatId: string; webhookDomain?: string }>("webhook/status"),
  });

  const saveConfig = async () => {
    if (!botToken.trim()) return toast({ title: "Введите токен бота", variant: "destructive" });
    setSaving(true);
    try {
      const r = await apiFetch<{ ok: boolean; botUsername?: string }>("webhook/config", { method: "PUT", body: JSON.stringify({ botToken: botToken.trim() }) });
      setBotToken("");
      toast({ title: `✅ Токен сохранён!${r.botUsername ? ` @${r.botUsername}` : ""}` });
      refetchCfg(); refetchStatus();
    } catch (e: unknown) { toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" }); }
    finally { setSaving(false); }
  };

  const registerWebhook = async () => {
    const d = domain || cfg?.webhookDomain || "";
    if (!d) return toast({ title: "Введите домен", variant: "destructive" });
    setRegistering(true);
    try {
      await apiFetch("webhook/register", { method: "POST", body: JSON.stringify({ domain: d }) });
      toast({ title: "✅ Webhook зарегистрирован!", description: "Отправьте /start своему боту в Telegram" });
      refetchCfg(); refetchStatus();
    } catch (e: unknown) { toast({ title: "Ошибка", description: (e as Error).message, variant: "destructive" }); }
    finally { setRegistering(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {status?.botConfigured
          ? <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">✅ @{status.botUsername || "подключён"}</span>
          : <span className="text-xs bg-red-500/15 text-red-400 px-2 py-1 rounded-full border border-red-500/20">❌ Не настроен</span>}
        {cfg?.adminChatId
          ? <span className="text-xs bg-primary/15 text-primary px-2 py-1 rounded-full border border-primary/20">💬 {cfg.adminChatId}</span>
          : <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded-full border border-amber-500/20">⚠️ /start не отправлен</span>}
        {cfg?.webhookDomain && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">🌐 {cfg.webhookDomain}</span>}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Шаг 1 — Токен бота</p>
        {cfg?.botTokenSet && <p className="text-xs text-muted-foreground">Сохранён: <code className="text-primary">{cfg.botToken}</code></p>}
        <div className="flex gap-2">
          <Input type={showToken ? "text" : "password"} value={botToken} onChange={e => setBotToken(e.target.value)}
            placeholder={cfg?.botTokenSet ? "Введите новый токен" : "123456789:AAF…"} className="bg-background/50 h-8 text-sm font-mono border-border/40 rounded-xl" />
          <Button size="sm" variant="ghost" className="h-8 px-2 shrink-0" onClick={() => setShowToken(v => !v)}>
            {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </Button>
          <Button size="sm" className="rounded-xl shrink-0 h-8" onClick={saveConfig} disabled={saving || !botToken.trim()}>
            {saving ? "..." : "Сохранить"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Получите у <a href="https://t.me/BotFather" target="_blank" className="text-primary hover:underline">@BotFather</a></p>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Шаг 2 — Домен сайта</p>
        <div className="flex gap-2">
          <Input value={domain || cfg?.webhookDomain || ""} onChange={e => setDomain(e.target.value)}
            className="bg-background/50 h-8 text-sm border-border/40 rounded-xl" placeholder="example.com" />
          <Button size="sm" className="rounded-xl shrink-0 h-8" onClick={registerWebhook} disabled={registering || !status?.botConfigured}>
            <Webhook className="w-3.5 h-3.5 mr-1" /> {registering ? "..." : "Webhook"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">После — отправьте <code>/start</code> боту в Telegram</p>
      </div>
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
        <Zap className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-300/80">Настройки сохраняются в <code className="text-blue-300">data/bot-config.json</code> — при переносе сервера бот продолжит работать.</p>
      </div>
    </div>
  );
}

// ====== MAIN ======
const TABS = [
  { id: "orders", label: "Заказы", icon: Package, emoji: "📦" },
  { id: "chats", label: "Чаты", icon: MessageCircle, emoji: "💬" },
  { id: "clients", label: "Клиенты", icon: Users, emoji: "👥" },
  { id: "shop", label: "Магазин", icon: ShoppingBag, emoji: "🛍" },
  { id: "reviews", label: "Отзывы", icon: Star, emoji: "⭐" },
  { id: "gallery", label: "Галерея", icon: Image, emoji: "🖼" },
  { id: "stats", label: "Статистика", icon: BarChart3, emoji: "📊" },
];

export default function Admin() {
  const { isAdmin, refresh } = useAuth();
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  const { data: statsData } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => apiFetch<Stats>("admin/stats"),
    enabled: isAdmin || loggedIn,
    refetchInterval: 60000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => apiFetch<{ orders: Order[] }>("admin/orders"),
    enabled: isAdmin || loggedIn,
    refetchInterval: 30000,
  });

  const handleLogin = async () => { await refresh(); setLoggedIn(true); };

  if (!isAdmin && !loggedIn) return <AdminLogin onLogin={handleLogin} />;

  const newOrdersCount = (ordersData?.orders || []).filter(o => o.status === "new").length;

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">
        {/* ─── Header ─── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center gap-4">
         <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center">
          <img src="/logo.png" alt="BRUCE 3D" className="w-12 h-12 object-contain" />
          </div>
            <div>
              <h1 className="text-xl font-black font-display">
                Панель <span className="text-primary">администратора</span>
              </h1>
              <p className="text-xs text-muted-foreground">BRUCE 3D SHOP · Управление сайтом</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {newOrdersCount > 0 && (
              <span className="flex items-center gap-1.5 text-xs bg-amber-500/15 text-amber-400 px-3 py-1.5 rounded-full border border-amber-500/20 font-semibold">
                <Clock className="w-3 h-3" /> {newOrdersCount} новых
              </span>
            )}
            <Button variant="outline" size="sm" className="rounded-xl border-border/40 hidden md:flex" onClick={() => window.location.reload()}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Обновить
            </Button>
          </div>
        </motion.div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1.5 flex-wrap mb-6 p-1 bg-card/30 rounded-2xl border border-border/30">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-muted-foreground hover:text-foreground hover:bg-white/5"}`}>
              <span>{tab.emoji}</span> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Content ─── */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {activeTab === "orders" && <OrdersTab />}
          {activeTab === "chats" && <SupportChatsTab />}
          {activeTab === "clients" && <ClientsTab />}
          {activeTab === "shop" && <ShopTab />}
          {activeTab === "reviews" && <ReviewsTab />}
          {activeTab === "gallery" && <GalleryTab />}
          {activeTab === "stats" && <StatsTab stats={statsData} />}
        </motion.div>

        {/* ─── Bottom settings ─── */}
        <div className="mt-10 space-y-4">
          <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-wider font-bold">
            <div className="h-px flex-1 bg-border/30" /> Настройки <div className="h-px flex-1 bg-border/30" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Webhook className="w-4 h-4 text-primary" /> Telegram Бот
              </h3>
              <WebhookSection />
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Send className="w-4 h-4 text-primary" /> Рассылка клиентам
              </h3>
              <BroadcastSection />
            </div>
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5">
              <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                <Users2 className="w-4 h-4 text-primary" /> Telegram-группа заказов
              </h3>
              <GroupChatSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
