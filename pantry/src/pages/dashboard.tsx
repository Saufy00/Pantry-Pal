import { Layout } from "@/components/layout";
import { ItemCard, EmptyState, SkeletonCard } from "@/components/item-card";
import {
  useGetItemsSummary,
  useGetNeedsRestock,
  useListCategories,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Layers,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function SummaryCardSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-muted rounded-md w-20" />
      <div className="h-8 bg-muted rounded-md w-14" />
    </div>
  );
}

function CategoryRowSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 animate-pulse">
      <div className="h-4 bg-muted rounded-md w-28" />
      <div className="flex gap-3">
        <div className="h-4 bg-muted rounded-md w-10" />
        <div className="h-4 bg-muted rounded-md w-10" />
        <div className="h-4 bg-muted rounded-md w-10" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const summary = useGetItemsSummary();
  const restock = useGetNeedsRestock();
  const categories = useListCategories();

  const stats = [
    {
      label: "Total Items",
      value: summary.data?.total ?? 0,
      icon: Package,
      color: "text-foreground",
      bg: "bg-secondary",
    },
    {
      label: "In Stock",
      value: summary.data?.inStock ?? 0,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      label: "Low",
      value: summary.data?.low ?? 0,
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      label: "Out",
      value: summary.data?.out ?? 0,
      icon: XCircle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
    },
  ];

  const hasItems = summary.data && summary.data.total > 0;

  return (
    <Layout>
      {/* Greeting */}
      <section className="mb-8">
        <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground tracking-tight">
          Overview
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          A quick look at your household stock.
        </p>
      </section>

      {/* Summary stat cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {summary.isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SummaryCardSkeleton key={i} />
            ))
          : stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                custom={i}
                className="bg-card border border-card-border rounded-xl p-5 flex flex-col gap-2 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}
                  >
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {s.label}
                  </span>
                </div>
                <span className="text-2xl font-semibold text-foreground tabular-nums">
                  {s.value}
                </span>
              </motion.div>
            ))}
      </section>

      {/* Empty state when no items exist */}
      {!summary.isLoading && !hasItems && (
        <EmptyState
          title="Your pantry is empty"
          description="Add your first item to start tracking your household stock."
          actionText="Add Item"
          actionHref="/items/new"
        />
      )}

      {/* Needs Restock */}
      {hasItems && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="text-lg font-serif font-medium text-foreground">
                Needs Restock
              </h2>
            </div>
            <Link
              href="/items"
              className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {restock.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : restock.data && restock.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {restock.data.slice(0, 6).map((item, i) => (
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
            <div className="bg-card/50 border border-dashed border-border/60 rounded-xl p-6 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Everything is well stocked!
              </p>
            </div>
          )}
        </section>
      )}

      {/* Categories */}
      {hasItems && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-lg font-serif font-medium text-foreground">
              Categories
            </h2>
          </div>

          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            {categories.isLoading ? (
              <div className="p-4 space-y-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <CategoryRowSkeleton key={i} />
                ))}
              </div>
            ) : categories.data && categories.data.length > 0 ? (
              <div className="divide-y divide-border/40">
                {categories.data.map((cat, i) => (
                  <motion.div
                    key={cat.category}
                    variants={fadeIn}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                  >
                    <Link
                      href={`/items?category=${encodeURIComponent(cat.category)}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/50 transition-colors group"
                    >
                      <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground tabular-nums">
                          {cat.total} total
                        </span>
                        <Separator
                          orientation="vertical"
                          className="h-3.5"
                        />
                        <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {cat.inStock}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 tabular-nums">
                          {cat.low}
                        </span>
                        <span className="text-red-600 dark:text-red-400 tabular-nums">
                          {cat.out}
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </Layout>
  );
}
