import { motion } from "framer-motion";
import { Layers, Cuboid, PencilRuler, Wrench, Settings2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import worksImg from "@assets/8D788C17-9E43-4D1F-8268-E53394789804_1782231561624.png";

const services = [
  {
    title: "FDM Печать",
    description: "Классическая послойная печать пластиковой нитью. Отлично подходит для функциональных деталей, корпусов и габаритных макетов. Широкий выбор материалов.",
    icon: <Layers className="w-7 h-7" />,
    accent: "#a855f7",
    tag: "Популярно",
  },
  {
    title: "SLA / Фотополимерная",
    description: "Высокоточная печать жидкой смолой. Незаменима для миниатюр, ювелирных мастер-моделей и деталей, требующих идеальной поверхности и высокой детализации.",
    icon: <Cuboid className="w-7 h-7" />,
    accent: "#3b82f6",
    tag: "Точность",
  },
  {
    title: "3D Моделирование (CAD)",
    description: "Создание точных 3D моделей по вашим чертежам, эскизам или на основе сломанных деталей (реверс-инжиниринг). Подготовка файлов к печати.",
    icon: <PencilRuler className="w-7 h-7" />,
    accent: "#06b6d4",
    tag: "",
  },
  {
    title: "Прототипирование",
    description: "Разработка и печать рабочих прототипов для проверки собираемости, эргономики и функциональности перед запуском в серию.",
    icon: <Wrench className="w-7 h-7" />,
    accent: "#10b981",
    tag: "",
  },
  {
    title: "Мелкосерийное производство",
    description: "Печать партий от десятков до сотен штук. Выгодно, когда изготовление пресс-формы для литья нецелесообразно.",
    icon: <Settings2 className="w-7 h-7" />,
    accent: "#f472b6",
    tag: "Выгодно",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Services() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Layered backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent" />
        <div className="absolute inset-0 bg-industrial-grid opacity-30" />
        {/* Purple ambient orbs */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] rounded-full bg-purple-800/18 blur-[140px] pointer-events-none -translate-y-1/2 ambient-glow" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-violet-600/14 blur-[120px] pointer-events-none -translate-y-1/2 ambient-glow" style={{ animationDelay: "3s" }} />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/8 backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            Полный цикл производства
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-5 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", filter: "drop-shadow(0 0 24px rgba(147,51,234,0.4))" }}>
            Наши услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            От идеи и моделирования до печати и постобработки — закрываем весь цикл создания физических объектов.
          </motion.p>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

      {/* SERVICES GRID */}
      <section className="relative z-10 py-16 md:py-20">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {services.map((service, index) => (
              <motion.div key={index} variants={itemVariants}
                className="group relative flex flex-col gap-4 p-7 rounded-2xl glass-card glass-card-hover h-full overflow-hidden">
                {/* Top glow line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(circle at top right, ${service.accent}30, transparent 70%)` }} />

                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${service.accent}18`, color: service.accent, boxShadow: `0 0 20px ${service.accent}20` }}>
                    {service.icon}
                  </div>
                  {service.tag && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                      style={{ background: `${service.accent}18`, color: service.accent, border: `1px solid ${service.accent}30` }}>
                      {service.tag}
                    </span>
                  )}
                </div>

                <h3 className="font-display font-bold text-lg text-white group-hover:text-purple-200 transition-colors">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{service.description}</p>

                <div className="flex items-center gap-1.5 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-4px] group-hover:translate-x-0"
                  style={{ color: service.accent }}>
                  Подробнее <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Section divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-purple-500/15 to-transparent" />

      {/* EXAMPLES */}
      <section className="relative z-10 py-16 md:py-20">
        {/* Ambient glow behind section */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/15 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black font-display uppercase mb-3"
              style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Примеры работ
            </h2>
            <p className="text-muted-foreground">3D печать и моделирование — реальные проекты наших клиентов</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-purple-500/20 shadow-[0_0_80px_rgba(147,51,234,0.18)]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none z-10" />
            <img src={worksImg} alt="Примеры работ — 3D печать и моделирование" className="w-full object-cover" loading="lazy" decoding="async" />
          </motion.div>

          {/* CTA block */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}
            className="mt-10 relative rounded-3xl overflow-hidden glass-card p-8 md:p-10 text-center">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-40 bg-purple-700/15 blur-3xl pointer-events-none" />
            <h3 className="relative z-10 text-2xl md:text-3xl font-black font-display uppercase mb-3">Готовы к работе?</h3>
            <p className="relative z-10 text-muted-foreground mb-6 max-w-lg mx-auto">
              Пришлите вашу модель или опишите задачу — бесплатно рассчитаем стоимость и сроки прямо сегодня.
            </p>
            <Link href="/order"
              className="relative z-10 inline-flex items-center gap-2 h-12 rounded-2xl bg-primary px-8 text-sm font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all hover:bg-primary/90 hover:scale-105">
              Оформить заказ <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
