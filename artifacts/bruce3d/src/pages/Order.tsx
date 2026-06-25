import { useState, useRef } from "react";
import instructionImg from "@assets/EB79A94D-7992-4876-A4DE-0D6B8ED40700_1782231561624.png";
import { motion, AnimatePresence } from "framer-motion";
import ModelViewer from "@/components/ModelViewer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { UploadCloud, Loader2, X, FileText, CheckCircle, ArrowRight, MapPin, Truck, Package, Home as HomeIcon, Bike, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
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

function getExt(name: string) {
  return name.split(".").pop()?.toLowerCase() || "";
}

function FileItem({ file, onRemove }: { file: File; onRemove: () => void }) {
  const ext = getExt(file.name);
  const isModel = MODEL_EXTS.has(ext);
  const [showPreview, setShowPreview] = useState(false);
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <FileText className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
        <span className="text-xs text-muted-foreground flex-shrink-0 pr-1">
          {(file.size / 1024).toFixed(0)} КБ
        </span>
        {isModel && (
          <button type="button" onClick={() => setShowPreview(v => !v)}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors flex-shrink-0 mr-1">
            {showPreview ? "Скрыть" : "3D"}
          </button>
        )}
        <button type="button" onClick={onRemove}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "", phone: user?.phone || "", email: user?.email || "", telegram: user?.telegram || "",
      serviceType: "", material: "", description: "",
      deliveryType: "pickup", deliveryCity: "", deliveryAddress: "", deliveryIndex: "",
    },
  });

  useState(() => {
    if (user) {
      form.setValue("name", user.name || "");
      form.setValue("email", user.email || "");
      if (user.phone) form.setValue("phone", user.phone);
      if (user.telegram) form.setValue("telegram", user.telegram);
    }
  });

  const deliveryType = form.watch("deliveryType");
  const needsAddress = deliveryType !== "pickup";

  const deliveryOptions = [
    { value: "pickup", label: t.order.delivery_opts.pickup, icon: <HomeIcon className="w-4 h-4" />, desc: t.order.delivery_descs.pickup },
    { value: "cdek", label: t.order.delivery_opts.cdek, icon: <Package className="w-4 h-4" />, desc: t.order.delivery_descs.cdek },
    { value: "post", label: t.order.delivery_opts.post, icon: <Truck className="w-4 h-4" />, desc: t.order.delivery_descs.post },
    { value: "courier", label: t.order.delivery_opts.courier, icon: <Bike className="w-4 h-4" />, desc: t.order.delivery_descs.courier },
  ];

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
      selectedFiles.forEach(file => fd.append("files", file));

      const res = await fetch(`${import.meta.env.BASE_URL}api/order`, {
        method: "POST", body: fd, credentials: "include",
      });
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
      <div className="container mx-auto px-4 py-24 max-w-lg text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-black font-display mb-2">
            {t.order.successTitle.split("!")[0]} <span className="text-primary">принят!</span>
          </h2>
          <p className="text-muted-foreground mb-2">{t.order.successNum}</p>
          <div className="text-2xl font-black text-primary mb-4">#{success.orderNumber}</div>
          <p className="text-muted-foreground mb-8">{t.order.successDesc}</p>
          <div className="flex flex-col gap-3">
            {success.orderId && (
              <Link href={`/order/${success.orderId}`}>
                <Button className="w-full rounded-full">
                  {t.order.trackOrder} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button variant="outline" className="w-full rounded-full" onClick={() => setSuccess(null)}>
              {t.order.newOrder}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            {t.order.title.split(" ").slice(0, -1).join(" ")} <span className="text-primary">{t.order.title.split(" ").slice(-1)}</span>
          </h1>
          <p className="text-lg text-muted-foreground">{t.order.subtitle}</p>
        </div>

        <div className="mb-10 rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_40px_rgba(147,51,234,0.08)]">
          <img src={instructionImg} alt="Как заполнить форму заказа" className="w-full" />
        </div>

        <Card className="bg-card/40 backdrop-blur-sm border-border/50">
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.order.name} <span className="text-primary">*</span></FormLabel>
                    <FormControl><Input placeholder="Иван Иванов" {...field} className="bg-background/50" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {t.order.contacts} <span className="text-primary">*</span>
                    <span className="text-muted-foreground font-normal ml-1">{t.order.contactHint}</span>
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">{t.order.phone}</FormLabel>
                        <FormControl><Input placeholder="+7 999 000 00 00" {...field} className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">{t.order.email}</FormLabel>
                        <FormControl><Input placeholder="mail@example.ru" {...field} className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="telegram" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground text-xs">{t.order.telegram}</FormLabel>
                        <FormControl><Input placeholder="@username" {...field} className="bg-background/50" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </div>

                <FormField control={form.control} name="serviceType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.order.service} <span className="text-primary">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder={t.order.servicePlaceholder} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(t.order.services).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="material" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.order.material} <span className="text-primary">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background/50"><SelectValue placeholder={t.order.materialPlaceholder} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(t.order.materials).map(([val, label]) => (
                          <SelectItem key={val} value={val}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.order.desc} <span className="text-primary">*</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder={t.order.descPlaceholder} className="min-h-[120px] bg-background/50 resize-y" {...field} />
                    </FormControl>
                    <FormDescription>{t.order.descHint}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" /> {t.order.delivery}
                  </p>
                  <FormField control={form.control} name="deliveryType" render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-2 gap-2">
                        {deliveryOptions.map(opt => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                              field.value === opt.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/50 hover:border-primary/30 hover:bg-primary/5"
                            }`}
                          >
                            <div className={`shrink-0 ${field.value === opt.value ? "text-primary" : "text-muted-foreground"}`}>
                              {opt.icon}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{opt.label}</div>
                              <div className="text-xs text-muted-foreground">{opt.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <AnimatePresence>
                    {needsAddress && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>Адрес доставки</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="deliveryCity" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">{t.order.addressCity}</FormLabel>
                              <FormControl><Input placeholder="Ваш город" {...field} className="bg-background/50" /></FormControl>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="deliveryIndex" render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground">{t.order.addressIndex}</FormLabel>
                              <FormControl><Input placeholder="123456" {...field} className="bg-background/50" /></FormControl>
                            </FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="deliveryAddress" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">{t.order.addressStreet}</FormLabel>
                            <FormControl><Input placeholder="ул. Ленина, д. 1, кв. 5" {...field} className="bg-background/50" /></FormControl>
                          </FormItem>
                        )} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── Multi-file upload ─── */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    {t.order.files}
                    <span className="text-muted-foreground font-normal text-xs">{t.order.filesHint}</span>
                  </p>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-1.5">
                      {selectedFiles.map((file, idx) => (
                        <FileItem key={`${file.name}-${idx}`} file={file} onRemove={() => removeFile(idx)} />
                      ))}
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => addFiles(e.target.files)}
                  />

                  {selectedFiles.length === 0 ? (
                    <label htmlFor="file-upload"
                      className="flex flex-col items-center justify-center w-full h-32 px-4 transition-colors border-2 border-dashed rounded-md cursor-pointer border-border/50 hover:border-primary/50 hover:bg-accent/10 bg-background/30">
                      <span className="flex items-center space-x-2">
                        <UploadCloud className="w-6 h-6 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">{t.order.filesLabel}</span>
                      </span>
                      <span className="mt-1 text-xs text-muted-foreground">{t.order.filesFormat}</span>
                    </label>
                  ) : selectedFiles.length < 10 ? (
                    <label htmlFor="file-upload"
                      className="flex items-center justify-center gap-2 w-full h-10 transition-colors border border-dashed rounded-xl cursor-pointer border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-sm text-primary/60 hover:text-primary">
                      <Plus className="w-4 h-4" /> {t.order.addMore}
                    </label>
                  ) : null}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-medium">
                  {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{t.order.submitting}</> : t.order.submit}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
