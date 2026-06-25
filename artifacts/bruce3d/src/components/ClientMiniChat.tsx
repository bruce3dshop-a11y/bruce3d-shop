import { useState, useEffect, useRef } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  sender: string;
  message: string;
  created_at: string;
}

interface ClientMiniChatProps {
  orderId: number;
}

export default function ClientMiniChat({ orderId }: ClientMiniChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    apiFetch<any>(`orders/${orderId}`)
      .then((data) => {
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

  const unread = messages.filter(m => m.sender === "admin").length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-3 overflow-hidden"
      >
        <div className="rounded-xl border border-border/40 bg-background/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30">
            <span className="text-xs font-semibold text-muted-foreground">{t.dashboard.chat}</span>
            {unread > 0 && (
              <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
            )}
          </div>

          <div className="h-36 overflow-y-auto p-3 space-y-1.5">
            {!loaded && (
              <div className="flex justify-center pt-4">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {loaded && messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground pt-4">{t.dashboard.noMessages}</p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-2.5 py-1.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === "client"
                    ? "bg-primary text-white rounded-br-sm"
                    : "bg-card border border-primary/20 text-foreground rounded-bl-sm"
                }`}>
                  {msg.sender === "admin" && (
                    <div className="text-[10px] text-primary/70 font-semibold mb-0.5">Мастер</div>
                  )}
                  {msg.message}
                  <div className="text-[10px] opacity-50 mt-0.5 text-right">
                    {new Date(msg.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 border-t border-border/30 flex gap-1.5">
            <Input
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={t.dashboard.chatPlaceholder}
              className="bg-background/50 h-7 text-xs border-border/40 rounded-xl"
            />
            <Button
              size="sm"
              onClick={send}
              disabled={sending || !text.trim()}
              className="rounded-xl h-7 px-2.5 shrink-0"
            >
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
