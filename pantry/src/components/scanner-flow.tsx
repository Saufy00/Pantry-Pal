import { useState, useEffect } from "react";
import { Product } from "@workspace/api-client-react";
import { BarcodeScanner, ScanError } from "./barcode-scanner";
import { resolveProduct } from "@/services/product-resolver";
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle, Loader2, Plus, X, PackageOpen, Check } from "lucide-react";
import { triggerHapticSuccess, triggerHapticError } from "@/utils/scan-feedback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ScannerFlowProps {
  onProductSelected: (product: { name: string; category?: string | null; brand?: string | null; imageUrl?: string | null; id?: number; barcode?: string | null }) => void;
}

type ScannerState =
  | { phase: "idle" }
  | { phase: "scanning" }
  | { phase: "resolving"; barcode: string }
  | { phase: "found"; product: Product; source: "cache" | "server" }
  | { phase: "not_found"; barcode: string }
  | { phase: "error"; barcode: string; message: string }
  | { phase: "added" };

export function ScannerFlow({ onProductSelected }: ScannerFlowProps) {
  const [state, setState] = useState<ScannerState>({ phase: "idle" });
  const [showMobileWall, setShowMobileWall] = useState(false);

  // Cleanup pending states on unmount
  useEffect(() => {
    return () => setState({ phase: "idle" });
  }, []);

  const handleScan = async (barcode: string) => {
    setState({ phase: "resolving", barcode });
    const result = await resolveProduct(barcode);
    
    if (result.status === "found") {
      triggerHapticSuccess();
      setState({ phase: "found", product: result.product, source: result.source });
    } else if (result.status === "not_found") {
      triggerHapticError();
      setState({ phase: "not_found", barcode: result.barcode });
    } else {
      triggerHapticError();
      setState({ phase: "error", barcode: result.barcode, message: result.message });
    }
  };

  const handleError = (error: ScanError) => {
    setState({ phase: "error", barcode: "", message: error.message });
  };

  const renderOverlay = () => {
    switch (state.phase) {
      case "resolving":
        return (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center text-white bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <h3 className="text-lg font-semibold">Looking up product...</h3>
            <p className="text-sm text-white/70 mt-1 font-mono">{state.barcode}</p>
          </div>
        );
      
      case "found":
        return (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-end p-4 bg-black/50 backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in duration-200">
            <div className="w-full bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
              <div className="p-4 flex gap-4">
                {state.product.imageUrl ? (
                  <div className="w-16 h-16 rounded-xl border border-border/40 overflow-hidden shrink-0 bg-muted/20">
                    <img src={state.product.imageUrl} alt={state.product.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-center shrink-0">
                    <PackageOpen className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 justify-center">
                  <span className="font-semibold text-foreground truncate text-lg leading-tight">{state.product.name}</span>
                  {state.product.brand && (
                    <span className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{state.product.brand}</span>
                  )}
                  {state.product.category && (
                    <span className="inline-block mt-1.5 text-[10px] bg-secondary/80 px-2 py-0.5 rounded text-muted-foreground border border-border/30 w-fit truncate max-w-full">
                      {state.product.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-col gap-2">
                <Button 
                  className="w-full gap-2 rounded-xl"
                  size="lg"
                  onClick={() => {
                    onProductSelected(state.product);
                    setState({ phase: "added" });
                    setTimeout(() => setState({ phase: "scanning" }), 1500);
                  }}
                >
                  <Plus className="w-4 h-4" /> Add to Pantry
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => setState({ phase: "scanning" })}>
                    Scan Another
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={() => setState({ phase: "idle" })}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "not_found":
        return (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-md animate-in zoom-in-95 fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4 ring-1 ring-destructive/30">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Barcode Not Found</h3>
            <p className="text-white/70 text-sm mb-6 max-w-[250px]">
              We couldn't identify <span className="font-mono text-white/90">{state.barcode}</span> in the catalog.
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Button 
                size="lg" 
                className="w-full rounded-xl shadow-lg" 
                onClick={() => {
                  onProductSelected({ name: "", barcode: state.barcode });
                  setState({ phase: "idle" });
                }}
              >
                Add Manually
              </Button>
              <Button variant="outline" className="w-full rounded-xl bg-transparent border-white/20 text-white hover:bg-white/10" onClick={() => setState({ phase: "scanning" })}>
                Scan Another
              </Button>
              <Button variant="ghost" className="w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5" onClick={() => setState({ phase: "idle" })}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/80 backdrop-blur-md animate-in zoom-in-95 fade-in duration-200">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Scanner Error</h3>
            <p className="text-white/70 text-sm mb-6 max-w-[250px]">
              {state.message}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Button size="lg" className="w-full rounded-xl bg-white text-black hover:bg-white/90" onClick={() => setState({ phase: "scanning" })}>
                Retry
              </Button>
              <Button variant="ghost" className="w-full rounded-xl text-white/60 hover:text-white hover:bg-white/5" onClick={() => setState({ phase: "idle" })}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case "added":
        return (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-green-500/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 ring-2 ring-white/50">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Added!</h3>
            <p className="text-white/90 font-medium">Ready for next scan</p>
          </div>
        );

      default:
        return null;
    }
  };

  if (state.phase === "idle") {
    return (
      <>
        <Button 
          type="button"
          onClick={() => {
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile) {
              setShowMobileWall(true);
            } else {
              setState({ phase: "scanning" });
            }
          }} 
          className="w-full py-8 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all rounded-xl text-primary flex flex-col gap-2 h-auto"
          variant="outline"
        >
          <Camera className="w-6 h-6" />
          <span className="font-semibold">Scan Barcode</span>
        </Button>

        <AlertDialog open={showMobileWall} onOpenChange={setShowMobileWall}>
          <AlertDialogContent className="rounded-2xl max-w-[340px]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">Mobile Scanning In Progress</AlertDialogTitle>
              <AlertDialogDescription className="text-base text-muted-foreground mt-2">
                We're currently optimizing the barcode scanner hardware integration for mobile devices. Please add items manually for now while we perfect the mobile camera experience.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4">
              <AlertDialogAction className="rounded-xl w-full" onClick={() => setShowMobileWall(false)}>Got it</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  const isPaused = ["resolving", "found", "not_found", "error", "added"].includes(state.phase);

  return (
    <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 animate-in fade-in duration-300">
      <BarcodeScanner 
        active={true} 
        paused={isPaused} 
        onScan={handleScan} 
        onError={handleError} 
      />

      {/* Viewfinder overlay during active scanning */}
      {state.phase === "scanning" && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
          <div className="flex-1 bg-black/40" />
          <div className="h-48 flex">
            <div className="flex-1 bg-black/40" />
            <div className="w-64 border border-white/20 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
            <div className="flex-1 bg-black/40" />
          </div>
          <div className="flex-1 bg-black/40 flex items-end justify-center pb-6 pointer-events-auto">
            <Button 
              variant="secondary" 
              size="sm" 
              className="rounded-full shadow-xl gap-2 text-xs font-medium"
              onClick={() => setState({ phase: "idle" })}
            >
              <X className="w-3 h-3" /> Cancel
            </Button>
          </div>
        </div>
      )}

      {renderOverlay()}
    </div>
  );
}
