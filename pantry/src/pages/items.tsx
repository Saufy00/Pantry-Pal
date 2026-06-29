import { useState } from "react";
import { Layout } from "@/components/layout";
import { ItemCard, EmptyState, SkeletonCard } from "@/components/item-card";
import {
  useListItems,
  useListCategories,
  type ListItemsParams,
} from "@workspace/api-client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type StatusFilter = "all" | "in_stock" | "low" | "out";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "in_stock", label: "In Stock" },
  { value: "low", label: "Low" },
  { value: "out", label: "Out" },
];

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function Items() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const categories = useListCategories();

  const params: ListItemsParams = {};
  if (categoryFilter !== "all") params.category = categoryFilter;
  if (statusFilter !== "all") params.status = statusFilter;

  const items = useListItems(params);

  // Client-side search filtering
  const filteredItems = items.data?.filter((item) =>
    search.trim()
      ? item.name.toLowerCase().includes(search.trim().toLowerCase())
      : true
  );

  return (
    <Layout>
      {/* Header */}
      <section className="mb-6">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground tracking-tight">
          Pantry
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and manage your stock items.
        </p>
      </section>

      {/* Filters */}
      <section className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.data?.map((cat) => (
              <SelectItem key={cat.category} value={cat.category}>
                {cat.category}
                <span className="ml-1 text-muted-foreground text-xs">
                  ({cat.total})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Items grid */}
      {items.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filteredItems && filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              custom={i}
            >
              <ItemCard item={item} />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No items found"
          description={
            search || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search term."
              : "Your pantry is empty. Add your first item to get started!"
          }
          actionText={
            !(search || categoryFilter !== "all" || statusFilter !== "all")
              ? "Add Item"
              : undefined
          }
          actionHref={
            !(search || categoryFilter !== "all" || statusFilter !== "all")
              ? "/items/new"
              : undefined
          }
        />
      )}
    </Layout>
  );
}
