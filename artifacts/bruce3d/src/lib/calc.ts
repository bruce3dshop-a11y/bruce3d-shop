/**
 * Единый калькулятор стоимости 3D-печати.
 * Цены согласованы со страницей /prices:
 *   PLA / PETG → от 300 ₽, ABS → от 400 ₽, TPU → от 350 ₽, Фотополимер → от 700 ₽
 */

export interface CalcMaterial {
  id: string;
  name: string;
  pricePerGram: number;
  minPrice: number;
  density: number;
  color: string;   // Tailwind bg-class
  accent: string;  // hex для UI
}

export interface CalcQuality {
  id: string;
  name: string;
  multiplier: number;
  layerHeight: string;
  desc: string;
}

export const CALC_MATERIALS: CalcMaterial[] = [
  { id: "pla",   name: "PLA",         pricePerGram: 3.5,  minPrice: 300, density: 1.24, color: "bg-green-500",  accent: "#10b981" },
  { id: "petg",  name: "PETG",        pricePerGram: 3.5,  minPrice: 300, density: 1.27, color: "bg-blue-500",   accent: "#3b82f6" },
  { id: "abs",   name: "ABS",         pricePerGram: 4.5,  minPrice: 400, density: 1.05, color: "bg-yellow-500", accent: "#f59e0b" },
  { id: "tpu",   name: "TPU",         pricePerGram: 4.0,  minPrice: 350, density: 1.21, color: "bg-orange-500", accent: "#f97316" },
  { id: "resin", name: "Фотополимер", pricePerGram: 8.5,  minPrice: 700, density: 1.10, color: "bg-purple-500", accent: "#a855f7" },
  { id: "other", name: "Другое",      pricePerGram: 4.0,  minPrice: 300, density: 1.25, color: "bg-gray-500",   accent: "#6b7280" },
];

export const CALC_QUALITIES: CalcQuality[] = [
  { id: "draft",    name: "Черновое",  multiplier: 0.85, layerHeight: "0.3 мм", desc: "Быстро, слои заметны"  },
  { id: "standard", name: "Стандарт", multiplier: 1.00, layerHeight: "0.2 мм", desc: "Баланс скорости/качества" },
  { id: "fine",     name: "Детальное", multiplier: 1.40, layerHeight: "0.1 мм", desc: "Высокая точность"        },
];

export const CALC_INFILLS = [15, 20, 40, 60, 80, 100] as const;
export type CalcInfill = (typeof CALC_INFILLS)[number];

/** Коэффициент заполнения: % заполнения → коэффициент расхода материала */
export const FILL_FACTOR: Record<number, number> = {
  15:  0.50,
  20:  0.60,
  40:  0.75,
  60:  0.85,
  80:  0.95,
  100: 1.00,
};

export interface CalcResult {
  min: number;       // нижняя граница
  max: number;       // верхняя граница
  base: number;      // центральная оценка (отправляется на сервер)
  printTimeH: number;
}

/**
 * Рассчитать примерную стоимость 3D-печати.
 * Возвращает null, если параметры не заданы.
 */
export function calcEstimate(params: {
  weightG: number;
  materialId: string;
  infillPct: number;
  qty: number;
  qualityId?: string;
}): CalcResult | null {
  const { weightG, materialId, infillPct, qty, qualityId = "standard" } = params;
  if (!weightG || weightG <= 0 || !qty || qty <= 0) return null;

  const mat  = CALC_MATERIALS.find(m => m.id === materialId) ?? CALC_MATERIALS[0];
  const qual = CALC_QUALITIES.find(q => q.id === qualityId)  ?? CALC_QUALITIES[1];
  const fill = FILL_FACTOR[infillPct] ?? 0.75;

  const unitCost = Math.max(mat.minPrice, weightG * mat.pricePerGram * fill * qual.multiplier);
  const base     = Math.round(unitCost * qty);
  const min      = Math.round(base * 0.90);
  const max      = Math.round(base * 1.25);

  const printTimeH = Math.max(1, Math.round(
    (weightG / mat.density / 10) * qual.multiplier * (0.8 + (infillPct / 100) * 0.4)
  ));

  return { min, max, base, printTimeH };
}
