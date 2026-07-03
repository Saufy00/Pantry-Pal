import { useState, useEffect } from "react";
import { Product, Item, useCreateProduct, getListItemsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { toast } from "sonner";

interface ScannerFlowProps {
  onProductSelected: (product: Product) => void;
  onQuickAdd?: (product: Product) => Promise<void>;
}

type ScannerState =
  | { phase: "idle" }
  | { phase: "scanning" }
  | { phase: "resolving"; barcode: string }
  | { phase: "found"; product: Product; source: "cache" | "server"; existingItem?: Item }
  | { phase: "creating"; barcode: string }
  | { phase: "not_found"; barcode: string }
  | { phase: "error"; barcode: string; message: string }
  | { phase: "added" };

export function ScannerFlow({ onProductSelected, onQuickAdd }: ScannerFlowProps) {
  const [state, setState] = useState<ScannerState>({ phase: "idle" });
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [diagnosticLog, setDiagnosticLog] = useState<string | null>(null);

  const runDiagnostics = async () => {
    let log = "=== CAMERA DIAGNOSTICS ===\n";
    setDiagnosticLog(log);
    
    const appendLog = (msg: string) => {
      log += msg;
      setDiagnosticLog(log);
    };

    try {
      appendLog(`UA: ${navigator.userAgent.slice(0,40)}...\n`);
      
      if (!navigator.mediaDevices) {
        appendLog("FATAL: mediaDevices API missing.\n");
        return;
      }
      
      appendLog("1. Requesting enumerateDevices()...\n");
      const devices = await Promise.race([
        navigator.mediaDevices.enumerateDevices(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("enumerateDevices TIMEOUT (Blocked by Brave?)")), 3000))
      ]) as MediaDeviceInfo[];
      
      const videoDevices = devices.filter(d => d.kind === 'videoinput');
      appendLog(`-> Found ${videoDevices.length} cameras.\n`);
      
      appendLog(`2. Requesting getUserMedia()...\n`);
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("getUserMedia TIMEOUT (Blocked by Brave?)")), 3000))
      ]) as MediaStream;
      
      const track = stream.getVideoTracks()[0];
      appendLog(`-> Success! Track: ${track.label}\n`);
      
      stream.getTracks().forEach(t => t.stop());
      appendLog(`Test complete.`);
    } catch (err: any) {
      appendLog(`\n[!] ERROR: ${err.name || 'Error'}\n[!] MSG: ${err.message}\n`);
    }
  };
  
  const queryClient = useQueryClient();
  const createProductMutation = useCreateProduct();

  // Cleanup pending states on unmount
  useEffect(() => {
    return () => setState({ phase: "idle" });
  }, []);

  const handleScan = async (barcode: string) => {
    setState({ phase: "resolving", barcode });
    const result = await resolveProduct(barcode);
    
    if (result.status === "found") {
      triggerHapticSuccess();
      
      // Duplicate detection via local React Query cache
      let existingItem: Item | undefined;
      const cachedItems = queryClient.getQueryData<Item[]>(getListItemsQueryKey());
      if (cachedItems) {
        existingItem = cachedItems.find(item => item.productId === result.product.id);
      }
      
      setState({ phase: "found", product: result.product, source: result.source, existingItem });
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
              
              {state.existingItem && (
                <div className="px-4 pb-2">
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-2.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">Already in Pantry</span>
                    <span className="text-xs font-semibold text-primary/80 capitalize">
                      {state.existingItem.status.replace("_", " ")} ({state.existingItem.quantity || 1})
                      {state.existingItem.location && ` • ${state.existingItem.location}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-col gap-2">
                {onQuickAdd && (
                  <Button 
                    className="w-full gap-2 rounded-xl"
                    size="lg"
                    disabled={isQuickAdding}
                    onClick={async () => {
                      setIsQuickAdding(true);
                      try {
                        await onQuickAdd(state.product);
                        setState({ phase: "added" });
                      } catch (err: any) {
                        const detail = err?.data?.detail || err?.data?.error || err?.message || "Unknown error";
                        toast.error(`Failed to add item: ${detail}`);
                      } finally {
                        setIsQuickAdding(false);
                      }
                    }}
                  >
                    {isQuickAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {state.existingItem ? "Quick Add Another" : "Quick Add to Pantry"}
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant={onQuickAdd ? "outline" : "default"} 
                    className="w-full rounded-xl" 
                    onClick={() => {
                      onProductSelected(state.product);
                      setState({ phase: "idle" });
                    }}
                  >
                    Review Details
                  </Button>
                  <Button variant="ghost" className="w-full rounded-xl" onClick={() => setState({ phase: "scanning" })}>
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
                onClick={() => setState({ phase: "creating", barcode: state.barcode })}
              >
                Create Product
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

      case "creating":
        return (
          <div className="absolute inset-0 z-20 flex flex-col p-5 bg-black/95 backdrop-blur-md animate-in slide-in-from-bottom-4 fade-in duration-200 overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-1 mt-4">New Product</h3>
            <p className="text-white/70 text-sm mb-6">
              Barcode: <span className="font-mono text-white/90">{state.barcode}</span>
            </p>
            <form 
              className="flex flex-col gap-4 flex-1"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createProductMutation.mutate({
                  data: {
                    barcode: state.barcode,
                    name: (formData.get("name") as string).trim(),
                    brand: (formData.get("brand") as string).trim() || undefined,
                    category: (formData.get("category") as string).trim(),
                  }
                }, {
                  onSuccess: async (newProduct) => {
                    // Automatically add to pantry if Quick Add is available
                    if (onQuickAdd) {
                       try {
                         await onQuickAdd(newProduct);
                         setState({ phase: "added" });
                       } catch (err: any) {
                         // Fallback to found state if Quick Add fails
                         const detail = err?.data?.detail || err?.data?.error || err?.message || "Unknown error";
                         toast.error(`Failed to quick add: ${detail}`);
                         setState({ phase: "found", product: newProduct, source: "server" });
                       }
                    } else {
                      setState({ phase: "found", product: newProduct, source: "server" });
                    }
                  },
                  onError: (err: any) => {
                    const detail = err?.data?.detail || err?.data?.error || err?.message || "Unknown error";
                    toast.error(`Failed to create product: ${detail}`);
                  }
                });
              }}
            >
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 font-medium">Product Name <span className="text-red-400">*</span></label>
                <input name="name" required autoFocus className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Extra Virgin Olive Oil" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 font-medium">Brand <span className="text-white/40 font-normal">(Optional)</span></label>
                <input name="brand" className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Kirkland" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/70 font-medium">Category <span className="text-red-400">*</span></label>
                <input name="category" required className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary" placeholder="e.g. Cooking, Snacks" />
              </div>
              
              <div className="mt-8 flex flex-col gap-3 pb-4">
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-md font-semibold"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save & Add to Pantry"}
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full rounded-xl text-white/60 hover:text-white hover:bg-white/10" 
                  onClick={() => setState({ phase: "scanning" })}
                >
                  Cancel Scan
                </Button>
              </div>
            </form>
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
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-green-500/95 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 ring-4 ring-white/50 animate-bounce">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-2">Added!</h3>
            <p className="text-white/90 font-medium mb-8">Successfully saved to your pantry.</p>
            
            <div className="flex flex-col gap-3 w-full max-w-[280px]">
              <Button size="lg" className="w-full rounded-xl bg-white text-green-700 hover:bg-white/90 shadow-lg text-lg" onClick={() => setState({ phase: "scanning" })}>
                Scan Another
              </Button>
              <Button variant="ghost" className="w-full rounded-xl text-white hover:bg-white/20" onClick={() => setState({ phase: "idle" })}>
                Done
              </Button>
            </div>
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
          onClick={() => setState({ phase: "scanning" })} 
          className="w-full py-8 border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 hover:border-primary/60 transition-all rounded-xl text-primary flex flex-col gap-2 h-auto"
          variant="outline"
        >
          <Camera className="w-6 h-6" />
          <span className="font-semibold">Scan Barcode</span>
        </Button>
      </>
    );
  }

  const isPaused = ["resolving", "found", "not_found", "error", "added", "creating"].includes(state.phase);

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
          <div className="flex-1 bg-black/40 flex flex-col items-center justify-end pb-6 pointer-events-auto gap-4">
            {diagnosticLog ? (
              <div className="bg-black/90 text-green-400 font-mono text-[10px] p-3 rounded-lg w-11/12 max-h-[150px] overflow-y-auto whitespace-pre-wrap text-left border border-white/20">
                {diagnosticLog}
              </div>
            ) : null}
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full shadow-xl gap-2 text-xs font-medium bg-black/50 border-white/20 text-white hover:bg-black/80"
                onClick={runDiagnostics}
              >
                <AlertCircle className="w-3 h-3 text-yellow-400" /> Diagnose
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full shadow-xl gap-2 text-xs font-medium"
                onClick={() => {
                  setDiagnosticLog(null);
                  setState({ phase: "idle" });
                }}
              >
                <X className="w-3 h-3" /> Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {renderOverlay()}
    </div>
  );
}
