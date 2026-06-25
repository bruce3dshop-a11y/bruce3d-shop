import { motion } from "framer-motion";
import { Droplet, ThermometerSun, Shield, Wind, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import plasticImg from "@assets/88735A98-B86B-4FC7-83AD-2B348B0EBE6D_1782231561624.png";

const materials = [
  {
    name: "PLA",
    type: "FDM",
    temp: "190–220°C",
    description: "Экологичный биоразлагаемый пластик. Идеален для декора, макетов и деталей без высоких механических нагрузок.",
    pros: "Высокая детализация, экологичность, без усадки, широкая палитра.",
    cons: "Хрупкий, боится нагрева свыше 50°C.",
    icon: <Sparkles className="w-6 h-6 text-primary" />
  },
  {
    name: "PETG",
    type: "FDM",
    temp: "220–250°C",
    description: "Ударопрочный и износостойкий пластик. Отличный компромисс между прочностью ABS и простотой печати PLA.",
    pros: "Прочный, гибкий, стойкий к химикатам, устойчив к влаге.",
    cons: "Склонен к образованию нитей при печати.",
    icon: <Shield className="w-6 h-6 text-primary" />
  },
  {
    name: "ABS",
    type: "FDM",
    temp: "230–260°C",
    description: "Промышленный стандарт. Очень прочный пластик для функциональных деталей, шестеренок, корпусов.",
    pros: "Высокая прочность, ударопрочность, термостойкость до 90-100°C.",
    cons: "Усадка при печати, запах.",
    icon: <ThermometerSun className="w-6 h-6 text-primary" />
  },
  {
    name: "TPU (Flex)",
    type: "FDM",
    temp: "210–240°C",
    description: "Гибкий и эластичный материал, напоминающий резину. Для прокладок, демпферов, чехлов.",
    pros: "Отличная гибкость, износостойкость, устойчивость к маслам.",
    cons: "Сложность печати, не поддается постобработке.",
    icon: <Wind className="w-6 h-6 text-primary" />
  },
  {
    name: "Фотополимер (Resin)",
    type: "SLA",
    temp: "УФ-отверждение",
    description: "Жидкая смола, отверждаемая ультрафиолетом. Обеспечивает беспрецедентную точность и гладкость поверхности.",
    pros: "Идеальная детализация (до 20-50 микрон), гладкая поверхность.",
    cons: "Хрупкость стандартных смол, требует промывки и засветки.",
    icon: <Droplet className="w-6 h-6 text-primary" />
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

export default function Materials() {
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
          Наши <span className="text-primary">Материалы</span>
        </motion.h1>
        <motion.p
          variants={itemVariants}
          className="text-lg text-muted-foreground"
        >
          Только качественные филаменты и смолы от проверенных производителей для наилучшего результата.
        </motion.p>
      </div>

      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20"
      >
        {materials.map((material, index) => (
          <motion.div key={index} variants={itemVariants}>
            <Card className="h-full bg-card/40 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  {material.icon}
                </div>
                <div>
                  <CardTitle className="font-display text-2xl">{material.name}</CardTitle>
                  <CardDescription className="text-primary font-medium mt-0.5">
                    {material.type} · {material.temp}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-foreground text-sm leading-relaxed">{material.description}</p>
                <div className="space-y-1.5 text-sm">
                  <p className="flex gap-2">
                    <span className="font-bold text-green-500 flex-shrink-0">+</span>
                    <span className="text-muted-foreground">{material.pros}</span>
                  </p>
                  <p className="flex gap-2">
                    <span className="font-bold text-red-500 flex-shrink-0">−</span>
                    <span className="text-muted-foreground">{material.cons}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-black font-display uppercase mb-2">
            Выбор пластика <span className="text-primary">для 3D печати</span>
          </h2>
          <p className="text-muted-foreground">Подберите оптимальный материал для ваших задач</p>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-primary/25 shadow-[0_0_60px_rgba(147,51,234,0.12)]">
          <img
            src={plasticImg}
            alt="Выбор пластика для 3D печати"
            className="w-full object-cover"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
