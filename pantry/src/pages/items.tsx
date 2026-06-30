import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout";
import { ItemCard, EmptyState, SkeletonCard } from "@/components/item-card";
import {
  useListItems,
  useListCategories,
  useListLocations,
  type ListItemsParams,
  type Item,
} from "@workspace/api-client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Search, MapPin } from "lucide-react";
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
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useListCategories();
  const locations = useListLocations();

  const params: ListItemsParams = {};
  if (categoryFilter !== "all") params.category = categoryFilter;
  if (locationFilter !== "all") params.location = locationFilter;
  if (statusFilter !== "all") params.status = statusFilter;
  if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

  const items = useListItems(params);

  const groupedItems = useMemo(() => {
    if (!items.data) return new Map<string, Item[]>();
    const map = new Map<string, Item[]>();
    for (const item of items.data) {
      const loc = item.location || "Uncategorized";
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)!.push(item);
    }
    return map;
  }, [items.data]);

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
      <section className="flex flex-col sm:flex-row gap-3 mb-6 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Location filter */}
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.data?.map((loc) => (
              <SelectItem key={loc.location} value={loc.location}>
                {loc.location}
                <span className="ml-1 text-muted-foreground text-xs">
                  ({loc.total})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
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
          <SelectTrigger className="w-full sm:w-[140px]">
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

      {/* Items List */}
      {items.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.data && items.data.length > 0 ? (
        <div className="flex flex-col gap-8">
          {Array.from(groupedItems.entries()).map(([locationName, locationItems]) => (
            <section key={locationName} className="flex flex-col gap-3">
              <div className="sticky top-[64px] md:top-[64px] z-20 -mx-4 px-4 py-2 bg-background/90 backdrop-blur border-y border-border/40 shadow-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h2 className="font-medium text-foreground tracking-tight">
                  {locationName}
                </h2>
                <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-1">
                  {locationItems.length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {locationItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    custom={i % 6}
                  >
                    <ItemCard item={item} />
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No items found"
          description={
            debouncedSearch || categoryFilter !== "all" || locationFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your filters or search term."
              : "Your pantry is empty. Add your first item to get started!"
          }
          actionText={
            !(debouncedSearch || categoryFilter !== "all" || locationFilter !== "all" || statusFilter !== "all")
              ? "Add Item"
              : undefined
          }
          actionHref={
            !(debouncedSearch || categoryFilter !== "all" || locationFilter !== "all" || statusFilter !== "all")
              ? "/items/new"
              : undefined
          }
        />
      )}
    </Layout>
  );
}
