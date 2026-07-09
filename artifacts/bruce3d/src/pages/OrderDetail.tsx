import { useState, useEffect, useRef } from "react";
  import { useRoute } from "wouter";
  import { useQuery, useQueryClient } from "@tanstack/react-query";
  import { motion } from "framer-motion";
  import { apiFetch, apiUrl } from "@/lib/api";
  import { useAuth } from "@/lib/auth-context";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Send, Lock, CheckCircle, Clock, Package, Truck, XCircle, Download, CreditCard, AlertCircle, Paperclip, Star, Layers, Tag, FileText, ChevronRight, ArrowRight, PenLine, Plus, ChevronDown } from "lucide-react";
  import { useToast } from "@/hooks/use-toast";
  import { printOrderPDF } from "@/lib/printOrderPDF";
  import { getUploadSignature, uploadFileToCloudinary } from "@/lib/cloudinary";

  interface Message { id: number; sender: string; message: string; created_at: string; }
  interface StatusEntry { status: string; comment?: string; created_at: string; }
  interface OrderDetailData {
    order: {
      id: number; order_number: string; name: string; status: string;
      price?: number; payment_link?: string;
      service_type: string; material: string; description: string;
      delivery_type: string; created_at: string; file_name?: string;
      estimated_price?: string | null;
    };
    paymentPaid: boolean;
    history: StatusEntry[];
    messages: Message[];
  }

  const statusIcons: Record<string, React.ReactNode> = {
    new: <Clock className="w-4 h-4" />,
    accepted: <CheckCircle className="w-4 h-4" />,
    working: <Package className="w-4 h-4" />,
    ready: <CheckCircle className="w-4 h-4" />,
    shipped: <Truck className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    confirmed: <CheckCircle className="w-4 h-4" />,
    rejected: <XCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
  };

  const statusLabels: Record<string, string> = {
    new: "Новый",
    accepted: "Принят",
    working: "В работе",
    ready: "Готов",
    shipped: "Отправлен",
    completed: "Завершён",
    confirmed: "Оплачен и подтверждён",
    rejected: "Отклонён",
      cancelled: "Отменён",
  };

  const statusColors: Record<string, string> = {
    new: "text-blue-400",
    accepted: "text-green-400",
    working: "text-yellow-400",
    ready: "text-purple-400",
    shipped: "text-cyan-400",
    completed: "text-green-400",
    confirmed: "text-green-400",
    rejected: "text-red-400",
      cancelled: "text-red-400",
  };

  const statusBgColors: Record<string, string> = {
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
    cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const serviceLabels: Record<string, string> = {
    "3d-print": "3D Печать", "3d-modeling": "Моделирование",
    "3d-scanning": "Сканирование", "repair": "Ремонт",
  };

  export default function OrderDetail() {
    const [, params] = useRoute("/order/:id");
    const orderId = Number(params?.id);
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgText, setMsgText] = useState("");
    const [sending, setSending] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [updateOpen, setUpdateOpen] = useState(false);
    const [extraDesc, setExtraDesc] = useState("");
    const [addServices, setAddServices] = useState<string[]>([]);
    const [addMaterials, setAddMaterials] = useState<string[]>([]);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [updating, setUpdating] = useState(false);
    const updateFileRef = useRef<HTMLInputElement>(null);

    const { data, isLoading, isError, refetch } = useQuery({
      queryKey: ["order-detail", orderId],
      queryFn: () => apiFetch<OrderDetailData>(`orders/${orderId}`),
      enabled: !!orderId && (!!user || isAdmin),
      refetchInterval: (query) => {
        const d = query.state.data as OrderDetailData | undefined;
        if (!d) return 8000;
        const hasBill = !!d.order?.price;
        const isConfirmed = d.order?.status === "confirmed" || d.paymentPaid;
        return hasBill && !isConfirmed ? 3000 : 30000;
      },
      retry: 1,
    });

    useEffect(() => {
      if (data?.messages) setMessages(data.messages);
    }, [data]);

    useEffect(() => {
      if (!orderId || (!user && !isAdmin)) return;
      const es = new EventSource(apiUrl(`chat/${orderId}/stream`), { withCredentials: true } as any);
      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "message") {
            setMessages(prev => [...prev, payload.message]);
          } else if (payload.type === "status") {
            toast({ title: "Статус заказа обновлён", description: statusLabels[payload.status] || payload.status });
            refetch();
          } else if (payload.type === "price") {
            toast({
              title: `💰 Выставлен счёт: ${payload.price} ₽`,
              description: payload.paymentUrl ? "Перейдите по ссылке для оплаты" : "Подтвердите заказ в личном кабинете",
            });
            refetch();
          }
        } catch {}
      };
      es.onerror = () => {};
      return () => { es.close(); };
    }, [orderId, user, isAdmin]);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const cancelOrder = async () => {
        if (!window.confirm("Вы уверены, что хотите отменить заказ? Это действие нельзя отменить.")) return;
        setCancelling(true);
        try {
          await apiFetch(`orders/${orderId}/cancel`, { method: "POST" });
          toast({ title: "Заказ отменён" });
          // Мгновенно обновляем кэш Dashboard — заказ пропадает без задержки
          queryClient.setQueryData(["my-orders"], (old: any) => {
            if (!old?.orders) return old;
            return {
              ...old,
              orders: old.orders.map((o: any) =>
                o.id === orderId ? { ...o, status: "cancelled" } : o
              ),
            };
          });
          refetch();
        } catch (err: any) {
          toast({ title: err?.message || "Ошибка отмены", variant: "destructive" });
        } finally {
          setCancelling(false);
        }
      };

      const updateOrder = async () => {
      if (!extraDesc.trim() && addServices.length === 0 && addMaterials.length === 0 && newFiles.length === 0) {
        toast({ title: "Ничего не добавлено", variant: "destructive" }); return;
      }
      setUpdating(true);
      try {
        const fd = new FormData();
        if (extraDesc.trim()) fd.append("extraDesc", extraDesc.trim());
        if (addServices.length > 0) fd.append("addServices", addServices.join(","));
        if (addMaterials.length > 0) fd.append("addMaterials", addMaterials.join(","));
        for (const f of newFiles) fd.append("files", f);
        await apiFetch(`orders/${orderId}`, { method: "PATCH", body: fd });
        toast({ title: "Заказ дополнен!" });
        setExtraDesc(""); setAddServices([]); setAddMaterials([]); setNewFiles([]); setUpdateOpen(false);
        refetch();
      } catch (err: any) {
        toast({ title: err?.message || "Ошибка обновления", variant: "destructive" });
      } finally { setUpdating(false); }
    };

      const sendFileMessage = async (file: File) => {
      setUploadingFile(true);
      try {
        const sig = await getUploadSignature("chat");
        const { url } = await uploadFileToCloudinary(file, sig);
        const msg = `[FILE:${url}|${file.name}]`;
        await apiFetch(`chat/${orderId}/send`, { method: "POST", body: JSON.stringify({ message: msg }) });
      } catch {
        toast({ title: "Ошибка загрузки файла", variant: "destructive" });
      } finally {
        setUploadingFile(false);
      }
    };

    const sendMessage = async () => {
      if (!msgText.trim() || sending) return;
      setSending(true);
      try {
        await apiFetch(`chat/${orderId}/send`, { method: "POST", body: JSON.stringify({ message: msgText }) });
        setMsgText("");
      } catch {
        toast({ title: "Ошибка отправки", variant: "destructive" });
      } finally {
        setSending(false);
      }
    };

    const confirmOrder = async () => {
      setConfirming(true);
      try {
        const result = await apiFetch<any>(`orders/${orderId}/confirm`, { method: "POST" });
        if (result.paymentRequired) {
          toast({ title: "Требуется оплата", description: "Оплатите заказ, чтобы его подтвердить", variant: "destructive" });
          if (result.paymentUrl) window.open(result.paymentUrl, "_blank");
        } else {
          setConfirmed(true);
          toast({ title: "Заказ подтверждён!" });
          refetch();
        }
      } catch (err: any) {
        const msg = err?.message || "Ошибка";
        if (msg.includes("оплат") || msg.includes("payment")) {
          toast({ title: "Требуется оплата", description: "Пожалуйста, оплатите заказ", variant: "destructive" });
        } else {
          toast({ title: msg, variant: "destructive" });
        }
      } finally {
        setConfirming(false);
      }
    };

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!user && !isAdmin) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-display mb-2">Требуется авторизация</h2>
          <p className="text-muted-foreground">Войдите в личный кабинет, чтобы просмотреть заказ.</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold font-display mb-2">Ошибка загрузки заказа</h2>
          <p className="text-muted-foreground mb-4">Не удалось загрузить данные. Попробуйте обновить страницу.</p>
          <Button variant="outline" onClick={() => refetch()}>Повторить</Button>
        </div>
      );
    }

    if (!data) {
      return (
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Заказ не найден
        </div>
      );
    }

    const { order, history, paymentPaid } = data;
    const statusColor = statusColors[order.status] || "text-foreground";
    const isConfirmed = confirmed || order.status === "confirmed";
    const hasBill = !!order.price;
    const hasPaymentLink = !!order.payment_link;
    // Confirm button only for clients — admin manages orders via admin panel
    const cancellableStatuses = ["new", "accepted", "calculating"];
      const canCancel = !isAdmin && cancellableStatuses.includes(order.status);
    const canUpdate = !isAdmin && ["new", "accepted"].includes(order.status);

    return (
      <div className="min-h-screen bg-background">

        {/* ── HERO HEADER ── */}
        <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-card/70 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,165,0,0.08),transparent)] pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/4 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="container mx-auto px-4 pt-8 pb-6 max-w-5xl relative">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

              {/* Breadcrumb + PDF */}
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Заказы</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground font-semibold">#{order.order_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  {canCancel && (
                    <Button variant="outline" size="sm"
                      className="rounded-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 text-xs gap-1.5 h-8"
                      onClick={cancelOrder} disabled={cancelling}>
                      <XCircle className="w-3.5 h-3.5" />
                      {cancelling ? "..." : "Отменить"}
                    </Button>
                  )}
                  <Button variant="outline" size="sm"
                    className="rounded-full border-border/40 hover:border-primary/40 hover:bg-primary/5 text-xs gap-1.5 h-8"
                    onClick={() => printOrderPDF({ order, history })}>
                    <Download className="w-3.5 h-3.5" /> PDF
                  </Button>
                </div>
              </div>

              {/* Order number + status */}
              <div className="flex items-end justify-between gap-4 flex-wrap mb-7">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-1.5">Заказ</p>
                  <h1 className="text-5xl sm:text-6xl font-black font-display leading-none">
                    <span className="text-primary">#{order.order_number}</span>
                  </h1>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border mb-1.5 ${statusBgColors[order.status] || "bg-muted/10 text-muted-foreground border-border/40"}`}>
                    {statusIcons[order.status]}
                    {statusLabels[order.status] || order.status}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>

              {/* Progress stepper */}
              {!["rejected", "cancelled"].includes(order.status) && (() => {
                const STEPS = [
                  { key: "new", label: "Новый", icon: <Clock className="w-3 h-3" /> },
                  { key: "accepted", label: "Принят", icon: <CheckCircle className="w-3 h-3" /> },
                  { key: "working", label: "В работе", icon: <Package className="w-3 h-3" /> },
                  { key: "ready", label: "Готов", icon: <Star className="w-3 h-3" /> },
                  { key: "shipped", label: "Отправлен", icon: <Truck className="w-3 h-3" /> },
                  { key: "completed", label: "Готово", icon: <CheckCircle className="w-3 h-3" /> },
                ];
                const stepMap: Record<string, number> = {
                  new: 0, calculating: 0, accepted: 1, working: 2, printing: 2,
                  postprocess: 2, ready: 3, shipped: 4, completed: 5, confirmed: 5,
                };
                const currentStep = stepMap[order.status] ?? 0;
                return (
                  <div className="flex items-center">
                    {STEPS.map((step, i) => {
                      const done = i < currentStep;
                      const active = i === currentStep;
                      return (
                        <div key={step.key} className="flex items-center flex-1 min-w-0">
                          <div className={`flex flex-col items-center gap-1 flex-shrink-0 transition-all ${done || active ? "opacity-100" : "opacity-30"}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${done ? "bg-primary border-primary text-primary-foreground" : active ? "bg-primary/15 border-primary text-primary ring-4 ring-primary/10" : "bg-card/80 border-border/50 text-muted-foreground"}`}>
                              {done ? <CheckCircle className="w-3.5 h-3.5" /> : step.icon}
                            </div>
                            <span className={`text-[9px] font-semibold text-center leading-none hidden sm:block whitespace-nowrap ${active ? "text-primary" : "text-muted-foreground"}`}>{step.label}</span>
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 mx-1.5 rounded-full transition-all ${i < currentStep ? "bg-primary" : "bg-border/30"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </motion.div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Баннер: ожидание менеджера */}
              {order.status === "new" && !isAdmin && (
                <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-400">Заказ принят!</p>
                    <p className="text-sm text-amber-400/70 mt-0.5 leading-snug">Ожидайте — менеджер обрабатывает ваш заказ. Мы свяжемся с вами в ближайшее время.</p>
                  </div>
                </div>
              )}

              {/* Payment Banner */}
              {hasBill && !isConfirmed && (
                <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">К оплате</p>
                      <p className="text-2xl font-black text-primary leading-none">{order.price} ₽</p>
                    </div>
                  </div>
                  {hasPaymentLink && !paymentPaid && (
                    <>
                      <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-3">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Оплатите заказ — подтверждение пройдёт автоматически</span>
                      </div>
                      <Button className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20 gap-2"
                        onClick={() => window.open(order.payment_link!, "_blank")}>
                        <CreditCard className="w-4 h-4" /> Перейти к оплате
                      </Button>
                    </>
                  )}
                  {hasPaymentLink && paymentPaid && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span className="font-medium">Оплата получена</span>
                    </div>
                  )}
                  {isAdmin && (
                    <p className="text-xs text-muted-foreground mt-2 opacity-60 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Просмотр от администратора — управляйте через панель
                    </p>
                  )}
                </div>
              )}

              {isConfirmed && (
                <div className="rounded-2xl p-4 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-400">Заказ подтверждён!</p>
                    {order.price && <p className="text-xs text-emerald-400/70 mt-0.5">Оплачено: {order.price} ₽</p>}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: <Layers className="w-3 h-3" />, label: "Услуга", value: serviceLabels[order.service_type] || order.service_type },
                  { icon: <Tag className="w-3 h-3" />, label: "Материал", value: order.material.toUpperCase() },
                  { icon: <Truck className="w-3 h-3" />, label: "Доставка", value: ({"pickup":"Самовывоз","cdek":"СДЭК","post":"Почта РФ","courier":"Курьер"} as Record<string,string>)[order.delivery_type] ?? order.delivery_type },
                ].map((item, i) => (
                  <div key={i} className="rounded-2xl bg-card/60 border border-border/40 p-3.5 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2">
                      {item.icon} {item.label}
                    </div>
                    <p className="font-bold text-sm text-foreground leading-snug">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Примерная стоимость */}
              {order.estimated_price && !hasBill && (
                <div className="rounded-2xl bg-card/60 border border-border/40 p-3.5 backdrop-blur-sm flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-0.5">
                      <Tag className="w-3.5 h-3.5" /> Примерная стоимость
                    </div>
                    <p className="text-xs text-muted-foreground/60 leading-snug">Точная цена будет выставлена менеджером</p>
                  </div>
                  <span className="text-2xl font-black text-primary shrink-0">≈ {Number(order.estimated_price).toLocaleString("ru")} ₽</span>
                </div>
              )}

              {/* Description */}
              <div className="rounded-2xl bg-card/60 border border-border/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2.5 uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5" /> Описание заказа
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{order.description}</p>
              </div>

              {/* Files */}
              {order.file_name && (() => {
                let files: { url: string; name: string }[] = [];
                try {
                  const parsed = JSON.parse(order.file_name);
                  if (Array.isArray(parsed)) {
                    files = parsed.map((item: any, i: number) => {
                      if (typeof item === "string") return { url: item, name: decodeURIComponent(item.split("/").pop()?.split("?")[0] || `файл-${i + 1}`) };
                      return { url: item.url, name: item.name || decodeURIComponent((item.url || "").split("/").pop()?.split("?")[0] || `файл-${i + 1}`) };
                    });
                  }
                } catch {}
                if (files.length === 0) return null;
                return (
                  <div className="rounded-2xl bg-card/60 border border-border/40 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-2.5 uppercase tracking-wide">
                      <Paperclip className="w-3.5 h-3.5" /> Прикреплённые файлы ({files.length})
                    </div>
                    <div className="space-y-2">
                      {files.map((f, i) => (
                        <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" download={f.name}
                          className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 border border-primary/15 hover:border-primary/30 rounded-xl px-3.5 py-2.5 transition-all group">
                          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Download className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-sm text-foreground truncate font-medium flex-1">{f.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Status History */}
              <div className="rounded-2xl bg-card/60 border border-border/40 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">
                  <Clock className="w-3.5 h-3.5" /> История статусов
                </div>
                {(history || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">История пока пуста</p>
                ) : (
                  <div>
                    {(history || []).map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center shrink-0">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1 ring-2 ring-background ${i === 0 ? "bg-primary" : "bg-border"}`} />
                          {i < (history || []).length - 1 && <div className="w-px flex-1 bg-border/40 my-1" />}
                        </div>
                        <div className={`pb-3 min-w-0 ${i === (history || []).length - 1 ? "pb-0" : ""}`}>
                          <p className={`text-sm font-semibold ${i === 0 ? "text-primary" : "text-foreground/60"}`}>
                            {statusLabels[entry.status] || entry.status}
                          </p>
                          {entry.comment && <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{entry.comment}</p>}
                          <p className="text-xs text-muted-foreground/50 mt-0.5">
                            {new Date(entry.created_at).toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Дополнить заказ */}
              {canUpdate && (
                <div className="rounded-2xl bg-card/60 border border-border/40 backdrop-blur-sm overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors"
                    onClick={() => setUpdateOpen(v => !v)}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm">
                      <PenLine className="w-4 h-4 text-primary" /> Дополнить заказ
                    </div>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${updateOpen ? "rotate-180" : ""}`} />
                  </button>
                  {updateOpen && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border/30">
                      {/* Files */}
                      <div className="pt-3">
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Добавить файлы</p>
                        <input ref={updateFileRef} type="file" multiple className="hidden"
                          onChange={(e) => { const fs = Array.from(e.target.files || []); setNewFiles(prev => [...prev, ...fs]); e.target.value = ""; }} />
                        <button onClick={() => updateFileRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 text-sm text-muted-foreground transition-all">
                          <Plus className="w-4 h-4" /> Выбрать файлы
                        </button>
                        {newFiles.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {newFiles.map((f, i) => (
                              <div key={i} className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-1.5 text-xs">
                                <span className="truncate flex-1">{f.name}</span>
                                <button onClick={() => setNewFiles(p => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-red-400 ml-2">✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Extra description */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Дополнительное описание</p>
                        <textarea
                          value={extraDesc}
                          onChange={(e) => setExtraDesc(e.target.value)}
                          placeholder="Уточнения, пожелания, исправления..."
                          rows={3}
                          className="w-full rounded-xl bg-background/60 border border-border/50 px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none"
                        />
                      </div>
                      {/* Services */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Добавить услуги</p>
                        <div className="flex flex-wrap gap-2">
                          {[{k:"3d-print",l:"3D Печать"},{k:"3d-modeling",l:"Моделирование"},{k:"3d-scanning",l:"Сканирование"},{k:"repair",l:"Ремонт"}].map(s => {
                            const active = addServices.includes(s.k);
                            return (
                              <button key={s.k}
                                onClick={() => setAddServices(p => active ? p.filter(x => x !== s.k) : [...p, s.k])}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${active ? "bg-primary/20 border-primary/50 text-primary" : "bg-card/60 border-border/40 text-muted-foreground hover:border-primary/30"}`}>
                                {s.l}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Materials */}
                      <div>
                        <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Добавить материалы</p>
                        <div className="flex flex-wrap gap-2">
                          {["PLA","ABS","PETG","TPU","RESIN","Нейлон"].map(m => {
                            const active = addMaterials.includes(m);
                            return (
                              <button key={m}
                                onClick={() => setAddMaterials(p => active ? p.filter(x => x !== m) : [...p, m])}
                                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${active ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "bg-card/60 border-border/40 text-muted-foreground hover:border-violet-400/30"}`}>
                                {m}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {/* Submit */}
                      <button
                        onClick={updateOrder}
                        disabled={updating || (!extraDesc.trim() && addServices.length === 0 && addMaterials.length === 0 && newFiles.length === 0)}
                        className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-semibold text-sm transition-all flex items-center justify-center gap-2">
                        {updating
                          ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Сохранение...</>
                          : <><PenLine className="w-4 h-4" /> Сохранить дополнения</>}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN (chat) ── */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden flex flex-col sticky top-4" style={{ height: "600px" }}>
                <div className="p-3.5 border-b border-border/30 bg-card/40 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="font-bold text-sm">Чат поддержки</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Заказ #{order.order_number}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
                  {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                        <Send className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground/70">Нет сообщений</p>
                      <p className="text-xs mt-1 leading-snug opacity-60">Напишите вопрос или уточнение по заказу</p>
                    </div>
                  )}
                  {messages.map(msg => {
                    const isMe = msg.sender === "client";
                    const isFile = msg.message.startsWith("[FILE:");
                    let fileUrl = "", fileName = "";
                    if (isFile) {
                      const inner = msg.message.slice(6, -1);
                      const pipeIdx = inner.indexOf("|");
                      fileUrl = pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner;
                      fileName = pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : "Файл";
                    }
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 text-foreground rounded-bl-sm border border-border/30"}`}>
                          {isFile ? (
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" download
                              className="flex items-center gap-1.5 underline hover:no-underline">
                              <Download className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[160px]">{fileName}</span>
                            </a>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">{msg.message}</span>
                          )}
                          <div className={`text-[10px] mt-0.5 opacity-60 ${isMe ? "text-right" : ""}`}>
                            {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t border-border/30 shrink-0 bg-card/40">
                  <input ref={fileInputRef} type="file" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) sendFileMessage(file); e.target.value = ""; }} />
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="shrink-0 rounded-full w-8 h-8"
                      onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} title="Прикрепить файл">
                      <Paperclip className="w-3.5 h-3.5" />
                    </Button>
                    <Input value={msgText} onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      placeholder="Написать сообщение..."
                      className="rounded-full bg-background/50 border-border/40 text-sm h-8" />
                    <Button size="icon" className="shrink-0 rounded-full w-8 h-8" onClick={sendMessage}
                      disabled={sending || !msgText.trim()}>
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    );
  }
  