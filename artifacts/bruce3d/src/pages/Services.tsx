import { motion } from "framer-motion";
import { Layers, Cuboid, PencilRuler, Wrench, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import worksImg from "@assets/8D788C17-9E43-4D1F-8268-E53394789804_1782231561624.png";

const services = [
  {
    title: "FDM Печать",
    description: "Классическая послойная печать пластиковой нитью. Отлично подходит для функциональных деталей, корпусов и габаритных макетов. Широкий выбор материалов.",
    icon: <Layers className="w-8 h-8 text-primary" />,
  },
  {
    title: "SLA / Фотополимерная печать",
    description: "Высокоточная печать жидкой смолой. Незаменима для миниатюр, ювелирных мастер-моделей и деталей, требующих идеальной поверхности и высокой детализации.",
    icon: <Cuboid className="w-8 h-8 text-primary" />,
  },
  {
    title: "3D Моделирование (CAD)",
    description: "Создание точных 3D моделей по вашим чертежам, эскизам или на основе сломанных деталей (реверс-инжиниринг). Подготовка файлов к печати.",
    icon: <PencilRuler className="w-8 h-8 text-primary" />,
  },
  {
    title: "Прототипирование",
    description: "Разработка и печать рабочих прототипов для проверки собираемости, эргономики и функциональности перед запуском в серию.",
    icon: <Wrench className="w-8 h-8 text-primary" />,
  },
  {
    title: "Мелкосерийное производство",
    description: "Печать партий от десятков до сотен штук. Выгодно, когда изготовление пресс-формы для литья нецелесообразно.",
    icon: <Settings2 className="w-8 h-8 text-primary" />,
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Services() {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      className="container mx-auto px-4 py-16 md:py-24"
    >
      <div className="max-w-3xl mb-16">
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold font-display mb-6"
        >
          Наши <span className="text-primary">Услуги</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground"
        >
          Полный цикл создания физических объектов: от идеи и моделирования до печати и постобработки.
        </motion.p>
      </div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
      >
        {services.map((service, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="h-full bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">{service.icon}</div>
                <CardTitle className="font-display text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground">
                  {service.description}
                </CardDescription>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2">
            Примеры <span className="text-primary">Работ</span>
          </h2>
          <p className="text-muted-foreground">3D печать и моделирование — реальные проекты наших клиентов</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.12)]">
          <img
            src={worksImg}
            alt="Примеры работ — 3D печать и моделирование"
            className="w-full object-cover"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
