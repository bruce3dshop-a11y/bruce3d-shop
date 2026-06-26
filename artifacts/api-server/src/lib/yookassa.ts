import { randomUUID } from "crypto";

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const BASE_URL = "https://api.yookassa.ru/v3";

export function isYookassaConfigured(): boolean {
  return !!(SHOP_ID && SECRET_KEY);
}

function authHeader(): string {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");
}

export interface YookassaPayment {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  description?: string;
  metadata?: Record<string, string>;
}

export async function createPayment(params: {
  amount: number;
  orderId: number;
  orderNumber: string;
  description: string;
  returnUrl: string;
}): Promise<YookassaPayment> {
  if (!isYookassaConfigured()) {
    throw new Error("ЮКасса не настроена.");
  }

  const body = {
    amount: { value: params.amount.toFixed(2), currency: "RUB" },
    confirmation: { type: "redirect", return_url: params.returnUrl },
    capture: true,
    description: params.description,
    metadata: {
      order_id: String(params.orderId),
      order_number: params.orderNumber,
    },
  };

  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader(),
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.description || `ЮКасса ошибка: ${res.status}`);
  return data as YookassaPayment;
}

export async function getPayment(paymentId: string): Promise<YookassaPayment> {
  if (!isYookassaConfigured()) throw new Error("ЮКасса не настроена.");

  const res = await fetch(`${BASE_URL}/payments/${paymentId}`, {
    headers: { "Authorization": authHeader() },
  });

  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.description || `ЮКасса ошибка: ${res.status}`);
  return data as YookassaPayment;
}
