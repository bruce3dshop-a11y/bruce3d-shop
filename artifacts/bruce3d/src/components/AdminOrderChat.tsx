import { useState, useEffect, useRef } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  sender: string;
  message: string;
  created_at: string;
}

interface AdminOrderChatProps {
  orderId: number;
  orderNumber: string;
}

export default function AdminOrderChat({ orderId, orderNumber }: AdminOrderChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    apiFetch<{ messages: Message[] }>(`orders/${orderId}`)
      .then((data: any) => {
        if (data?.messages) setMessages(data.messages);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [orderId]);

  useEffect(() => {
    const es = new EventSource(apiUrl(`chat/${orderId}/stream`), { withCredentials: true } as any);
    es.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === "message") {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.message.id)) return prev;
            return [...prev, payload.message];
          });
        }
      } catch {}
    };
    return () => es.close();
  }, [orderId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiFetch(`chat/${orderId}/send`, {
        method: "POST",
        body: JSON.stringify({ message: text.trim() }),
      });
      setText("");
    } catch {
      toast({ title: "Ошибка отправки", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/30">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Чат с клиентом · #{orderNumber}
        </span>
        {messages.length > 0 && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {messages.length}
          </span>
        )}
      </div>

      <div className="rounded-xl border border-border/30 bg-background/30 overflow-hidden">
        <div className="h-48 overflow-y-auto p-3 space-y-2">
          {!loaded && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {loaded && messages.length === 0 && (
            <div className="text-center text-xs text-muted-foreground py-6">
              Сообщений нет — напишите первым
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === "admin" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs ${
                msg.sender === "admin"
                  ? "bg-primary text-white rounded-br-sm"
                  : "bg-card border border-border/50 text-foreground rounded-bl-sm"
              }`}>
                {msg.sender !== "admin" && (
                  <div className="text-primary/70 font-semibold text-[10px] mb-0.5">Клиент</div>
                )}
                <div>{msg.message}</div>
                <div className="text-[10px] opacity-60 mt-0.5 text-right">
                  {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="p-2 border-t border-border/30 flex gap-2">
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ответить клиенту..."
            className="bg-background/50 h-8 text-xs border-border/40 rounded-xl"
          />
          <Button
            size="sm"
            onClick={send}
            disabled={sending || !text.trim()}
            className="rounded-xl h-8 px-3 shrink-0"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
