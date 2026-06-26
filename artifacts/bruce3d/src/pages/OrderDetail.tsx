import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { apiFetch, apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Lock, CheckCircle, Clock, Package, Truck, XCircle, Download, CreditCard, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { printOrderPDF } from "@/lib/printOrderPDF";

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
  new: "Новый", accepted: "Принят", working: "В работе",
  ready: "Готов", shipped: "Отправлен", completed: "Завершён",
  confirmed: "Оплачен и подтверждён", rejected: "Отклонён",
};

const statusColors: Record<string, string> = {
  new: "text-blue-400", accepted: "text-green-400", working: "text-yellow-400",
  ready: "text-purple-400", shipped: "text-cyan-400", completed: "text-green-400",
  confirmed: "text-green-400", rejected: "text-red-400",
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => apiFetch<OrderDetailData>(`orders/${orderId}`),
    enabled: !!orderId && (!!user || isAdmin),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (data?.messages) setMessages(data.messages);
  }, [data]);

  useEffect(() => {
    if (!orderId || (!user && !isAdmin)) return;
    const es = new EventSource(apiUrl(`chat/${orderId}/stream`), { withCredentials: true } as any);
    es.onmessage = (e) => {
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
    };
    return () => { es.close(); };
  }, [orderId, user, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
