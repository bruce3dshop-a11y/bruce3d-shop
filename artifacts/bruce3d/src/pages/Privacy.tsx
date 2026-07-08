import { motion } from "framer-motion";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const sections = [
  {
    title: "1. Общие положения",
    text: `Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, хранения, использования и защиты персональных данных пользователей сайта BRUCE 3D SHOP (bruce3d.up.railway.app).
Использование сайта означает безоговорочное согласие пользователя с настоящей Политикой.`,
  },
  {
    title: "2. Какие данные мы собираем",
    text: `При регистрации и оформлении заказов мы можем собирать следующие данные:
• Имя и фамилия
• Адрес электронной почты (email)
• Номер телефона
• Telegram-контакт
• Адрес доставки (город, улица, индекс)
• Загружаемые файлы 3D-моделей и изображений
• Техническая информация (IP-адрес, тип браузера, cookies)`,
  },
  {
    title: "3. Цели обработки данных",
    text: `Мы используем ваши данные исключительно для:
• Оформления и выполнения заказов
• Расчёта стоимости и уведомления о статусе заказа
• Связи с вами по вопросам заказа
• Отправки уведомлений о готовности изделия
• Улучшения качества сервиса`,
  },
  {
    title: "4. Хранение и защита данных",
    text: `Ваши данные хранятся на защищённых серверах. Мы применяем современные меры безопасности: шифрование HTTPS, хэширование паролей (bcrypt), ограниченный доступ к базе данных.
Файлы 3D-моделей хранятся в облачном хранилище Cloudinary. Мы не продаём и не передаём ваши данные третьим лицам без вашего согласия.`,
  },
  {
    title: "5. Cookies",
    text: `Сайт использует cookies — небольшие файлы, сохраняемые в браузере для поддержания сессии входа. Вы можете отключить cookies в настройках браузера, однако это может повлиять на функционирование сайта.`,
  },
  {
    title: "6. Права пользователя",
    text: `Вы имеете право:
• Запросить доступ к своим персональным данным
• Потребовать исправления или удаления ваших данных
• Отозвать согласие на обработку данных в любой момент
Для реализации своих прав свяжитесь с нами через Telegram или email.`,
  },
  {
    title: "7. Передача данных третьим лицам",
    text: `Мы можем передавать данные только следующим сервисам в рамках технической реализации:
• Cloudinary — хранение изображений и файлов
• Telegram API — уведомления администратора
• ЮКасса — обработка платежей (при наличии)
Указанные сервисы работают под собственными политиками конфиденциальности.`,
  },
  {
    title: "8. Контактная информация",
    text: `По вопросам обработки персональных данных обращайтесь:
• Telegram: @BRUCE_3D_SHOP_BOT
• Telegram-канал магазина
Мы ответим в течение 1–2 рабочих дней.`,
  },
  {
    title: "9. Изменение Политики",
    text: `BRUCE 3D SHOP оставляет за собой право вносить изменения в настоящую Политику. Актуальная версия всегда доступна на данной странице. Дата последнего обновления: июль 2025 г.`,
  },
];

export default function Privacy() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col">

      {/* Hero */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-industrial-grid opacity-15 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-purple-800/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="container relative z-10 mx-auto px-4 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/35 bg-primary/[0.08] backdrop-blur-sm text-primary text-xs font-bold mb-6 uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Конфиденциальность
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-4xl md:text-6xl font-black font-display uppercase mb-5 leading-none text-gradient-cosmic">
            Политика<br />конфиденциальности
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
            className="text-white/40 text-sm md:text-base max-w-lg mx-auto">
            Как мы собираем, используем и защищаем ваши данные
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 pb-24">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">

          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-primary transition-colors mb-10 group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> На главную
          </Link>

          <div className="space-y-5">
            {sections.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.07] backdrop-blur-sm"
              >
                <h2 className="text-base md:text-lg font-black text-white mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xs font-black shrink-0">
                    {i + 1}
                  </span>
                  {s.title.replace(/^\d+\.\s/, "")}
                </h2>
                <p className="text-white/50 text-sm leading-relaxed whitespace-pre-line">{s.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="mt-10 p-6 rounded-3xl bg-primary/[0.06] border border-primary/15 text-center"
          >
            <p className="text-white/50 text-sm">
              Продолжая использовать сайт BRUCE 3D SHOP, вы подтверждаете своё согласие с данной политикой.
            </p>
            <Link href="/order" className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
              Оформить заказ
            </Link>
          </motion.div>
        </div>
      </section>

    </motion.div>
  );
}
