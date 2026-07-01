import { useState, useEffect, useRef } from "react";
  import { useRoute } from "wouter";
  import { useQuery } from "@tanstack/react-query";
  import { motion } from "framer-motion";
  import { apiFetch, apiUrl } from "@/lib/api";
  import { useAuth } from "@/lib/auth-context";
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Send, Lock, CheckCircle, Clock, Package, Truck, XCircle, Download, CreditCard, AlertCircle, Paperclip } from "lucide-react";
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
      delivery_type: string; created_at: string;
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
  };

  export default function OrderDetail() {
    const [, params] = useRoute("/order/:id");
    const orderId = Number(params?.id);
    const { user, isAdmin } = useAuth();
    const { toast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [msgText, setMsgText] = useState("");
    const [sending, setSending] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingFile, setUploadingFile] = useState(false);

    const { data, isLoading, isError, refetch } = useQuery({
      queryKey: ["order-detail", orderId],
      queryFn: () => apiFetch<OrderDetailData>(`orders/${orderId}`),
      enabled: !!orderId && (!!user || isAdmin),
      refetchInterval: 15000,
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
    const showConfirmButton = !isAdmin && hasBill && !isConfirmed && (paymentPaid || !hasPaymentLink);

    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold font-display mb-1">
                  Заказ <span className="text-primary">#{order.order_number}</span>
                </h1>
                <div className={`flex items-center gap-2 text-lg font-semibold ${statusColor}`}>
                  {statusIcons[order.status]}
                  {statusLabels[order.status] || order.status}
                </div>
              </div>
              <Button variant="outline" size="sm"
                className="rounded-full border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary gap-2 shrink-0"
                onClick={() => printOrderPDF({ order, history })}>
                <Download className="w-4 h-4" /> Скачать PDF
              </Button>
            </div>

            {hasBill && !isConfirmed && (
              <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary text-xl">Счёт: {order.price} ₽</span>
                </div>

                {hasPaymentLink && !paymentPaid && (
                  <>
                    <div className="flex items-center gap-2 text-sm text-amber-400 mb-3">
                      <AlertCircle className="w-4 h-4" />
                      <span>Оплатите заказ — он будет подтверждён автоматически</span>
                    </div>
                    <Button className="w-full rounded-full" onClick={() => window.open(order.payment_link!, "_blank")}>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Перейти к оплате
                    </Button>
                  </>
                )}

                {hasPaymentLink && paymentPaid && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Оплата получена</span>
                  </div>
                )}

                {showConfirmButton && (
                  <Button className="w-full rounded-full mt-2" onClick={confirmOrder} disabled={confirming}>
                    {confirming ? "Подтверждение..." : "Подтвердить заказ"}
                  </Button>
                )}

                {isAdmin && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Вы просматриваете как администратор. Управляйте заказом через панель.</span>
                  </div>
                )}
              </div>
            )}

            {isConfirmed && (
              <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <div>Заказ оплачен и подтверждён!</div>
                  {order.price && <div className="text-sm font-normal opacity-80">Сумма: {order.price} ₽</div>}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display">Детали заказа</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Услуга</span>
                    <span>{order.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Материал</span>
                    <span className="uppercase">{order.material}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Доставка</span>
                    <span>{order.delivery_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Создан</span>
                    <span>{new Date(order.created_at).toLocaleDateString("ru")}</span>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-muted-foreground mb-1">Описание:</p>
                    <p className="text-foreground">{order.description}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/40 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-display">История статусов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(history || []).map((entry, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full mt-1.5 ${statusColors[entry.status]?.replace("text-", "bg-") || "bg-primary"}`} />
                          {i < (history || []).length - 1 && <div className="w-0.5 bg-border/40 flex-1 mt-1" />}
                        </div>
                        <div className="pb-3">
                          <div className="text-sm font-medium">{statusLabels[entry.status] || entry.status}</div>
                          {entry.comment && <div className="text-xs text-muted-foreground">{entry.comment}</div>}
                          <div className="text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString("ru")}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card/40 border-border/50 flex flex-col h-[500px]">
              <CardHeader className="pb-2 shrink-0">
                <CardTitle className="text-base font-display">Переписка</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 p-3">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">Нет сообщений</div>
                )}
                {messages.map((msg) => {
                  const isMe = isAdmin ? msg.sender === "admin" : msg.sender === "client";
                  const isFile = msg.message.startsWith("[FILE:");
                  let fileUrl = "";
                  let fileName = "Файл";
                  if (isFile) {
                    const inner = msg.message.slice(6, -1);
                    const pipeIdx = inner.indexOf("|");
                    fileUrl = pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner;
                    fileName = pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : "Файл";
                  }
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {isFile ? (
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" download
                            className="flex items-center gap-1.5 underline hover:no-underline">
                            <Download className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{fileName}</span>
                          </a>
                        ) : (
                          <span className="whitespace-pre-wrap break-words">{msg.message}</span>
                        )}
                        <div className={`text-xs mt-1 opacity-60 ${isMe ? "text-right" : ""}`}>
                          {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </CardContent>
              <div className="p-3 border-t border-border/30 shrink-0">
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) sendFileMessage(file); e.target.value = ""; }} />
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()} disabled={uploadingFile} title="Прикрепить файл">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input value={msgText} onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Написать сообщение..."
                    className="rounded-full bg-background/50 border-border/40 text-sm" />
                  <Button size="icon" className="shrink-0 rounded-full" onClick={sendMessage}
                    disabled={sending || !msgText.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }
  