import { useState, useRef } from "react";
import instructionImg from "@assets/EB79A94D-7992-4876-A4DE-0D6B8ED40700_1782231561624.png";
import { motion, AnimatePresence } from "framer-motion";
import ModelViewer from "@/components/ModelViewer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import {
  UploadCloud, Loader2, X, FileText, CheckCircle, ArrowRight,
  MapPin, Truck, Package, Home as HomeIcon, Bike, Plus,
  Printer, PenTool, ScanLine, Wrench, Phone, Mail, Send, User,
  ChevronRight, Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { uploadFilesToCloudinary } from "@/lib/cloudinary";
import { useI18n } from "@/lib/i18n";

const formSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа." }),
  phone: z.string().optional(),
  email: z.string().email({ message: "Введите корректный email." }).optional().or(z.literal("")),
  telegram: z.string().optional(),
  serviceType: z.string().min(1, { message: "Выберите тип услуги." }),
  material: z.string().min(1, { message: "Выберите материал." }),
  description: z.string().min(10, { message: "Опишите ваш заказ подробнее (минимум 10 символов)." }),
  deliveryType: z.string().default("pickup"),
  deliveryCity: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryIndex: z.string().optional(),
}).refine(
  (data) => data.phone || data.email || data.telegram,
  { message: "Укажите хотя бы один способ связи.", path: ["phone"] }
);

const MODEL_EXTS = new Set(["stl", "obj"]);
const MAX_FILE_SIZE = 150 * 1024 * 1024;

function getExt(name: string) { return name.split(".").pop()?.toLowerCase() || ""; }

const SERVICE_CARDS = [
  { value: "3d-print",    icon: Printer,   label: "3D Печать",        desc: "FDM и смола",     color: "from-violet-500/20 to-purple-500/10",  border: "border-violet-500/40",  active: "bg-violet-500/15 border-violet-400/70 shadow-violet-500/20" },
  { value: "3d-modeling", icon: PenTool,   label: "3D Моделирование", desc: "Любая сложность", color: "from-blue-500/20 to-cyan-500/10",       border: "border-blue-500/30",    active: "bg-blue-500/15 border-blue-400/70 shadow-blue-500/20" },
  { value: "3d-scanning", icon: ScanLine,  label: "3D Сканирование",  desc: "Обратный инжиниринг", color: "from-cyan-500/20 to-teal-500/10", border: "border-cyan-500/30",    active: "bg-cyan-500/15 border-cyan-400/70 shadow-cyan-500/20" },
  { value: "repair",      icon: Wrench,    label: "Ремонт техники",   desc: "Запчасти и корпуса", color: "from-orange-500/20 to-amber-500/10", border: "border-orange-500/30",  active: "bg-orange-500/15 border-orange-400/70 shadow-orange-500/20" },
];

const MATERIAL_CHIPS = [
  { value: "pla",   label: "PLA",   sub: "Универсальный" },
  { value: "petg",  label: "PETG",  sub: "Прочный" },
  { value: "abs",   label: "ABS",   sub: "Термостойкий" },
  { value: "tpu",   label: "TPU",   sub: "Гибкий" },
  { value: "resin", label: "Resin", sub: "Детализация" },
  { value: "other", label: "?",     sub: "Консультация" },
];

const DELIVERY_OPTS = [
  { value: "pickup",  icon: HomeIcon, label: "Самовывоз",      desc: "Адрес у продавца" },
  { value: "cdek",    icon: Package,  label: "СДЭК",           desc: "По тарифам СДЭК" },
  { value: "post",    icon: Truck,    label: "Почта России",   desc: "По тарифам Почты" },
  { value: "courier", icon: Bike,     label: "Курьер",         desc: "Москва и МО" },
];

