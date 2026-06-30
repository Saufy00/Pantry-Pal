import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useGetNeedsRestock,
  useListShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useUpdateItemStatus,
  getListShoppingItemsQueryKey,
  getGetNeedsRestockQueryKey,
  getListItemsQueryKey,
  getGetItemsSummaryQueryKey,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle2, Circle, Trash2, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Shopping() {
  const queryClient = useQueryClient();
  const [newItemName, setNewItemName] = useState("");

  const needsRestock = useGetNeedsRestock();
  const customItems = useListShoppingItems();
  
  const createItem = useCreateShoppingItem();
  const updateItem = useUpdateShoppingItem();
  const deleteItem = useDeleteShoppingItem();
  const updateStatus = useUpdateItemStatus();

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    createItem.mutate(
      { data: { name: newItemName.trim() } },
      {
        onSuccess: () => {
          setNewItemName("");
          queryClient.invalidateQueries({ queryKey: getListShoppingItemsQueryKey() });
        },
        onError: () => toast.error("Failed to add item"),
      }
    );
  };

  const handleToggleCustom = (id: number, checked: boolean) => {
    updateItem.mutate(
      { id, data: { checked: !checked } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShoppingItemsQueryKey() }),
        onError: () => toast.error("Failed to update item"),
      }
    );
  };

  const handleDeleteCustom = (id: number) => {
    deleteItem.mutate(
      { id },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListShoppingItemsQueryKey() }),
        onError: () => toast.error("Failed to delete item"),
      }
    );
  };

  const handleMarkRestocked = (id: number, name: string) => {
    updateStatus.mutate(
      { id, data: { status: "in_stock" } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNeedsRestockQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetItemsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
          toast.success(`${name} restocked!`);
        },
        onError: () => toast.error("Failed to restock item"),
      }
    );
  };

  const isLoading = needsRestock.isLoading || customItems.isLoading;

  return (
    <Layout>
      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground tracking-tight">
          Shopping List
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Items running low and custom items you need to buy.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Needs Restock Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-medium flex items-center gap-2 border-b pb-2">
            <Package className="w-5 h-5 text-primary" />
            Inventory to Restock
          </h2>
          {needsRestock.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : needsRestock.data && needsRestock.data.length > 0 ? (
            <div className="space-y-2">
              {needsRestock.data.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-card border border-card-border rounded-xl shadow-sm">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} {item.unit} • {item.location}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-xs"
                    onClick={() => handleMarkRestocked(item.id, item.name)}
                    disabled={updateStatus.isPending}
                  >
                    Mark Restocked
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-4">All inventory items are fully stocked.</p>
          )}
        </section>

        {/* Custom Shopping List Section */}
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-medium flex items-center gap-2 border-b pb-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Extra Items
          </h2>
          
          <form onSubmit={handleAddCustom} className="flex gap-2">
            <Input
              placeholder="Add milk, eggs, etc..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1"
              disabled={createItem.isPending}
            />
            <Button type="submit" disabled={!newItemName.trim() || createItem.isPending} className="px-4">
              <Plus className="w-4 h-4" />
            </Button>
          </form>

          {customItems.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : customItems.data && customItems.data.length > 0 ? (
            <div className="space-y-2">
              {customItems.data.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center gap-3 p-3 bg-card border border-card-border rounded-xl shadow-sm transition-opacity ${item.checked ? 'opacity-50' : ''}`}
                >
                  <button onClick={() => handleToggleCustom(item.id, item.checked)} className="text-primary hover:text-primary/80 transition-colors">
                    {item.checked ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <span className={`flex-1 font-medium ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCustom(item.id)}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic py-4">Your custom shopping list is empty.</p>
          )}
        </section>
      </div>
    </Layout>
  );
}
