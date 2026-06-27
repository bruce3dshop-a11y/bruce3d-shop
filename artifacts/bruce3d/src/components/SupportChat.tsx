import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Message {
  id: number;
  session_id: number;
  sender: "admin" | "client";
  message: string;
  created_at: string;
}

interface Session {
  id: number;
  session_key: string;
  visitor_name: string;
  status: string;
}

const STORAGE_KEY = "bruce3d_support_key";

export default function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [nameAsked, setNameAsked] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Start or restore session
  const startSession = useCallback(async (name?: string) => {
    setLoading(true);
    try {
      const existingKey = localStorage.getItem(STORAGE_KEY);
      const body: Record<string, string> = {};
      if (existingKey) body.sessionKey = existingKey;
      if (name) body.visitorName = name;

      const res = await fetch(apiUrl("support/start"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setMessages(data.messages || []);
        if (data.session.status === "closed") setClosed(true);
        localStorage.setItem(STORAGE_KEY, data.session.session_key);
        connectSSE(data.session.session_key);
        scrollToBottom();
      }
    } catch (e) {
      console.error("Support start error:", e);
    } finally {
      setLoading(false);
    }
  }, [scrollToBottom]);

  // SSE connection
  const connectSSE = useCallback((sessionKey: string) => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(apiUrl(`support/${sessionKey}/stream`), { withCredentials: true });
    esRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "message") {
          setMessages(prev => [...prev, data.message]);
          if (data.message.sender === "admin" && !open) {
            setUnread(prev => prev + 1);
          }
          scrollToBottom();
        } else if (data.type === "closed") {
          setClosed(true);
        }
      } catch {}
    };
    es.onerror = () => { es.close(); };
  }, [open, scrollToBottom]);

  // When user opens chat for the first time
  const handleOpen = useCallback(() => {
    setOpen(true);
    setUnread(0);
    if (!session) {
      const existingKey = localStorage.getItem(STORAGE_KEY);
      if (existingKey || user) {
        startSession(user?.name);
      } else {
        setNameAsked(true);
      }
    }
  }, [session, user, startSession]);

  // Handle name form submit
  const handleNameSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const name = visitorName.trim() || "Гость";
    setNameAsked(false);
    startSession(name);
  }, [visitorName, startSession]);

  // Start a brand new chat after admin closes the session
  const startNewChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setSession(null);
    setMessages([]);
    setClosed(false);
    setInput("");
    setVisitorName("");
    const existingKey = localStorage.getItem(STORAGE_KEY);
    if (user) {
      startSession(user.name);
    } else if (existingKey) {
      startSession();
    } else {
      setNameAsked(true);
    }
  }, [user, startSession]);

  // Send message
  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !session || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await fetch(apiUrl(`support/${session.session_key}/send`), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }, [input, session, sending]);

  // Cleanup SSE on unmount
  useEffect(() => {
    return () => { esRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 rounded-2xl border border-white/10 bg-[#0f0f14]/95 backdrop-blur-xl shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            style={{ maxHeight: "480px" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-gradient-to-r from-primary/10 to-violet-900/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Чат с оператором</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] text-emerald-400">BRUCE 3D SHOP</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name form */}
            {nameAsked && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                <MessageCircle className="w-10 h-10 text-primary/60" />
                <p className="text-sm text-white/70 text-center">Как вас зовут? (необязательно)</p>
                <form onSubmit={handleNameSubmit} className="w-full flex flex-col gap-2">
                  <input
                    value={visitorName}
                    onChange={e => setVisitorName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50"
                    autoFocus
                  />
                  <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-semibold py-2 rounded-xl transition-all">
                    Начать чат
                  </button>
                </form>
              </div>
            )}

            {/* Loading */}
            {loading && !nameAsked && (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            )}

            {/* Messages */}
            {!nameAsked && !loading && (
              <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0" style={{ maxHeight: "300px" }}>
                {messages.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-xs text-white/30">Напишите ваш вопрос — оператор ответит в ближайшее время</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                      msg.sender === "client"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-white/8 text-white/90 rounded-bl-sm"
                    }`}>
                      {msg.sender === "admin" && (
                        <p className="text-[10px] text-primary/80 font-semibold mb-0.5">Оператор</p>
                      )}
                      <p className="leading-relaxed break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 ${msg.sender === "client" ? "text-white/50 text-right" : "text-white/30"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                {closed && (
                  <div className="text-center py-3 flex flex-col items-center gap-2">
                    <span className="text-[10px] text-white/30 bg-white/5 px-3 py-1 rounded-full">Чат закрыт оператором</span>
                    <button
                      onClick={startNewChat}
                      className="text-xs text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    >
                      Начать новый чат
                    </button>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Input */}
            {!nameAsked && !loading && !closed && session && (
              <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-white/8">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Сообщение..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50 min-w-0"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 shrink-0 rounded-xl bg-primary disabled:opacity-40 hover:bg-primary/90 flex items-center justify-center text-white transition-all"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
            {!nameAsked && !loading && closed && (
              <div className="p-3 border-t border-white/8">
                <button
                  onClick={startNewChat}
                  className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-semibold transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Начать новый чат
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={open ? () => setOpen(false) : handleOpen}
        className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-violet-600 shadow-lg shadow-primary/30 flex items-center justify-center text-white transition-all"
        title="Чат с оператором"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
