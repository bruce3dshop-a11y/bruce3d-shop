import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Camera, Save, ArrowLeft, MapPin, Phone, Mail, MessageCircle, Lock, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

const INPUT_CLS = "w-full h-11 rounded-2xl border bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:outline-none focus:bg-white/[0.06] transition-all duration-200 text-sm px-4";

export default function Profile() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<string>((user as any)?.avatar_url || "");
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    telegram: user?.telegram || "",
    saved_city: (user as any)?.saved_city || "",
    saved_address: (user as any)?.saved_address || "",
    saved_index: (user as any)?.saved_index || "",
    saved_full_name: (user as any)?.saved_full_name || "",
    password: "",
    password_new: "",
  });

  const initials = user?.name?.split(" ").map((p: string) => p[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", "avatar");
      const res = await fetch(`${import.meta.env.BASE_URL}api/upload`, { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (data.url) {
        setAvatar(data.url);
        toast({ title: "Аватар загружен" });
      } else {
        toast({ title: "Ошибка загрузки", variant: "destructive" });
      }
    } catch {
      toast({ title: "Ошибка загрузки", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch("auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          telegram: form.telegram,
          avatar_url: avatar,
          saved_city: form.saved_city,
          saved_address: form.saved_address,
          saved_index: form.saved_index,
          saved_full_name: form.saved_full_name,
          ...(form.password && form.password_new ? { password: form.password, password_new: form.password_new } : {}),
        }),
      });
      await refresh();
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast({ title: "Профиль сохранён ✓", description: "Адрес доставки будет автоматически подставляться в заказы" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e?.message || "Не удалось сохранить", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen">
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 py-12 max-w-2xl relative z-10">

        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Личный кабинет
        </Link>

        <h1 className="text-3xl font-black font-display mb-8">
          Мой <span className="text-gradient-purple">профиль</span>
        </h1>

        {/* Avatar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-6 p-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm mb-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-primary/30">
              {avatar ? <img src={avatar} alt="avatar" className="w-full h-full object-cover" /> : initials}
            </div>
            {/* Кнопка загрузки фото */}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              title="Изменить фото"
            >
              {uploading ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            {/* Кнопка удаления аватара — появляется только если аватар установлен */}
            {avatar && (
              <button
                onClick={() => { setAvatar(""); toast({ title: "Аватар удалён", description: "Нажмите «Сохранить» для применения" }); }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                title="Удалить фото"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <div className="font-black text-lg">{user?.name}</div>
            <div className="text-sm text-white/40">{user?.email}</div>
            <div className="text-xs text-white/25 mt-1">
              {avatar ? "Нажмите 🗑 чтобы удалить · 📷 чтобы изменить фото" : "Нажмите на камеру чтобы добавить фото"}
            </div>
          </div>
        </motion.div>

        {/* Personal info */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="p-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm mb-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Личные данные
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Имя</label>
              <input className={INPUT_CLS} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Имя" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5"><Phone className="w-3 h-3" /> Телефон</label>
              <input className={INPUT_CLS} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+7 (___) ___-__-__" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /> Telegram</label>
              <input className={INPUT_CLS} value={form.telegram} onChange={e => setForm(p => ({ ...p, telegram: e.target.value }))} placeholder="@username" />
            </div>
          </div>
        </motion.div>

        {/* Delivery address */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="p-6 rounded-3xl border border-primary/20 bg-primary/[0.04] backdrop-blur-sm mb-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-primary/70 mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Адрес доставки по умолчанию
          </h2>
          <p className="text-xs text-white/30 mb-4">Автоматически подставится при оформлении нового заказа</p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">ФИО получателя</label>
              <input className={INPUT_CLS} value={form.saved_full_name} onChange={e => setForm(p => ({ ...p, saved_full_name: e.target.value }))} placeholder="Фамилия Имя Отчество" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Город</label>
                <input className={INPUT_CLS} value={form.saved_city} onChange={e => setForm(p => ({ ...p, saved_city: e.target.value }))} placeholder="Москва" />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Индекс</label>
                <input className={INPUT_CLS} value={form.saved_index} onChange={e => setForm(p => ({ ...p, saved_index: e.target.value }))} placeholder="123456" />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Улица, дом, квартира</label>
              <input className={INPUT_CLS} value={form.saved_address} onChange={e => setForm(p => ({ ...p, saved_address: e.target.value }))} placeholder="ул. Примерная, д.1, кв.1" />
            </div>
          </div>
        </motion.div>

        {/* Change password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="p-6 rounded-3xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm mb-6">
          <h2 className="font-bold text-sm uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Смена пароля <span className="text-white/20 normal-case font-normal">(необязательно)</span>
          </h2>
          <div className="space-y-3">
            <input type="password" className={INPUT_CLS} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="Текущий пароль" />
            <input type="password" className={INPUT_CLS} value={form.password_new} onChange={e => setForm(p => ({ ...p, password_new: e.target.value }))} placeholder="Новый пароль (мин. 6 символов)" />
          </div>
        </motion.div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/30">
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Сохраняем..." : "Сохранить профиль"}
        </Button>

      </div>
    </motion.div>
  );
}
