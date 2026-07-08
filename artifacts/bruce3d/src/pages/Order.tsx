import { useState, useRef, useEffect } from "react";
import instructionImg from "@assets/EB79A94D-7992-4876-A4DE-0D6B8ED40700_1782231561624.png";
import { motion, AnimatePresence } from "framer-motion";
import ModelViewer from "@/components/ModelViewer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import {
  UploadCloud, Loader2, X, CheckCircle, ArrowRight,
  MapPin, Truck, Package, Home as HomeIcon, Plus,
  Printer, PenTool, ScanLine, Wrench, Phone, Mail, Send, User,
  ChevronRight, Sparkles, Zap, Calculator, Scale, Layers, Hash,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n";
import { calcEstimate as sharedCalc } from "@/lib/calc";

/* ─── Confetti ─────────────────────────────────────────────────────────── */
function ConfettiEffect({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d")!;
    const colors = ["#a855f7","#c084fc","#ffffff","#f0abfc","#818cf8","#e879f9","#fbbf24","#34d399"];
    type Particle = { x:number;y:number;vx:number;vy:number;color:string;w:number;h:number;rot:number;rotV:number };
    const particles: Particle[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * 300 - 20,
      vx: (Math.random() - 0.5) * 7,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      w: Math.random() * 12 + 5,
      h: Math.random() * 6 + 3,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 14,
    }));
    let frame = 0; let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = Math.max(0, 1 - frame / 210);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.rot += p.rotV;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = fade * Math.max(0, 1 - p.y / canvas.height * 0.6);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      frame++;
      if (frame < 240) raf = requestAnimationFrame(tick);
      else canvas.remove();
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); canvas.remove(); };
  }, [active]);
  return null;
}

/* ─── Zod schema ────────────────────────────────────────────────────────── */
const formSchema = z.object({
  name:             z.string().min(2, { message: "Имя должно содержать минимум 2 символа." }),
  phone:            z.string().optional(),
  email:            z.string().email({ message: "Введите корректный email." }).optional().or(z.literal("")),
  telegram:         z.string().optional(),
  description:      z.string().min(10, { message: "Опишите ваш заказ подробнее (минимум 10 символов)." }),
  deliveryType:     z.string().default("pickup"),
  deliveryFullName: z.string().optional(),
  deliveryPhone:    z.string().optional(),
  deliveryCity:     z.string().optional(),
  deliveryAddress:  z.string().optional(),
  deliveryIndex:    z.string().optional(),
}).refine(
  (data) => data.phone || data.email || data.telegram,
  { message: "Укажите хотя бы один способ связи.", path: ["phone"] }
);

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const MODEL_EXTS = new Set(["stl","obj","3mf","glb","gltf","ply"]);
const MAX_FILE_SIZE = 150 * 1024 * 1024;
function getExt(name: string) { return name.split(".").pop()?.toLowerCase() || ""; }
function getFileIcon(ext: string): string {
  if (MODEL_EXTS.has(ext)) return "🧊";
  if (["zip","rar","7z","tar","gz","bz2"].includes(ext)) return "🗜️";
  if (["jpg","jpeg","png","gif","bmp","webp","svg","tiff"].includes(ext)) return "🖼️";
  if (["pdf"].includes(ext)) return "📄";
  if (["dwg","dxf","step","stp","iges","igs","f3d","f3z","fcstd"].includes(ext)) return "📐";
  return "📎";
}

