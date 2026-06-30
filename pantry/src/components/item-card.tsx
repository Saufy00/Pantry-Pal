import React from "react";
import { Link } from "wouter";
import { Item } from "@workspace/api-client-react";
import {
  useUpdateItemStatus,
  useAdjustItemQuantity,
  getListItemsQueryKey,
  getGetNeedsRestockQueryKey,
  getGetItemsSummaryQueryKey,
  getListCategoriesQueryKey,
  getGetItemQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Minus, MapPin, Calendar, Clock } from "lucide-react";
import { differenceInDays, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import { cycleStatus, getStatusClasses, getStatusLabel, type ItemStatus } from "@/utils/status";

interface ItemCardProps {
  item: Item;
  hideCategory?: boolean;
}

function invalidateItemQueries(qc: ReturnType<typeof useQueryClient>, id?: number) {
  qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetNeedsRestockQueryKey() });
  qc.invalidateQueries({ queryKey: getGetItemsSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  if (id) qc.invalidateQueries({ queryKey: getGetItemQueryKey(id) });
}

export function ItemCard({ item, hideCategory }: ItemCardProps) {
  const queryClient = useQueryClient();
  const updateStatus = useUpdateItemStatus();
  const adjustQty = useAdjustItemQuantity();

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextStatus = cycleStatus(item.status as ItemStatus);
    updateStatus.mutate(
      { id: item.id, data: { status: nextStatus } },
      {
        onSuccess: () => {
          invalidateItemQueries(queryClient, item.id);
          toast.success(`${item.name} → ${getStatusLabel(nextStatus)}`);
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleQty = (e: React.MouseEvent, delta: number) => {
    e.preventDefault();
    adjustQty.mutate(
      { id: item.id, data: { delta } },
      {
        onSuccess: () => invalidateItemQueries(queryClient, item.id),
        onError: () => toast.error("Failed to update quantity"),
      }
    );
  };

  const currentQty = parseFloat(item.quantity ?? "0") || 0;

  return (
    <Link href={`/items/${item.id}`} className="block group">
      <div className="bg-card border border-card-border rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-primary/20 flex flex-col gap-3 h-full">

        {/* Name + status badge */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <h3 className="font-medium text-foreground text-base leading-tight group-hover:text-primary transition-colors truncate">
              {item.name}
            </h3>
            {(() => {
              const badges = [];
              if (item.minThreshold !== undefined && item.minThreshold !== null && currentQty <= item.minThreshold) {
                badges.push(<span key="low" className="w-fit text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md flex items-center gap-1">Low Stock</span>);
              }
              if (item.expirationDate) {
                const expDate = startOfDay(new Date(item.expirationDate));
                const now = startOfDay(new Date());
                if (isBefore(expDate, now)) {
                  badges.push(<span key="exp" className="w-fit text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Clock className="w-3 h-3" /> Expired</span>);
                } else {
                  const days = differenceInDays(expDate, now);
                  if (days <= 14) {
                    badges.push(<span key="exp-soon" className="w-fit text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Clock className="w-3 h-3" /> {days}d left</span>);
                  }
                }
              }
              return badges.length > 0 ? <div className="flex flex-wrap gap-1 mt-1">{badges}</div> : null;
            })()}
          </div>
          <button
            onClick={handleStatusCycle}
            className={`shrink-0 px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all hover:scale-105 active:scale-95 border ${getStatusClasses(item.status as ItemStatus)}`}
          >
            {getStatusLabel(item.status as ItemStatus)}
          </button>
        </div>

        {/* Quantity +/- controls */}
        <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
          <button
            onClick={(e) => handleQty(e, -1)}
            disabled={adjustQty.isPending || currentQty <= 0}
            className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="flex-1 text-center">
            <span className="text-base font-semibold text-foreground tabular-nums">
              {item.quantity ?? "—"}
            </span>
            {item.unit && (
              <span className="text-xs text-muted-foreground ml-1">{item.unit}</span>
            )}
          </div>

          <button
            onClick={(e) => handleQty(e, 1)}
            disabled={adjustQty.isPending}
            className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary active:scale-90 transition-all disabled:opacity-30"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category + location footer */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {!hideCategory && (
            <span className="text-[11px] font-medium text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md truncate">
              {item.category}
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 ml-auto shrink-0">
            <MapPin className="w-3 h-3" />
            {item.location}
          </span>
        </div>

      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  actionText,
  actionHref,
}: {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-card/50 rounded-2xl border border-dashed border-border/60">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 text-muted-foreground">
        <Package className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-serif font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[250px] mb-6">{description}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center justify-center gap-2 text-sm font-medium bg-primary text-primary-foreground px-5 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> {actionText}
        </Link>
      )}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 flex flex-col gap-3 h-[140px] animate-pulse">
      <div className="flex justify-between items-start">
        <div className="h-5 bg-muted rounded-md w-32" />
        <div className="h-6 bg-muted rounded-full w-20" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-muted rounded-lg" />
        <div className="flex-1 h-5 bg-muted rounded-md mx-2" />
        <div className="w-8 h-8 bg-muted rounded-lg" />
      </div>
      <div className="mt-auto flex gap-2">
        <div className="h-4 bg-muted rounded-md w-16" />
        <div className="h-4 bg-muted rounded-md w-14 ml-auto" />
      </div>
    </div>
  );
}
