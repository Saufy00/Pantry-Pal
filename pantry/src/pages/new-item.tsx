import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useCreateItem,
  getListItemsQueryKey,
  getGetItemsSummaryQueryKey,
  getGetNeedsRestockQueryKey,
  getListCategoriesQueryKey,
  getListLocationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { ArrowLeft, Calendar } from "lucide-react";
import { Link } from "wouter";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { addDays, addMonths, format } from "date-fns";

type StatusValue = "in_stock" | "low" | "out";

export default function NewItem() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createItem = useCreateItem();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocationVal] = useState("Pantry");
  const [status, setStatus] = useState<StatusValue>("in_stock");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [notes, setNotes] = useState("");
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !category.trim()) {
      toast.error("Name and category are required.");
      return;
    }

    createItem.mutate(
      {
        data: {
          name: name.trim(),
          category: category.trim(),
          location: location.trim() || "Pantry",
          status,
          quantity: quantity.trim() || undefined,
          unit: unit.trim() || undefined,
          notes: notes.trim() || undefined,
          expirationDate: expirationDate ? expirationDate.toISOString() : undefined,
        },
      },
      {
        onSuccess: () => {
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
          queryClient.invalidateQueries({
            queryKey: getListLocationsQueryKey(),
          });
          toast.success(`"${name.trim()}" added to your pantry!`);
          navigate("/items");
        },
        onError: () => {
          toast.error("Failed to create item. Please try again.");
        },
      }
    );
  };

  return (
    <Layout>
      {/* Back link */}
      <Link
        href="/items"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pantry
      </Link>

      <div className="max-w-lg">
        <h1 className="text-2xl font-serif font-semibold text-foreground tracking-tight mb-1">
          Add Item
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Add a new item to your household stock.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Barcode Scanner */}
          <BarcodeScanner 
            onProductFound={(product) => {
              if (product.name) setName(product.name);
              if (product.category && !category) setCategory(product.category);
              if (product.imageUrl) setNotes((prev) => prev ? `${prev}\nImage: ${product.imageUrl}` : `Image: ${product.imageUrl}`);
            }} 
          />

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Olive Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Input
              id="category"
              placeholder="e.g. Cooking, Snacks, Cleaning"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Pantry, Fridge, Bathroom"
              value={location}
              onChange={(e) => setLocationVal(e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as StatusValue)}
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

          {/* Quantity + Unit (side by side) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="e.g. kg, bottles, packs"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          {/* Expiry Presets */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Estimated Expiration
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setExpirationDate(addDays(new Date(), 7))}>
                +1 Week
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setExpirationDate(addMonths(new Date(), 1))}>
                +1 Month
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setExpirationDate(addMonths(new Date(), 3))}>
                +3 Months
              </Button>
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setExpirationDate(addMonths(new Date(), 6))}>
                +6 Months
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => setExpirationDate(null)}>
                Clear
              </Button>
            </div>
            {expirationDate && (
              <p className="text-sm text-muted-foreground pl-1">
                Expires on: <span className="font-medium text-foreground">{format(expirationDate, "MMM d, yyyy")}</span>
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              placeholder="Optional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={createItem.isPending}
              className="flex-1 rounded-full"
            >
              {createItem.isPending ? "Adding…" : "Add Item"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => navigate("/items")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
