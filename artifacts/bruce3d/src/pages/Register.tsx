import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff, RefreshCw } from "lucide-react";

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ["+", "-", "×"] as const;
  const op = ops[Math.floor(Math.random() * 3)];
  let answer: number;
  if (op === "+") answer = a + b;
  else if (op === "-") answer = Math.abs(a - b);
  else answer = a * b;
  const q = op === "-" ? `${Math.max(a, b)} − ${Math.min(a, b)}` : `${a} ${op} ${b}`;
  return { question: q, answer };
}

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", telegram: "", password: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState("");
  const { register } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const refreshCaptcha = () => {
    setCaptcha(generateCaptcha());
    setCaptchaInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(captchaInput) !== captcha.answer) {
      toast({ title: "Неверный ответ на капчу", description: "Попробуйте снова", variant: "destructive" });
      refreshCaptcha(); return;
    }
    if (form.password !== form.confirm) {
      toast({ title: "Пароли не совпадают", variant: "destructive" }); return;
    }
    if (form.password.length < 6) {
      toast({ title: "Пароль минимум 6 символов", variant: "destructive" }); return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, telegram: form.telegram, password: form.password });
      toast({ title: "🎉 Аккаунт создан!", description: "Теперь вы можете оформлять заказы." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Ошибка регистрации", description: err.message || "Попробуйте ещё раз", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="BRUCE 3D SHOP" className="h-20 w-20 object-contain mb-4 drop-shadow-[0_0_20px_rgba(147,51,234,0.5)]" />
          <h1 className="text-2xl font-black font-display uppercase text-center">
            Регистрация в <span className="text-primary">BRUCE 3D</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">Создайте аккаунт, чтобы оформлять заказы</p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Имя *</Label>
                <Input placeholder="Иван" value={form.name} onChange={update("name")} className="bg-background/50 h-10" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Телефон</Label>
                <Input placeholder="+7..." value={form.phone} onChange={update("phone")} className="bg-background/50 h-10" type="tel" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Email *</Label>
              <Input type="email" placeholder="your@email.com" value={form.email} onChange={update("email")} className="bg-background/50 h-10" required />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Telegram (необязательно)</Label>
              <Input placeholder="@username" value={form.telegram} onChange={update("telegram")} className="bg-background/50 h-10" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Пароль * (минимум 6 символов)</Label>
              <div className="relative">
                <Input
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={update("password")}
                  className="bg-background/50 h-10 pr-10"
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Подтверждение пароля *</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={update("confirm")}
                className="bg-background/50 h-10"
                required
                autoComplete="new-password"
              />
            </div>

            {/* CAPTCHA */}
            <div className="space-y-1.5">
              <Label className="text-sm">Защита от роботов</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50">
                  <span className="font-mono font-bold text-lg text-primary select-none">{captcha.question} = ?</span>
                </div>
                <button type="button" onClick={refreshCaptcha}
                  className="p-2.5 rounded-xl border border-border/50 bg-background/50 text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <Input
                type="number"
                placeholder="Введите ответ"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                className="bg-background/50 h-10"
                required
              />
            </div>

            <Button type="submit" className="h-11 rounded-full font-bold mt-1" disabled={loading}>
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Создать аккаунт</>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Войти
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
