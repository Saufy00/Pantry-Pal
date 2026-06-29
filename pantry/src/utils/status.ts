export type ItemStatus = "in_stock" | "low" | "out";

const STATUS_ORDER: ItemStatus[] = ["in_stock", "low", "out"];

const STATUS_LABELS: Record<ItemStatus, string> = {
  in_stock: "In Stock",
  low: "Low",
  out: "Out",
};

const STATUS_CLASSES: Record<ItemStatus, string> = {
  in_stock:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
  low: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
  out: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800",
};

export function getStatusLabel(status: ItemStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function getStatusClasses(status: ItemStatus): string {
  return STATUS_CLASSES[status] ?? "";
}

/**
 * Cycles to the next status in order: in_stock → low → out → in_stock
 */
export function cycleStatus(current: ItemStatus): ItemStatus {
  const idx = STATUS_ORDER.indexOf(current);
  return STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
}
