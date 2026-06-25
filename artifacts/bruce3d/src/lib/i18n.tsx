import { createContext, useContext, useState, useEffect } from "react";

export type Lang = "ru" | "en";

export const translations = {
  ru: {
    nav: {
      home: "Главная", shop: "🐰 Магазин", services: "Услуги",
      prices: "Цены", gallery: "Галерея", reviews: "Отзывы",
      tracker: "Трекер", login: "Войти", logout: "Выйти",
      order: "Заказать печать", admin: "Панель администратора",
    },
    home: {
      badge: "Принимаем заказы • Москва и вся Россия",
      desc: "Изготавливаем детали, прототипы, фигурки и корпуса по фото, чертежам и образцам. Любая сложность. Срок от 24 часов. Отправляем по всей России и миру.",
      ctaOrder: "Заказать печать", ctaCalc: "Рассчитать стоимость",
      servicesTitle: "Наши услуги", advantagesTitle: "Почему выбирают нас",
      statsOrders: "выполненных заказов", statsMaterials: "видов материалов",
      statsSpeed: "часов — минимальный срок",
      reviewsTitle: "Последние отзывы", reviewsAll: "Все отзывы",
      ctaTitle: "Готовы к работе", ctaDesc: "Отправьте файл или опишите задачу — рассчитаем стоимость бесплатно",
    },
    order: {
      title: "Оформить заказ",
      subtitle: "Заполните форму, прикрепите файлы, и мы рассчитаем стоимость работы.",
      name: "Имя", contacts: "Контакты",
      contactHint: "(заполните хотя бы одно поле)",
      phone: "Телефон", email: "Email", telegram: "Telegram",
      service: "Тип услуги", servicePlaceholder: "Выберите тип услуги",
      material: "Предпочтительный материал", materialPlaceholder: "Выберите материал",
      desc: "Описание заказа",
      descPlaceholder: "Требования к прочности, цвету, постобработке...",
      descHint: "Укажите любые важные детали: масштаб, цвет пластика, условия эксплуатации.",
      delivery: "Способ получения",
      files: "Файлы модели", filesHint: "необязательно, до 10 файлов",
      filesLabel: "Нажмите или перетащите файлы",
      filesFormat: "STL, OBJ, STEP, G-code, ZIP — до 50 МБ каждый",
      addMore: "Добавить ещё файлы",
      submit: "Отправить заявку", submitting: "Отправляем...",
      successTitle: "Заказ принят!", successNum: "Ваш номер заказа:",
      successDesc: "Мы свяжемся с вами в ближайшее время для уточнения деталей и расчёта стоимости.",
      trackOrder: "Отслеживать заказ", newOrder: "Оформить ещё один заказ",
      services: { "3d-print": "3D Печать", "3d-modeling": "3D Моделирование", "3d-scanning": "3D Сканирование", repair: "Ремонт техники" },
      materials: { pla: "PLA", petg: "PETG", abs: "ABS", tpu: "TPU (Flex)", resin: "Фотополимер (Resin)", other: "Нужна консультация / Другое" },
      delivery_opts: { pickup: "Самовывоз", cdek: "СДЭК", post: "Почта России", courier: "Курьер" },
      delivery_descs: { pickup: "Адрес уточнить у продавца", cdek: "По тарифам СДЭК", post: "По тарифам Почты", courier: "Москва и МО" },
      addressCity: "Город", addressIndex: "Индекс", addressStreet: "Улица, дом, квартира",
    },
    dashboard: {
      greeting: "Привет,", totalOrders: "Всего заказов", active: "Активных",
      spent: "Потрачено", newOrder: "Новый заказ", tracker: "Трекер",
      shop: "Killer Bunny™", reviews: "Отзывы",
      activeOrders: "Активные заказы", completed: "Завершённые",
      noOrders: "Заказов пока нет",
      noOrdersDesc: "Оформите первый заказ — и он появится здесь с трекингом статуса",
      placeOrder: "Оформить заказ", details: "Детали", confirm: "Подтвердить",
      toPay: "К оплате", pay: "Оплатить",
      chat: "Чат с мастером", chatPlaceholder: "Написать сообщение...",
      noMessages: "Напишите вопрос — мастер ответит",
      logout: "Выйти",
    },
    tracker: {
      title: "Трекер заказа", subtitle: "Введите номер заказа для отслеживания",
      placeholder: "Номер заказа (напр. B3D123456)", btn: "Отследить",
    },
    footer: {
      desc: "Профессиональная 3D-печать в Москве и Московской области. Отправляем заказы по всей России и миру.",
      services: "Услуги", sections: "Разделы", contacts: "Контакты",
      rights: "Все права защищены.",
      location: "Москва и Московская область · Доставка по всей России и миру",
    },
    status: {
      new: "Новый", calculating: "Рассчитывается", accepted: "Принят",
      working: "В работе", printing: "На печати", postprocess: "Постобработка",
      ready: "Готов", shipped: "Отправлен", completed: "Завершён",
      confirmed: "Подтверждён", rejected: "Отклонён",
    },
  },
  en: {
    nav: {
      home: "Home", shop: "🐰 Shop", services: "Services",
      prices: "Prices", gallery: "Gallery", reviews: "Reviews",
      tracker: "Tracker", login: "Log In", logout: "Log Out",
      order: "Order Print", admin: "Admin Panel",
    },
    home: {
      badge: "Accepting orders • Moscow & all Russia",
      desc: "We manufacture parts, prototypes, figurines and enclosures from photos, drawings and samples. Any complexity. Turnaround from 24 hours. Shipping across Russia and worldwide.",
      ctaOrder: "Order Print", ctaCalc: "Calculate Cost",
      servicesTitle: "Our Services", advantagesTitle: "Why Choose Us",
      statsOrders: "completed orders", statsMaterials: "material types",
      statsSpeed: "hours — minimum turnaround",
      reviewsTitle: "Latest Reviews", reviewsAll: "All Reviews",
      ctaTitle: "Ready to Work", ctaDesc: "Send a file or describe your task — we'll calculate the cost for free",
    },
    order: {
      title: "Place an Order",
      subtitle: "Fill in the form, attach files, and we'll calculate the cost.",
      name: "Name", contacts: "Contacts",
      contactHint: "(fill in at least one field)",
      phone: "Phone", email: "Email", telegram: "Telegram",
      service: "Service Type", servicePlaceholder: "Choose service type",
      material: "Preferred Material", materialPlaceholder: "Choose material",
      desc: "Order Description",
      descPlaceholder: "Strength, color, post-processing requirements...",
      descHint: "Include any important details: scale, filament color, use conditions.",
      delivery: "Delivery Method",
      files: "Model Files", filesHint: "optional, up to 10 files",
      filesLabel: "Click or drag files here",
      filesFormat: "STL, OBJ, STEP, G-code, ZIP — up to 50 MB each",
      addMore: "Add more files",
      submit: "Submit Request", submitting: "Submitting...",
      successTitle: "Order Received!", successNum: "Your order number:",
      successDesc: "We'll contact you shortly to discuss details and calculate the cost.",
      trackOrder: "Track Order", newOrder: "Place Another Order",
      services: { "3d-print": "3D Printing", "3d-modeling": "3D Modeling", "3d-scanning": "3D Scanning", repair: "Equipment Repair" },
      materials: { pla: "PLA", petg: "PETG", abs: "ABS", tpu: "TPU (Flex)", resin: "Photopolymer (Resin)", other: "Need consultation / Other" },
      delivery_opts: { pickup: "Pickup", cdek: "CDEK", post: "Russian Post", courier: "Courier" },
      delivery_descs: { pickup: "Address to be clarified with seller", cdek: "CDEK rates apply", post: "Russian Post rates", courier: "Moscow & Moscow Region" },
      addressCity: "City", addressIndex: "ZIP Code", addressStreet: "Street, building, apt",
    },
    dashboard: {
      greeting: "Hello,", totalOrders: "Total Orders", active: "Active",
      spent: "Spent", newOrder: "New Order", tracker: "Tracker",
      shop: "Killer Bunny™", reviews: "Reviews",
      activeOrders: "Active Orders", completed: "Completed",
      noOrders: "No orders yet",
      noOrdersDesc: "Place your first order and it will appear here with status tracking",
      placeOrder: "Place Order", details: "Details", confirm: "Confirm",
      toPay: "To Pay", pay: "Pay",
      chat: "Chat with Master", chatPlaceholder: "Write a message...",
      noMessages: "Ask a question — the master will reply",
      logout: "Log Out",
    },
    tracker: {
      title: "Order Tracker", subtitle: "Enter your order number to track it",
      placeholder: "Order number (e.g. B3D123456)", btn: "Track",
    },
    footer: {
      desc: "Professional 3D printing in Moscow and Moscow Region. We ship orders across Russia and worldwide.",
      services: "Services", sections: "Sections", contacts: "Contacts",
      rights: "All rights reserved.",
      location: "Moscow & Moscow Region · Shipping across Russia and worldwide",
    },
    status: {
      new: "New", calculating: "Calculating", accepted: "Accepted",
      working: "In Progress", printing: "Printing", postprocess: "Post-processing",
      ready: "Ready", shipped: "Shipped", completed: "Completed",
      confirmed: "Confirmed", rejected: "Rejected",
    },
  },
} as const;

type T = typeof translations.ru;
type I18nCtx = { lang: Lang; t: T; setLang: (l: Lang) => void };

const I18nContext = createContext<I18nCtx>({ lang: "ru", t: translations.ru, setLang: () => {} });

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem("bruce3d_lang") as Lang) || "ru"; } catch { return "ru"; }
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("bruce3d_lang", l); } catch {}
  };

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang] as T, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
