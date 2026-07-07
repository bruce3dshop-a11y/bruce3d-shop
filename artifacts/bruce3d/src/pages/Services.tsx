import { motion } from "framer-motion";
import { Layers, Cuboid, PencilRuler, Wrench, Settings2 } from "lucide-react";
import worksImg from "@assets/8D788C17-9E43-4D1F-8268-E53394789804_1782231561624.png";

const services = [
  {
    title: "FDM Печать",
    description: "Классическая послойная печать пластиковой нитью. Отлично подходит для функциональных деталей, корпусов и габаритных макетов. Широкий выбор материалов.",
    icon: <Layers className="w-7 h-7" />,
    accent: "#a855f7",
  },
  {
    title: "SLA / Фотополимерная печать",
    description: "Высокоточная печать жидкой смолой. Незаменима для миниатюр, ювелирных мастер-моделей и деталей, требующих идеальной поверхности и высокой детализации.",
    icon: <Cuboid className="w-7 h-7" />,
    accent: "#3b82f6",
  },
  {
    title: "3D Моделирование (CAD)",
    description: "Создание точных 3D моделей по вашим чертежам, эскизам или на основе сломанных деталей (реверс-инжиниринг). Подготовка файлов к печати.",
    icon: <PencilRuler className="w-7 h-7" />,
    accent: "#06b6d4",
  },
  {
    title: "Прототипирование",
    description: "Разработка и печать рабочих прототипов для проверки собираемости, эргономики и функциональности перед запуском в серию.",
    icon: <Wrench className="w-7 h-7" />,
    accent: "#10b981",
  },
  {
    title: "Мелкосерийное производство",
    description: "Печать партий от десятков до сотен штук. Выгодно, когда изготовление пресс-формы для литья нецелесообразно.",
    icon: <Settings2 className="w-7 h-7" />,
    accent: "#f472b6",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Services() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* HERO */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#03000a]/55 via-[#03000a]/40 to-[#03000a]/60" />
        <div className="absolute inset-0 bg-industrial-grid opacity-40" />
        <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-purple-800/25 blur-[120px] pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full bg-violet-600/20 blur-[100px] pointer-events-none -translate-y-1/2" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            Полный цикл производства
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-display uppercase mb-4 leading-none"
            style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            Наши услуги
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto">
            От идеи и моделирования до печати и постобработки — закрываем весь цикл создания физических объектов.
          </motion.p>
        </div>
      </section>

      {/* SERVICES GRID */}
      <section className="relative z-10 py-16 md:py-20 bg-transparent">
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
                className="group relative flex flex-col gap-4 p-7 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/35 transition-all duration-300 h-full overflow-hidden">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300"
                  style={{ background: `${service.accent}20`, color: service.accent }}>
                  {service.icon}
                </div>
                <h3 className="font-display font-bold text-lg text-white">{service.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* EXAMPLES */}
      <section className="relative z-10 py-16 md:py-20 bg-black/25">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black font-display uppercase mb-3"
              style={{ background: "linear-gradient(135deg,#fff 0%,#c084fc 70%,#9333ea 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Примеры работ
            </h2>
            <p className="text-muted-foreground">3D печать и моделирование — реальные проекты наших клиентов</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.15)]">
            <img src={worksImg} alt="Примеры работ — 3D печать и моделирование" className="w-full object-cover" loading="lazy" decoding="async" />
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
