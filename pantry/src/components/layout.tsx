import React from "react";
import { Link, useLocation } from "wouter";
import { Home, List, Plus, Package, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isOnline = useOnlineStatus();

  const isItems = location.startsWith("/items") && location !== "/items/new";
  const isHome = location === "/";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden font-sans">
      {/* Subtle texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0 mix-blend-multiply opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />

      {/* Offline banner — slides in below the header when network is lost */}
      {!isOnline && (
        <div className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-medium py-2 px-4 animate-in slide-in-from-top duration-300">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You're offline — changes will sync when reconnected</span>
        </div>
      )}

      {/* Desktop header — hidden on mobile */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl hidden md:block">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm group-hover:-translate-y-0.5 transition-transform duration-200">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
              Home Stock
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${isHome ? "text-primary" : "text-muted-foreground"}`}
            >
              Overview
            </Link>
            <Link
              href="/items"
              className={`text-sm font-medium transition-colors hover:text-primary ${isItems ? "text-primary" : "text-muted-foreground"}`}
            >
              Pantry
            </Link>
            <Link
              href="/items/new"
              className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-full hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Item
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile top bar — logo only, no nav (nav is bottom) */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center px-4 h-14">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Package className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-semibold text-base tracking-tight text-foreground">
              Home Stock
            </span>
          </Link>
          {!isOnline && (
            <span className="ml-auto flex items-center gap-1 text-xs text-amber-600 font-medium">
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
        </div>
      </header>

      {/* Main content — pb accounts for bottom nav on mobile */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-10 z-10 pb-28 md:pb-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border/10 py-6 text-center text-xs text-muted-foreground z-10 pb-28 md:pb-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <span>&copy; {new Date().getFullYear()} Home Stock. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors underline underline-offset-4">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border">
        {/* Safe area padding for iOS home indicator */}
        <div className="flex items-center justify-around px-2 pt-2 pb-[max(env(safe-area-inset-bottom),10px)]">

          {/* Overview tab */}
          <Link href="/" className="flex-1">
            <div className={`flex flex-col items-center gap-1 py-1 min-h-[52px] justify-center transition-colors ${isHome ? "text-primary" : "text-muted-foreground"}`}>
              <Home className="w-6 h-6" />
              <span className="text-[11px] font-medium">Overview</span>
            </div>
          </Link>

          {/* Floating Add button (centre) */}
          <div className="flex-1 flex justify-center -mt-5">
            <Link href="/items/new">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all border-4 border-background">
                <Plus className="w-7 h-7" />
              </div>
            </Link>
          </div>

          {/* Pantry tab */}
          <Link href="/items" className="flex-1">
            <div className={`flex flex-col items-center gap-1 py-1 min-h-[52px] justify-center transition-colors ${isItems ? "text-primary" : "text-muted-foreground"}`}>
              <List className="w-6 h-6" />
              <span className="text-[11px] font-medium">Pantry</span>
            </div>
          </Link>

        </div>
      </nav>
    </div>
  );
}
