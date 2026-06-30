import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetItem,
  useUpdateItem,
  useDeleteItem,
  useUpdateItemStatus,
  useAdjustItemQuantity,
  getListItemsQueryKey,
  getGetItemsSummaryQueryKey,
  getGetNeedsRestockQueryKey,
  getListCategoriesQueryKey,
  getListLocationsQueryKey,
  getGetItemQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  ArrowLeft,
  Plus,
  Minus,
  Pencil,
  Trash2,
  MapPin,
  Clock,
} from "lucide-react";
import {
  cycleStatus,
  getStatusClasses,
  getStatusLabel,
  type ItemStatus,
} from "@/utils/status";
import { formatDistanceToNow, addDays, addMonths, format, startOfDay, isBefore, differenceInDays } from "date-fns";

function invalidateAll(
  qc: ReturnType<typeof useQueryClient>,
  id: number
) {
  qc.invalidateQueries({ queryKey: getListItemsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetItemsSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetNeedsRestockQueryKey() });
  qc.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  qc.invalidateQueries({ queryKey: getListLocationsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetItemQueryKey(id) });
}

export default function ItemDetail() {
  const [, params] = useRoute("/items/:id");
  const itemId = Number(params?.id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const item = useGetItem(itemId);
  const updateItem = useUpdateItem();
  const deleteItem = useDeleteItem();
  const updateStatus = useUpdateItemStatus();
  const adjustQty = useAdjustItemQuantity();

  const [editOpen, setEditOpen] = useState(false);

  // Edit form state — initialized when dialog opens
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState<ItemStatus>("in_stock");
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editExpirationDate, setEditExpirationDate] = useState<Date | null>(null);

  const openEditDialog = () => {
    if (item.data) {
      setEditName(item.data.name);
      setEditCategory(item.data.category);
      setEditLocation(item.data.location ?? "");
      setEditStatus(item.data.status as ItemStatus);
      setEditQuantity(item.data.quantity ?? "");
      setEditUnit(item.data.unit ?? "");
      setEditNotes(item.data.notes ?? "");
      setEditExpirationDate(item.data.expirationDate ? new Date(item.data.expirationDate) : null);
    }
    setEditOpen(true);
  };

  const handleStatusCycle = () => {
    if (!item.data) return;
    const next = cycleStatus(item.data.status as ItemStatus);
    updateStatus.mutate(
      { id: itemId, data: { status: next } },
      {
        onSuccess: () => {
          invalidateAll(queryClient, itemId);
          toast.success(`Status → ${getStatusLabel(next)}`);
        },
        onError: () => toast.error("Failed to update status"),
      }
    );
  };

  const handleQty = (delta: number) => {
    adjustQty.mutate(
      { id: itemId, data: { delta } },
      {
        onSuccess: () => invalidateAll(queryClient, itemId),
        onError: () => toast.error("Failed to adjust quantity"),
      }
    );
  };

  const handleDelete = () => {
    deleteItem.mutate(
      { id: itemId },
      {
        onSuccess: () => {
          toast.success(`"${item.data?.name}" deleted.`);
          queryClient.invalidateQueries({
            queryKey: getListItemsQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetItemsSummaryQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getGetNeedsRestockQueryKey(),
          });
          queryClient.invalidateQueries({
            queryKey: getListCategoriesQueryKey(),
          });
          navigate("/items");
        },
        onError: () => toast.error("Failed to delete item"),
      }
    );
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editCategory.trim()) {
      toast.error("Name and category are required.");
      return;
    }

    updateItem.mutate(
      {
        id: itemId,
        data: {
          name: editName.trim(),
          category: editCategory.trim(),
          location: editLocation.trim() || undefined,
          status: editStatus,
          quantity: editQuantity.trim() || undefined,
          unit: editUnit.trim() || undefined,
          notes: editNotes.trim() || undefined,
          expirationDate: editExpirationDate ? editExpirationDate.toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
          invalidateAll(queryClient, itemId);
          toast.success("Item updated!");
          setEditOpen(false);
        },
        onError: () => toast.error("Failed to update item"),
      }
    );
  };

  // Loading state
  if (item.isLoading) {
    return (
      <Layout>
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pantry
        </Link>
        <div className="max-w-lg space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3 mt-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        </div>
      </Layout>
    );
  }

  // Error / not found
  if (item.isError || !item.data) {
    return (
      <Layout>
        <Link
          href="/items"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pantry
        </Link>
        <div className="text-center py-16">
          <h2 className="text-lg font-serif font-medium text-foreground mb-2">
            Item not found
          </h2>
          <p className="text-sm text-muted-foreground">
            This item may have been deleted or doesn't exist.
          </p>
        </div>
      </Layout>
    );
  }

  const data = item.data;
  const currentQty = parseFloat(data.quantity ?? "0") || 0;

  return (
    <Layout>
      {/* Back */}
      <Link
        href="/items"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pantry
      </Link>

      <div className="max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight truncate">
              {data.name}
            </h1>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
              <span className="bg-secondary/50 px-2 py-0.5 rounded-md text-xs font-medium">
                {data.category}
              </span>
              {data.location && (
                <span className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  {data.location}
                </span>
              )}
            </div>
          </div>

          {/* Status badge (clickable to cycle) */}
          <button
            onClick={handleStatusCycle}
            disabled={updateStatus.isPending}
            className={`shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-all hover:scale-105 active:scale-95 border ${getStatusClasses(data.status as ItemStatus)}`}
          >
            {getStatusLabel(data.status as ItemStatus)}
          </button>
        </div>

        {/* Quantity card */}
        <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quantity
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleQty(-1)}
              disabled={adjustQty.isPending || currentQty <= 0}
              className="w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary active:scale-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 text-center">
              <span className="text-3xl font-semibold text-foreground tabular-nums">
                {data.quantity ?? "—"}
              </span>
              {data.unit && (
                <span className="text-sm text-muted-foreground ml-2">
                  {data.unit}
                </span>
              )}
            </div>

            <button
              onClick={() => handleQty(1)}
              disabled={adjustQty.isPending}
              className="w-10 h-10 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary active:scale-90 transition-all disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div className="bg-card border border-card-border rounded-xl p-5 mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Notes
            </p>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {data.notes}
            </p>
          </div>
        )}

        {/* Timestamps */}
        <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <div className="space-y-1">
              {data.expirationDate && (
                <p className="flex items-center gap-1.5 font-medium text-foreground mb-1">
                  {(() => {
                    const expDate = startOfDay(new Date(data.expirationDate));
                    const now = startOfDay(new Date());
                    if (isBefore(expDate, now)) {
                      return <span className="text-red-600">Expired {format(expDate, "MMM d, yyyy")}</span>;
                    }
                    const days = differenceInDays(expDate, now);
                    return <span className={days <= 14 ? "text-amber-600" : ""}>Expires in {days} days ({format(expDate, "MMM d, yyyy")})</span>;
                  })()}
                </p>
              )}
              <p>
                Updated{" "}
                {formatDistanceToNow(new Date(data.updatedAt), {
                  addSuffix: true,
                })}
              </p>
              <p>
                Created{" "}
                {formatDistanceToNow(new Date(data.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* Edit dialog */}
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 rounded-full gap-2"
                onClick={openEditDialog}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif">Edit Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSave} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as ItemStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="out">Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="edit-qty">Quantity</Label>
                    <Input
                      id="edit-qty"
                      type="number"
                      min="0"
                      step="any"
                      value={editQuantity}
                      onChange={(e) => setEditQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-unit">Unit</Label>
                    <Input
                      id="edit-unit"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    Expiration Date
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditExpirationDate(addDays(new Date(), 7))}>
                      +1 Week
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditExpirationDate(addMonths(new Date(), 1))}>
                      +1 Month
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditExpirationDate(addMonths(new Date(), 3))}>
                      +3 Months
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setEditExpirationDate(addMonths(new Date(), 6))}>
                      +6 Months
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setEditExpirationDate(null)}>
                      Clear
                    </Button>
                  </div>
                  {editExpirationDate && (
                    <p className="text-sm text-muted-foreground pl-1">
                      Set to: <span className="font-medium text-foreground">{format(editExpirationDate, "MMM d, yyyy")}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <textarea
                    id="edit-notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <Button
                    type="submit"
                    disabled={updateItem.isPending}
                    className="flex-1 rounded-full"
                  >
                    {updateItem.isPending ? "Saving…" : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="rounded-full gap-2 text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:text-red-400 dark:border-red-800 dark:hover:border-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{data.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. The item will be permanently
                  removed from your pantry.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteItem.isPending ? "Deleting…" : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Layout>
  );
}
