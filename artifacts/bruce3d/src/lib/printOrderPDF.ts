const SERVICE_LABELS: Record<string, string> = {
  "3d-print": "3D Печать", "3d-modeling": "3D Моделирование",
  "3d-scanning": "3D Сканирование", repair: "Ремонт техники",
};
const STATUS_LABELS: Record<string, string> = {
  new: "Новый", calculating: "Рассчитывается", accepted: "Принят",
  working: "В работе", printing: "На печати", postprocess: "Постобработка",
  ready: "Готов", shipped: "Отправлен", completed: "Завершён",
  confirmed: "Подтверждён", rejected: "Отклонён",
};
const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Самовывоз", cdek: "СДЭК", post: "Почта России", courier: "Курьер",
};

interface OrderPDFData {
  order: {
    order_number: string; name: string; email?: string | null;
    phone?: string | null; telegram?: string | null;
    status: string; service_type: string; material: string;
    delivery_type: string; description: string;
    price?: number | null; created_at: string;
  };
  history: { status: string; comment?: string | null; created_at: string }[];
}

function statusClass(status: string) {
  if (["completed", "confirmed"].includes(status)) return "status-done";
  if (status === "rejected") return "status-rejected";
  return "status-active";
}

export function printOrderPDF(data: OrderPDFData) {
  const { order, history } = data;
  const date = new Date(order.created_at).toLocaleDateString("ru", { day: "numeric", month: "long", year: "numeric" });
  const now = new Date().toLocaleString("ru");

  const rows = [
    ["Услуга", SERVICE_LABELS[order.service_type] || order.service_type],
    ["Материал", order.material.toUpperCase()],
    ["Доставка", DELIVERY_LABELS[order.delivery_type] || order.delivery_type],
    ["Дата создания", new Date(order.created_at).toLocaleString("ru")],
    ...(order.email ? [["Email", order.email]] : []),
    ...(order.phone ? [["Телефон", order.phone]] : []),
    ...(order.telegram ? [["Telegram", order.telegram]] : []),
  ] as [string, string][];

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Заказ #${order.order_number} — BRUCE 3D SHOP</title>
  <style>
    @page { margin: 14mm 16mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #12001f; background: #fff; font-size: 13px; line-height: 1.5; }

    .header { background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 60%, #a855f7 100%); color: white; padding: 22px 24px 18px; border-radius: 14px; margin-bottom: 22px; position: relative; overflow: hidden; }
    .header::after { content: ''; position: absolute; right: -30px; top: -30px; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.06); }
    .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .brand { font-size: 20px; font-weight: 900; letter-spacing: -0.3px; }
    .brand span { opacity: 0.75; font-weight: 400; font-size: 12px; display: block; margin-top: 2px; }
    .header-right { text-align: right; }
    .order-label { font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
    .order-num { font-size: 18px; font-weight: 900; }
    .order-date { font-size: 11px; opacity: 0.65; margin-top: 2px; }
    .receipt-title { font-size: 13px; font-weight: 600; margin-top: 10px; opacity: 0.85; letter-spacing: 0.5px; }

    .status { display: inline-flex; align-items: center; gap: 5px; padding: 4px 13px; border-radius: 99px; font-size: 11px; font-weight: 700; margin-bottom: 18px; }
    .status::before { content: ''; display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: 0.7; }
    .status-active { background: #7c3aed; color: white; }
    .status-done { background: #16a34a; color: white; }
    .status-rejected { background: #dc2626; color: white; }

    .section { margin-bottom: 18px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #7c3aed; padding-bottom: 5px; border-bottom: 1.5px solid #ede9fe; margin-bottom: 10px; }

    .row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px solid #f5f3ff; gap: 16px; }
    .row .lbl { color: #6b7280; white-space: nowrap; }
    .row .val { font-weight: 600; color: #1a0030; text-align: right; }

    .desc-box { background: #faf5ff; border: 1px solid #ede9fe; border-radius: 8px; padding: 12px 14px; font-size: 12.5px; line-height: 1.65; color: #374151; margin-top: 6px; white-space: pre-wrap; }

    .price-box { display: flex; justify-content: space-between; align-items: center; background: linear-gradient(135deg, #faf5ff, #f3e8ff); border: 2px solid #a855f7; border-radius: 12px; padding: 14px 18px; margin: 18px 0; }
    .price-label { font-size: 12px; color: #6b21a8; font-weight: 600; }
    .price-amount { font-size: 26px; font-weight: 900; color: #4c1d95; letter-spacing: -0.5px; }
    .price-note { font-size: 10px; color: #9ca3af; margin-top: 2px; }

    .timeline { }
    .tl-item { display: flex; gap: 10px; padding: 6px 0; }
    .tl-dot-wrap { display: flex; flex-direction: column; align-items: center; padding-top: 4px; width: 14px; flex-shrink: 0; }
    .tl-dot { width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; flex-shrink: 0; }
    .tl-line { width: 1px; flex: 1; background: #ede9fe; margin-top: 4px; }
    .tl-status { font-weight: 600; color: #12001f; font-size: 12.5px; }
    .tl-meta { font-size: 11px; color: #9ca3af; margin-top: 1px; }
    .tl-comment { font-size: 11px; color: #6b7280; font-style: italic; }

    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #ede9fe; display: flex; justify-content: space-between; align-items: center; }
    .footer-brand { font-size: 12px; font-weight: 700; color: #7c3aed; }
    .footer-brand span { font-weight: 400; color: #9ca3af; font-size: 10px; display: block; }
    .footer-meta { font-size: 10px; color: #9ca3af; text-align: right; }

    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-top">
      <div class="brand">BRUCE 3D SHOP <span>Killer Bunny™ • Профессиональная 3D-печать</span></div>
      <div class="header-right">
        <div class="order-label">Номер заказа</div>
        <div class="order-num">#${order.order_number}</div>
        <div class="order-date">${date}</div>
      </div>
    </div>
    <div class="receipt-title">КВИТАНЦИЯ ЗАКАЗА</div>
  </div>

  <div class="status ${statusClass(order.status)}">${STATUS_LABELS[order.status] || order.status}</div>

  <div class="section">
    <div class="section-title">Клиент</div>
    <div class="row"><span class="lbl">Имя</span><span class="val">${order.name}</span></div>
    ${rows.filter(r => ["Email","Телефон","Telegram"].includes(r[0])).map(([l,v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
  </div>

  <div class="section">
    <div class="section-title">Детали заказа</div>
    ${rows.filter(r => !["Email","Телефон","Telegram"].includes(r[0])).map(([l,v]) => `<div class="row"><span class="lbl">${l}</span><span class="val">${v}</span></div>`).join("")}
    <div style="margin-top:10px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:5px;">Описание</div>
      <div class="desc-box">${order.description}</div>
    </div>
  </div>

  ${order.price ? `
  <div class="price-box">
    <div>
      <div class="price-label">Стоимость работы</div>
      <div class="price-note">НДС не облагается</div>
    </div>
    <div class="price-amount">${Number(order.price).toLocaleString("ru")} ₽</div>
  </div>` : ""}

  ${history.length > 0 ? `
  <div class="section">
    <div class="section-title">История статусов</div>
    <div class="timeline">
      ${history.map((e, i) => `
      <div class="tl-item">
        <div class="tl-dot-wrap">
          <div class="tl-dot"></div>
          ${i < history.length - 1 ? '<div class="tl-line"></div>' : ""}
        </div>
        <div style="padding-bottom:6px;">
          <div class="tl-status">${STATUS_LABELS[e.status] || e.status}</div>
          <div class="tl-meta">${new Date(e.created_at).toLocaleString("ru")}</div>
          ${e.comment ? `<div class="tl-comment">${e.comment}</div>` : ""}
        </div>
      </div>`).join("")}
    </div>
  </div>` : ""}

  <div class="footer">
    <div class="footer-brand">BRUCE 3D SHOP <span>Москва и вся Россия</span></div>
    <div class="footer-meta">Документ сформирован<br>${now}</div>
  </div>

  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return win;
}