function StepCard({ num, title, children, error }: { num: string; title: string; children: React.ReactNode; error?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`relative rounded-2xl border bg-card/40 backdrop-blur-sm p-6 transition-colors ${error ? "border-red-500/40" : "border-border/40 hover:border-primary/20"}`}
    >
      <div className="absolute -top-3.5 left-5 flex items-center gap-2">
        <span className="bg-primary text-primary-foreground text-xs font-black px-2.5 py-0.5 rounded-full tracking-widest">{num}</span>
        <span className="text-sm font-semibold text-foreground/80 bg-background px-1">{title}</span>
      </div>
      <div className="mt-2">{children}</div>
    </motion.div>
  );
}

function FileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const ext = getExt(file.name);
  const isModel = MODEL_EXTS.has(ext);
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
        <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024 / 1024).toFixed(1)} МБ</span>
        {isModel && (
          <button type="button" onClick={() => setShowPreview(v => !v)}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors shrink-0 px-1.5 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20">
            {showPreview ? "Скрыть" : "3D ▸"}
          </button>
        )}
        <button type="button" onClick={onRemove}
          className="text-muted-foreground hover:text-red-400 transition-colors shrink-0 ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <AnimatePresence>
        {isModel && showPreview && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <ModelViewer file={file} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Order() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [success, setSuccess] = useState<{ orderNumber: string; orderId?: number } | null>(null);
  const [showInstruction, setShowInstruction] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "", phone: user?.phone || "", email: user?.email || "", telegram: user?.telegram || "",
      serviceType: "", material: "", description: "",
      deliveryType: "pickup", deliveryCity: "", deliveryAddress: "", deliveryIndex: "",
    },
  });

  const deliveryType = form.watch("deliveryType");

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      const toAdd = Array.from(newFiles).filter(f => !existing.has(f.name + f.size));
      return [...prev, ...toAdd].slice(0, 10);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v) fd.append(k, v as string); });
      if (selectedFiles.length > 0) {
        const uploaded = await uploadFilesToCloudinary(selectedFiles, "orders");
        if (uploaded.length > 0) {
          fd.append("fileUrls", JSON.stringify(uploaded));
        } else {
          selectedFiles.forEach(file => fd.append("files", file));
        }
      }
      const res = await fetch(`${import.meta.env.BASE_URL}api/order`, { method: "POST", body: fd, credentials: "include" });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setSuccess({ orderNumber: data.orderNumber, orderId: data.orderId });
      form.reset();
      setSelectedFiles([]);
    } catch {
      toast({ title: "Ошибка отправки", description: "Не удалось отправить заказ. Попробуйте ещё раз.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full text-center"
        >
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <div className="absolute inset-0 rounded-full bg-green-500/5 blur-xl scale-150" />
          </div>
          <h2 className="text-4xl font-black font-display mb-3">
            Заказ <span className="text-green-400">принят!</span>
          </h2>
          <p className="text-muted-foreground mb-3 text-sm">Ваш номер заказа</p>
          <div className="inline-block text-3xl font-black text-primary mb-4 px-6 py-2 rounded-2xl bg-primary/10 border border-primary/20">
            #{success.orderNumber}
          </div>
          <p className="text-muted-foreground mb-10 text-sm leading-relaxed">
            Мы свяжемся с вами в течение нескольких часов для расчёта стоимости.
          </p>
          <div className="flex flex-col gap-3">
            {success.orderId && (
              <Link href={`/order/${success.orderId}`}>
                <Button className="w-full rounded-full h-12 text-sm font-semibold">
                  Отследить заказ <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button variant="outline" className="w-full rounded-full h-12" onClick={() => setSuccess(null)}>
              Оформить ещё один заказ
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pt-16 pb-12 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[80px] rounded-full" />
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
            <Sparkles className="w-3 h-3" /> Бесплатный расчёт стоимости
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight mb-4">
            Оформить<br /><span className="text-primary">заказ</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-6">
            Заполните форму — рассчитаем стоимость и свяжемся с вами в течение нескольких часов.
          </p>
          <button
            type="button"
            onClick={() => setShowInstruction(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showInstruction ? "rotate-90" : ""}`} />
            {showInstruction ? "Скрыть" : "Как заполнить форму?"}
          </button>
          <AnimatePresence>
            {showInstruction && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-4 max-w-lg mx-auto"
              >
                <div className="rounded-2xl overflow-hidden border border-primary/20 shadow-lg shadow-primary/5">
                  <img src={instructionImg} alt="Как заполнить форму" className="w-full" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Form ── */}
      <div className="container mx-auto px-4 max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* ── 01 Контакты ── */}
            <StepCard num="01" title="Ваши данные" error={!!form.formState.errors.name || !!form.formState.errors.phone}>
              <div className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="Ваше имя *" {...field} className="pl-10 bg-background/60 border-border/50 h-11 rounded-xl focus:border-primary/50" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="+7 999 000 00 00" {...field} className="pl-10 bg-background/60 border-border/50 h-11 rounded-xl focus:border-primary/50" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="Email" {...field} className="pl-10 bg-background/60 border-border/50 h-11 rounded-xl focus:border-primary/50" />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="telegram" render={({ field }) => (
                    <FormItem>
                      <div className="relative">
                        <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <FormControl>
                          <Input placeholder="@telegram" {...field} className="pl-10 bg-background/60 border-border/50 h-11 rounded-xl focus:border-primary/50" />
                        </FormControl>
                      </div>
                    </FormItem>
                  )} />
                </div>
                <p className="text-xs text-muted-foreground/70">* — обязательное поле. Укажите хотя бы один способ связи.</p>
              </div>
            </StepCard>

            {/* ── 02 Услуга ── */}
            <StepCard num="02" title="Тип услуги" error={!!form.formState.errors.serviceType}>
              <FormField control={form.control} name="serviceType" render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-3">
                    {SERVICE_CARDS.map(({ value, icon: Icon, label, desc, color, border, active }) => {
                      const isSelected = field.value === value;
                      return (
                        <button
                          key={value} type="button"
                          onClick={() => field.onChange(value)}
                          className={`relative group flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-200 overflow-hidden ${
                            isSelected
                              ? `${active} shadow-lg`
                              : `border-border/40 hover:border-primary/30 bg-card/30 hover:bg-card/50`
                          }`}
                        >
                          {!isSelected && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />
                          )}
                          {isSelected && (
                            <div className={`absolute inset-0 bg-gradient-to-br ${color}`} />
                          )}
                          <div className="relative">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                              isSelected ? "bg-white/10" : "bg-muted/50 group-hover:bg-white/5"
                            }`}>
                              <Icon className={`w-4.5 h-4.5 ${isSelected ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`} style={{ width: 18, height: 18 }} />
                            </div>
                          </div>
                          <div className="relative">
                            <div className={`text-sm font-bold leading-tight ${isSelected ? "text-white" : "text-foreground"}`}>{label}</div>
                            <div className={`text-xs mt-0.5 ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>{desc}</div>
                          </div>
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5">
                              <CheckCircle className="w-4 h-4 text-white/80" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </StepCard>

            {/* ── 03 Материал ── */}
            <StepCard num="03" title="Материал" error={!!form.formState.errors.material}>
              <FormField control={form.control} name="material" render={({ field }) => (
                <FormItem>
                  <div className="flex flex-wrap gap-2">
                    {MATERIAL_CHIPS.map(({ value, label, sub }) => {
                      const isSelected = field.value === value;
                      return (
                        <button
                          key={value} type="button"
                          onClick={() => field.onChange(value)}
                          className={`flex flex-col items-center px-4 py-2.5 rounded-xl border text-center transition-all duration-200 min-w-[72px] ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-105"
                              : "border-border/50 bg-card/40 hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-foreground"}`}>{label}</span>
                          <span className={`text-[10px] mt-0.5 leading-tight ${isSelected ? "text-white/70" : "text-muted-foreground"}`}>{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />
            </StepCard>

            {/* ── 04 Описание ── */}
            <StepCard num="04" title="Описание заказа" error={!!form.formState.errors.description}>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Опишите задачу: размеры, цвет, требования к прочности, условия эксплуатации, количество экземпляров..."
                      className="min-h-[130px] bg-background/60 border-border/50 rounded-xl resize-y focus:border-primary/50 text-sm leading-relaxed"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between mt-1">
                    <FormMessage />
                    <span className={`text-xs ml-auto ${field.value.length < 10 ? "text-muted-foreground/50" : "text-green-400"}`}>
                      {field.value.length} / 10+
                    </span>
                  </div>
                </FormItem>
              )} />
            </StepCard>

            {/* ── 05 Файлы ── */}
            <StepCard num="05" title="Файлы модели">
              <div className="space-y-3">
                <input
                  ref={fileInputRef} type="file" multiple className="hidden" id="file-upload"
                  onChange={(e) => addFiles(e.target.files)}
                />

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <FileItem key={`${file.name}-${idx}`} file={file} onRemove={() => removeFile(idx)} />
                    ))}
                  </div>
                )}

                {selectedFiles.length === 0 ? (
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center gap-3 w-full py-10 px-4 transition-all border-2 border-dashed rounded-2xl cursor-pointer border-border/40 hover:border-primary/50 hover:bg-primary/3 bg-card/20 group">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                      <UploadCloud className="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-semibold text-foreground/70 group-hover:text-foreground transition-colors">Нажмите или перетащите файлы</div>
                      <div className="text-xs text-muted-foreground/60 mt-1">STL, OBJ, фото, чертежи · до 150 МБ · до 10 файлов</div>
                    </div>
                    <div className="text-xs text-muted-foreground/40">Необязательно — можно описать задачу текстом</div>
                  </label>
                ) : selectedFiles.length < 10 ? (
                  <label htmlFor="file-upload"
                    className="flex items-center justify-center gap-2 w-full h-10 transition-all border border-dashed rounded-xl cursor-pointer border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-sm text-primary/60 hover:text-primary">
                    <Plus className="w-4 h-4" /> Добавить ещё файлы
                  </label>
                ) : null}
              </div>
            </StepCard>

            {/* ── 06 Доставка ── */}
            <StepCard num="06" title="Способ получения">
              <FormField control={form.control} name="deliveryType" render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-2.5">
                    {DELIVERY_OPTS.map(({ value, icon: Icon, label, desc }) => {
                      const isSelected = field.value === value;
                      return (
                        <button
                          key={value} type="button"
                          onClick={() => field.onChange(value)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                            isSelected
                              ? "border-primary bg-primary/10 shadow-sm shadow-primary/20"
                              : "border-border/40 bg-card/30 hover:border-primary/30 hover:bg-card/50"
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <FormMessage />

                  <AnimatePresence>
                    {deliveryType !== "pickup" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary" /> Адрес доставки
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <FormField control={form.control} name="deliveryCity" render={({ field }) => (
                              <FormItem>
                                <FormControl><Input placeholder="Город" {...field} className="bg-background/60 border-border/50 h-10 rounded-xl text-sm" /></FormControl>
                              </FormItem>
                            )} />
                            <FormField control={form.control} name="deliveryIndex" render={({ field }) => (
                              <FormItem>
                                <FormControl><Input placeholder="Индекс" {...field} className="bg-background/60 border-border/50 h-10 rounded-xl text-sm" /></FormControl>
                              </FormItem>
                            )} />
                          </div>
                          <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                            <FormItem>
                              <FormControl><Input placeholder="Улица, дом, квартира" {...field} className="bg-background/60 border-border/50 h-10 rounded-xl text-sm" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormItem>
              )} />
            </StepCard>

            {/* ── Submit ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 text-base font-bold rounded-2xl btn-shimmer shadow-lg shadow-primary/20"
              >
                {isSubmitting
                  ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Отправляем заказ...</>
                  : <><Sparkles className="mr-2 h-5 w-5" /> Отправить заказ <ArrowRight className="ml-2 h-5 w-5" /></>
                }
              </Button>
              <p className="text-center text-xs text-muted-foreground/50 mt-3">
                Стоимость рассчитывается после заявки · Ответим в течение нескольких часов
              </p>
            </motion.div>

          </form>
        </Form>
      </div>
    </div>
  );
}