const SERVICE_CARDS = [
  { value:"3d-print",    icon:Printer,  label:"3D Печать",        desc:"FDM и смола",         border:"border-violet-500/30", activeBg:"bg-violet-500/15 border-violet-400/70", activeText:"text-violet-300", icon_bg:"bg-violet-500/15 text-violet-400" },
  { value:"3d-modeling", icon:PenTool,  label:"3D Моделирование", desc:"Любая сложность",     border:"border-blue-500/25",   activeBg:"bg-blue-500/15 border-blue-400/70",   activeText:"text-blue-300",   icon_bg:"bg-blue-500/15 text-blue-400" },
  { value:"3d-scanning", icon:ScanLine, label:"3D Сканирование",  desc:"Обратный инжиниринг", border:"border-cyan-500/25",   activeBg:"bg-cyan-500/15 border-cyan-400/70",   activeText:"text-cyan-300",   icon_bg:"bg-cyan-500/15 text-cyan-400" },
  { value:"repair",      icon:Wrench,   label:"Ремонт техники",   desc:"Запчасти и корпуса",  border:"border-orange-500/25", activeBg:"bg-orange-500/15 border-orange-400/70", activeText:"text-orange-300", icon_bg:"bg-orange-500/15 text-orange-400" },
];

const MATERIAL_CHIPS = [
  { value:"pla",   label:"PLA",   sub:"Универсальный", active:"bg-emerald-500/25 border-emerald-400/70 text-emerald-200" },
  { value:"petg",  label:"PETG",  sub:"Прочный",       active:"bg-blue-500/25 border-blue-400/70 text-blue-200" },
  { value:"abs",   label:"ABS",   sub:"Термостойкий",  active:"bg-amber-500/25 border-amber-400/70 text-amber-200" },
  { value:"tpu",   label:"TPU",   sub:"Гибкий",        active:"bg-orange-500/25 border-orange-400/70 text-orange-200" },
  { value:"resin", label:"Resin", sub:"Детализация",   active:"bg-purple-500/25 border-purple-400/70 text-purple-200" },
  { value:"other", label:"?",     sub:"Консультация",  active:"bg-slate-500/25 border-slate-400/70 text-slate-200" },
];

const DELIVERY_OPTS = [
  { value:"pickup", icon:HomeIcon, label:"Самовывоз",    desc:"Адрес у продавца" },
  { value:"cdek",   icon:Package,  label:"СДЭК",         desc:"По тарифам СДЭК" },
  { value:"post",   icon:Truck,    label:"Почта России", desc:"По тарифам Почты" },
  { value:"yandex", icon:Zap,      label:"Яндекс",       desc:"Москва и МО" },
];

const FILL_OPTIONS = [
  { v:15, label:"15%", hint:"Декор" },
  { v:20, label:"20%", hint:"Лёгкие" },
  { v:40, label:"40%", hint:"Стандарт" },
  { v:60, label:"60%", hint:"Прочные" },
  { v:80, label:"80%", hint:"Силовые" },
  { v:100, label:"100%", hint:"Монолит" },
];

const INPUT_CLS = "h-11 rounded-2xl border bg-white/[0.04] border-white/10 text-white placeholder:text-white/30 focus:border-primary/60 focus:ring-0 focus:bg-white/[0.06] transition-all duration-200 text-sm";

function StepCard({ num, title, children, error }: { num:string; title:string; children:React.ReactNode; error?:boolean }) {
  return (
    <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.38 }}
      className={`relative rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 ${
        error ? "border-red-500/45 bg-red-500/[0.04] shadow-[0_0_30px_rgba(239,68,68,0.1)]"
               : "border-white/[0.08] bg-white/[0.03] hover:border-purple-500/22 hover:bg-white/[0.05] shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      }`}>
      <div className="absolute -top-3.5 left-5 flex items-center gap-2">
        <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-widest shadow-[0_0_12px_rgba(147,51,234,0.5)]">{num}</span>
        <span className={`text-xs font-semibold px-1.5 rounded-md ${error ? "text-red-400 bg-red-500/10" : "text-white/70 bg-black/40"}`}>{title}</span>
      </div>
      <div className="mt-2">{children}</div>
    </motion.div>
  );
}

