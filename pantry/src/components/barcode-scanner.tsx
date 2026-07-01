import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { toast } from "sonner";
import { lookupProductByBarcode } from "@workspace/api-client-react";

export function BarcodeScanner({
  onProductFound,
}: {
  onProductFound: (product: { name: string; category?: string; brand?: string; imageUrl?: string; id?: number; barcode?: string }) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanner = () => {
    setScanning(true);
    setTimeout(() => {
      scannerRef.current = new Html5QrcodeScanner(
        "barcode-reader",
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777778 },
        false
      );
      scannerRef.current.render(
        async (decodedText) => {
          // Stop scanner first
          scannerRef.current?.clear().catch(console.error);
          setScanning(false);
          
          toast.info("Looking up product...", { id: "barcode-lookup" });
          try {
            const product = await lookupProductByBarcode(decodedText);
            if (product && product.name) {
              toast.success("Product found!", { id: "barcode-lookup" });
              onProductFound({
                name: product.name,
                category: product.category || undefined,
                brand: product.brand || undefined,
                imageUrl: product.imageUrl || undefined,
                id: product.id,
                barcode: product.barcode,
              });
            } else {
              toast.error("Product name missing in database", { id: "barcode-lookup" });
            }
          } catch (err) {
            console.error(err);
            toast.error("Product not found in catalog", { id: "barcode-lookup" });
            // Allow manual creation of item and product
            onProductFound({
              name: "",
              barcode: decodedText,
            });
          }
        },
        () => {
          // Ignore frame errors
        }
      );
    }, 100);
  };

  const cancelScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
    setScanning(false);
  };

  if (!scanning) {
    return (
      <Button
        variant="outline"
        type="button"
        onClick={startScanner}
        className="w-full flex gap-2 items-center rounded-xl h-12"
      >
        <Camera className="w-5 h-5" />
        Scan Barcode
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 border rounded-2xl p-4 bg-muted/20">
      <div id="barcode-reader" className="w-full max-w-sm rounded-xl overflow-hidden" />
      <Button variant="ghost" type="button" onClick={cancelScanner} className="text-red-500 hover:text-red-600 hover:bg-red-500/10">
        <X className="w-4 h-4 mr-2" />
        Cancel Scan
      </Button>
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Product lookup powered by <a href="https://world.openfoodfacts.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-muted-foreground">Open Food Facts</a> and its sister projects (ODbL).
      </p>
    </div>
  );
}
