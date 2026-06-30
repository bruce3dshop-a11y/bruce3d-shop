import { useState, useEffect, useRef } from "react";
  import { apiFetch, apiUrl } from "@/lib/api";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Send, MessageCircle, Paperclip, Download } from "lucide-react";
  import { useToast } from "@/hooks/use-toast";
  import { getUploadSignature, uploadFileToCloudinary } from "@/lib/cloudinary";

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

  function renderMsg(text: string) {
    if (text.startsWith("[FILE:")) {
      const inner = text.slice(6, -1);
      const pipeIdx = inner.indexOf("|");
      const url = pipeIdx >= 0 ? inner.slice(0, pipeIdx) : inner;
      const name = pipeIdx >= 0 ? inner.slice(pipeIdx + 1) : "Файл";
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" download
          className="flex items-center gap-1.5 underline hover:no-underline">
          <Download className="w-3 h-3 shrink-0" />
          <span className="truncate max-w-[180px]">{name}</span>
        </a>
      );
    }
    return <span className="whitespace-pre-wrap break-words">{text}</span>;
  }

  export default function AdminOrderChat({ orderId, orderNumber }: AdminOrderChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
      apiFetch<any>(`orders/${orderId}`)
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
              if (prev.find((m: Message) => m.id === payload.message.id)) return prev;
              return [...prev, payload.message];
            });
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
          }
        } catch {}
      };
      return () => es.close();
    }, [orderId]);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendRaw = async (msg: string) => {
      if (!msg || sending) return;
      setSending(true);
      try {
        await apiFetch(`chat/${orderId}/send`, {
          method: "POST",
          body: JSON.stringify({ message: msg }),
        });
        setText("");
      } catch {
        toast({ title: "Ошибка отправки", variant: "destructive" });
      } finally {
        setSending(false);
      }
    };

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || uploadingFile) return;
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadingFile(true);
      try {
        const sig = await getUploadSignature();
        const url = await uploadFileToCloudinary(file, sig);
        await sendRaw(`[FILE:${url}|${file.name}]`);
      } catch {
        toast({ title: "Ошибка загрузки файла", variant: "destructive" });
      } finally {
        setUploadingFile(false);
      }
    };

    const today = new Date().toDateString();
    const formatTime = (ts: string) => new Date(ts).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
    const formatDate = (ts: string) => {
      const d = new Date(ts);
      return d.toDateString() === today ? formatTime(ts) : d.toLocaleDateString("ru", { day: "numeric", month: "short" }) + " " + formatTime(ts);
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
          <div className="h-56 overflow-y-auto p-3 space-y-2 scroll-smooth">
            {!loaded && (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {loaded && messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8 flex flex-col items-center gap-2">
                <MessageCircle className="w-6 h-6 opacity-20" />
                Напишите первым — клиент получит уведомление
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
                  {renderMsg(msg.message)}
                  <div className="text-[10px] opacity-50 mt-0.5 text-right">{formatDate(msg.created_at)}</div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2 border-t border-border/30 flex gap-1.5">
            <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" accept="*/*" />
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile || sending}
              className="rounded-xl h-8 px-2 shrink-0 text-muted-foreground hover:text-primary" title="Прикрепить файл">
              {uploadingFile
                ? <div className="w-3 h-3 border border-primary border-t-transparent rounded-full animate-spin" />
                : <Paperclip className="w-3.5 h-3.5" />}
            </Button>
            <Input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendRaw(text.trim()); } }}
              placeholder="Ответить клиенту..." className="bg-background/50 h-8 text-xs border-border/40 rounded-xl" />
            <Button size="sm" onClick={() => sendRaw(text.trim())} disabled={sending || !text.trim()}
              className="rounded-xl h-8 px-3 shrink-0">
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
  