function FileItem({ file, onRemove }: { file:File; onRemove:()=>void }) {
  const ext = getExt(file.name);
  const isModel = MODEL_EXTS.has(ext);
  const icon = getFileIcon(ext);
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] overflow-hidden backdrop-blur-sm">
      <div className="flex items-center gap-3 px-3.5 py-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 text-sm">{icon}</div>
        <span className="text-sm text-white truncate flex-1">{file.name}</span>
        <span className="text-xs text-white/40 shrink-0">{(file.size/1024/1024).toFixed(1)} МБ</span>
        {isModel && (
          <button type="button" onClick={() => setShowPreview(v => !v)}
            className="text-xs text-primary hover:text-purple-300 font-semibold transition-colors shrink-0 px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20">
            {showPreview ? "Скрыть" : "3D ▸"}
          </button>
        )}
        <button type="button" onClick={onRemove}
          className="text-white/30 hover:text-red-400 transition-colors shrink-0 ml-1 p-1 rounded-lg hover:bg-red-500/10">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <AnimatePresence>
        {isModel && showPreview && (
          <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }} className="overflow-hidden">
            <ModelViewer file={file} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────────────── */
export default function Order() {
  const { toast } = useToast();
  const { user } = useAuth();
  useI18n(); // locale kept for future i18n use
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber:string; orderId?:number; estimatedPrice?:number } | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [serviceError, setServiceError] = useState(false);
  const [materialError, setMaterialError] = useState(false);

  // Price estimator state
  const [estWeight, setEstWeight] = useState<number>(0);
  const [estFill, setEstFill] = useState<number>(40);
  const [estQty, setEstQty] = useState<number>(1);

  const primaryMaterial = selectedMaterials[0] || "";
  const estimatedPrice = sharedCalc({ weightG: estWeight, materialId: primaryMaterial, infillPct: estFill, qty: estQty });

  // Auto-fill from saved user profile
  const savedAddress = (user as any)?.saved_address;
  const savedCity = (user as any)?.saved_city;
  const savedIndex = (user as any)?.saved_index;
  const savedFullName = (user as any)?.saved_full_name;

  function toggleService(value: string) { setServiceError(false); setSelectedServices(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]); }
  function toggleMaterial(value: string) { setMaterialError(false); setSelectedMaterials(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]); }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "", phone: user?.phone || "", email: user?.email || "", telegram: user?.telegram || "",
      description: "", deliveryType: "pickup",
      deliveryFullName: savedFullName || "", deliveryPhone: user?.phone || "", deliveryCity: savedCity || "",
      deliveryAddress: savedAddress || "", deliveryIndex: savedIndex || "",
    },
  });

  const deliveryType = form.watch("deliveryType");

  function addFiles(source: FileList | File[] | null) {
    if (!source) return;
    const snap = Array.from(source);
    if (!snap.length) return;
    setSelectedFiles(prev => {
      const seen = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...snap.filter(f => !seen.has(f.name + f.size))].slice(0, 10);
    });
  }
  function removeFile(idx: number) { setSelectedFiles(prev => prev.filter((_, i) => i !== idx)); }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    let hasError = false;
    if (!selectedServices.length) { setServiceError(true); hasError = true; }
    if (!selectedMaterials.length) { setMaterialError(true); hasError = true; }
    if (hasError) { toast({ title:"Заполните все поля", description:"Выберите услугу и материал.", variant:"destructive" }); return; }
    setIsSubmitting(true);
    try {
      const uploadedFileUrls: { url:string; originalName:string }[] = [];
      if (selectedFiles.length > 0) {
        const sigRes = await fetch(`${import.meta.env.BASE_URL}api/upload/sign?folder=orders`, { credentials:"include" });
        if (!sigRes.ok) throw new Error("Не удалось получить подпись для загрузки файлов");
        const { signature, apiKey, cloudName, timestamp, folder } = await sigRes.json() as any;
        for (const file of selectedFiles) {
          const ufd = new FormData();
          ufd.append("file", file); ufd.append("folder", folder); ufd.append("timestamp", timestamp);
          ufd.append("api_key", apiKey); ufd.append("signature", signature);
          const uRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method:"POST", body:ufd });
          if (!uRes.ok) { const e = await uRes.json().catch(()=>({})) as any; throw new Error(e?.error?.message || "Ошибка загрузки: " + file.name); }
          const ud = await uRes.json() as any;
          uploadedFileUrls.push({ url: ud.secure_url as string, originalName: file.name });
        }
      }
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
      fd.append("serviceType", selectedServices.join(", "));
      fd.append("material", selectedMaterials.join(", "));
      // Estimated price
      if (estimatedPrice?.base) {
        fd.append("estimatedWeight", String(estWeight));
        fd.append("estimatedFill", String(estFill));
        fd.append("estimatedQty", String(estQty));
        fd.append("estimatedPrice", String(estimatedPrice.base));
      }
      if (uploadedFileUrls.length > 0) fd.append("fileUrls", JSON.stringify(uploadedFileUrls));
      const res = await fetch(`${import.meta.env.BASE_URL}api/order`, { method:"POST", body:fd, credentials:"include" });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setSuccess({ orderNumber: data.orderNumber, orderId: data.orderId, estimatedPrice: estimatedPrice?.base });
      form.reset(); setSelectedFiles([]); setSelectedServices([]); setSelectedMaterials([]);
    } catch (err: any) {
      const msg = err?.message && !err.message.includes("Server error") ? err.message : "Не удалось отправить заказ. Попробуйте ещё раз.";
      toast({ title:"Ошибка отправки", description:msg, variant:"destructive" });
    } finally { setIsSubmitting(false); }
  }

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ConfettiEffect active={true} />
        <motion.div initial={{ scale:0.85, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ type:"spring", stiffness:180, damping:18 }}
          className="max-w-md w-full text-center">
          <div className="relative inline-flex mb-8">
            <div className="w-28 h-28 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(34,197,94,0.2)]">
              <CheckCircle className="w-14 h-14 text-green-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-green-500/5 blur-2xl scale-150 animate-pulse" />
          </div>
          <h2 className="text-4xl font-black font-display mb-3 text-gradient-purple">Заказ принят!</h2>
          <p className="text-white/50 mb-3 text-sm">Ваш номер заказа</p>
          <div className="inline-block text-3xl font-black text-primary mb-5 px-8 py-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_30px_rgba(147,51,234,0.15)]">
            #{success.orderNumber}
          </div>
          {success.estimatedPrice && (
            <div className="mb-5 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 inline-block">
              <div className="text-xs text-amber-400/70 mb-0.5">Примерная стоимость</div>
              <div className="text-2xl font-black text-amber-400">≈ {success.estimatedPrice.toLocaleString("ru")} ₽</div>
              <div className="text-xs text-white/30 mt-0.5">Точная цена будет уточнена</div>
            </div>
          )}
          <p className="text-white/50 mb-10 text-sm leading-relaxed">
            Мы свяжемся с вами в течение нескольких часов для расчёта стоимости.
          </p>
          <div className="flex flex-col gap-3">
            {success.orderId && (
              <Link href={`/order/${success.orderId}`}>
                <Button className="w-full rounded-full h-12 text-sm font-semibold shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                  Отследить заказ <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button variant="outline" className="w-full rounded-full h-12 border-white/10 hover:border-white/25 bg-white/[0.03]" onClick={() => setSuccess(null)}>
              Оформить ещё один заказ
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="relative overflow-hidden pt-16 pb-14 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[320px] bg-primary/[0.07] blur-[100px] rounded-full" />
          <div className="absolute top-8 left-1/4 w-[200px] h-[200px] bg-violet-600/[0.05] blur-[60px] rounded-full" />
          <div className="absolute top-8 right-1/4 w-[200px] h-[200px] bg-purple-600/[0.05] blur-[60px] rounded-full" />
        </div>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 backdrop-blur-sm">
            <Sparkles className="w-3 h-3" /> Бесплатный расчёт стоимости
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-4">
            <span className="text-white">Оформить</span><br />
            <span className="text-gradient-cosmic">заказ</span>
          </h1>
          <p className="text-white/45 text-base md:text-lg max-w-md mx-auto mb-6 leading-relaxed">
            Заполните форму — рассчитаем стоимость и свяжемся с вами в течение нескольких часов.
          </p>
          <button type="button" onClick={() => setShowInstruction(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-primary transition-colors">
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showInstruction ? "rotate-90" : ""}`} />
            {showInstruction ? "Скрыть" : "Как заполнить форму?"}
          </button>
          <AnimatePresence>
            {showInstruction && (
              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden mt-4 max-w-lg mx-auto">
                <div className="rounded-3xl overflow-hidden border border-primary/20 shadow-xl shadow-primary/10">
                  <img src={instructionImg} alt="Как заполнить форму" className="w-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* 01 Контакты */}
            <StepCard num="01" title="Ваши данные" error={!!form.formState.errors.name || !!form.formState.errors.phone}>
              <div className="space-y-3">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <FormControl><Input placeholder="Ваше имя *" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <FormControl><Input placeholder="+7 999 000 00 00" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <FormControl><Input placeholder="Email" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="telegram" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Send className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <FormControl><Input placeholder="@telegram" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                      </div>
                    </FormItem>
                  )} />
                </div>
                <p className="text-xs text-white/30">* — обязательное поле. Укажите хотя бы один способ связи.</p>
              </div>
            </StepCard>

            {/* 02 Услуга */}
            <StepCard num="02" title="Тип услуги" error={serviceError}>
              <div className="space-y-3">
                {serviceError && <p className="text-xs text-red-400 flex items-center gap-1.5">⚠ Выберите хотя бы одну услугу</p>}
                <div className="grid grid-cols-2 gap-2.5">
                  {SERVICE_CARDS.map(({ value, icon:Icon, label, desc, activeBg, activeText, icon_bg }) => {
                    const isActive = selectedServices.includes(value);
                    return (
                      <button key={value} type="button" onClick={() => toggleService(value)}
                        className={`relative flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                          isActive ? `${activeBg} shadow-lg` : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                        }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isActive ? icon_bg : "bg-white/[0.06] text-white/40"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold transition-colors ${isActive ? activeText : "text-white/70"}`}>{label}</div>
                          <div className="text-xs text-white/35">{desc}</div>
                        </div>
                        {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current opacity-80" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </StepCard>

            {/* 03 Материал */}
            <StepCard num="03" title="Материал" error={materialError}>
              {materialError && <p className="text-xs text-red-400 mb-3 flex items-center gap-1.5">⚠ Выберите хотя бы один материал</p>}
              <div className="grid grid-cols-3 gap-2">
                {MATERIAL_CHIPS.map(({ value, label, sub, active }) => {
                  const isActive = selectedMaterials.includes(value);
                  return (
                    <button key={value} type="button" onClick={() => toggleMaterial(value)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 ${
                        isActive ? active : "border-white/[0.07] bg-white/[0.02] text-white/50 hover:border-white/15 hover:bg-white/[0.04]"
                      }`}>
                      <div className={`text-base font-black mb-0.5 ${isActive ? "" : "text-white/60"}`}>{label}</div>
                      <div className="text-[10px] leading-tight text-white/35">{sub}</div>
                    </button>
                  );
                })}
              </div>
            </StepCard>

            {/* 💰 PRICE ESTIMATOR */}
            <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="relative rounded-3xl border border-amber-500/25 bg-amber-500/[0.04] p-6 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
              <div className="absolute -top-3.5 left-5 flex items-center gap-2">
                <span className="bg-amber-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.5)]">💰</span>
                <span className="text-xs font-semibold px-1.5 rounded-md text-amber-400/80 bg-black/40">Примерная стоимость</span>
              </div>
              <div className="mt-2">
                <p className="text-xs text-white/35 mb-4">Укажите параметры детали для ориентировочного расчёта. Не обязательно — можно пропустить.</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {/* Weight */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1"><Scale className="w-3 h-3" /> Вес (г)</label>
                    <input type="number" min="0" max="5000" value={estWeight || ""} placeholder="напр. 150"
                      onChange={e => setEstWeight(Math.max(0, Number(e.target.value)))}
                      className={`${INPUT_CLS} w-full px-3`} />
                  </div>
                  {/* Fill */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1"><Layers className="w-3 h-3" /> Заполнение</label>
                    <select value={estFill} onChange={e => setEstFill(Number(e.target.value))}
                      className={`${INPUT_CLS} w-full px-3 bg-[#0d0318] cursor-pointer`}>
                      {FILL_OPTIONS.map(f => <option key={f.v} value={f.v}>{f.label} — {f.hint}</option>)}
                    </select>
                  </div>
                  {/* Qty */}
                  <div>
                    <label className="text-xs text-white/40 mb-1.5 flex items-center gap-1"><Hash className="w-3 h-3" /> Кол-во</label>
                    <input type="number" min="1" max="1000" value={estQty}
                      onChange={e => setEstQty(Math.max(1, Number(e.target.value)))}
                      className={`${INPUT_CLS} w-full px-3`} />
                  </div>
                </div>
                {/* Result */}
                <AnimatePresence mode="wait">
                  {estimatedPrice ? (
                    <motion.div key="price" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                      className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                      <div>
                        <div className="text-xs text-amber-400/60 mb-0.5">Ориентировочная цена</div>
                        <div className="text-3xl font-black text-amber-400">
                          {estimatedPrice.min.toLocaleString("ru")}–{estimatedPrice.max.toLocaleString("ru")} ₽
                        </div>
                        <div className="text-xs text-white/25 mt-1">
                          {primaryMaterial.toUpperCase()} · {estFill}% · {estQty} шт · {estWeight} г
                        </div>
                      </div>
                      <Calculator className="w-10 h-10 text-amber-400/30" />
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                      <Calculator className="w-6 h-6 text-white/15 shrink-0" />
                      <p className="text-xs text-white/25">
                        {!primaryMaterial ? "Выберите материал выше" : "Укажите вес детали для расчёта"}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {estimatedPrice && (
                  <p className="text-xs text-white/20 mt-2.5 text-center">
                    Точная стоимость может отличаться · Включает печать, не включает постобработку и доставку
                  </p>
                )}
              </div>
            </motion.div>

            {/* 04 Описание */}
            <StepCard num="04" title="Описание задачи" error={!!form.formState.errors.description}>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Опишите подробно что нужно: размеры, цвет, количество, особые требования, ссылки на референсы..."
                      rows={5} {...field}
                      className="rounded-2xl border bg-white/[0.04] border-white/10 text-white placeholder:text-white/25 focus:border-primary/55 focus:ring-0 resize-none text-sm leading-relaxed p-4 transition-all duration-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </StepCard>

            {/* 05 Файлы */}
            <StepCard num="05" title="Файлы (необязательно)">
              <div className="space-y-2.5">
                {selectedFiles.map((file, idx) => <FileItem key={idx} file={file} onRemove={() => removeFile(idx)} />)}
                {selectedFiles.length === 0 ? (
                  <label
                    className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
                      isDragging ? "border-primary/70 bg-primary/[0.08] scale-[1.01]" : "border-white/[0.10] hover:border-primary/40 hover:bg-primary/[0.04]"
                    }`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
                  >
                    <input ref={fileInputRef} type="file" multiple style={{ position:"absolute",width:"1px",height:"1px",opacity:0,overflow:"hidden" }}
                      onChange={e => { const files = Array.from(e.target.files ?? []); e.target.value = ""; addFiles(files); }} />
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all ${isDragging ? "bg-primary/20 border-primary/50" : "bg-white/[0.04] border-white/[0.08] group-hover:bg-primary/10 group-hover:border-primary/30"}`}>
                      <UploadCloud className={`w-7 h-7 transition-colors ${isDragging ? "text-primary" : "text-white/30 group-hover:text-primary/60"}`} />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-white/50 group-hover:text-white/80 transition-colors">
                        {isDragging ? "Отпустите файлы здесь" : "Нажмите или перетащите файлы"}
                      </div>
                      <div className="text-xs text-white/25 mt-1.5">STL, 3MF, OBJ, GLB · фото, PDF, чертежи · до 150 МБ · до 10 шт</div>
                    </div>
                  </label>
                ) : selectedFiles.length < 10 ? (
                  <label className="relative flex items-center justify-center gap-2 w-full h-11 transition-all border border-dashed rounded-2xl cursor-pointer border-white/[0.10] hover:border-primary/40 hover:bg-primary/[0.03] text-sm text-white/35 hover:text-primary/70">
                    <input type="file" multiple style={{ position:"absolute",width:"1px",height:"1px",opacity:0,overflow:"hidden" }}
                      onChange={e => { const files = Array.from(e.target.files ?? []); e.target.value = ""; addFiles(files); }} />
                    <Plus className="w-4 h-4" /> Добавить ещё файлы
                  </label>
                ) : null}
              </div>
            </StepCard>

            {/* 06 Доставка */}
            <StepCard num="06" title="Способ получения">
              <FormField control={form.control} name="deliveryType" render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DELIVERY_OPTS.map(({ value, icon:Icon, label, desc }) => {
                      const isSel = field.value === value;
                      return (
                        <button key={value} type="button" onClick={() => field.onChange(value)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                            isSel ? "border-primary/60 bg-primary/[0.10] shadow-[0_0_20px_rgba(147,51,234,0.12)]" : "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                          }`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSel ? "bg-primary/20 text-primary" : "bg-white/[0.06] text-white/35"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isSel ? "text-primary" : "text-white/65"}`}>{label}</div>
                            <div className="text-xs text-white/30">{desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence mode="wait">
                    {deliveryType === "pickup" ? (
                      <motion.div key="pickup" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                        <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-primary/[0.06] border border-primary/15">
                          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-semibold text-white mb-0.5">Адрес самовывоза</div>
                            <div className="text-xs text-white/40 leading-relaxed">Адрес уточните у продавца через мессенджер после подтверждения заказа.</div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="delivery" initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }} className="overflow-hidden">
                        <div className="pt-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-white/35 pb-1">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> Данные для доставки
                          </div>
                          <FormField control={form.control} name="deliveryFullName" render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <FormControl><Input placeholder="ФИО получателя *" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                              </div>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="deliveryPhone" render={({ field }) => (
                            <FormItem>
                              <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <FormControl><Input placeholder="Телефон получателя *" {...field} className={`pl-10 ${INPUT_CLS}`} /></FormControl>
                              </div>
                            </FormItem>
                          )} />
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="deliveryCity" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="Город" {...field} className={INPUT_CLS} /></FormControl></FormItem>
                            )} />
                            <FormField control={form.control} name="deliveryIndex" render={({ field }) => (
                              <FormItem><FormControl><Input placeholder="Индекс" {...field} className={INPUT_CLS} /></FormControl></FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Улица, дом, квартира" {...field} className={INPUT_CLS} />
                              </FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <FormMessage />
                </FormItem>
              )} />
            </StepCard>

            {/* Submit */}
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}>
              <Button type="submit" disabled={isSubmitting}
                className="w-full h-14 text-base font-bold rounded-2xl btn-shimmer shadow-[0_0_40px_rgba(147,51,234,0.3)] hover:shadow-[0_0_60px_rgba(147,51,234,0.5)] transition-all">
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Отправляем заказ...</>
                  : <><Sparkles className="mr-2 h-5 w-5" /> Отправить заказ <ArrowRight className="ml-2 h-5 w-5" /></>
                }
              </Button>
              {estimatedPrice && (
                <div className="text-center mt-3 text-sm text-amber-400/70 font-semibold">
                  Примерная стоимость: ≈ {estimatedPrice.min.toLocaleString("ru")}–{estimatedPrice.max.toLocaleString("ru")} ₽ · будет отправлена вместе с заявкой
                </div>
              )}
              <p className="text-center text-xs text-white/25 mt-2">
                Стоимость рассчитывается после заявки · Ответим в течение нескольких часов
              </p>
            </motion.div>

          </form>
        </Form>
      </div>
    </div>
  );
}
