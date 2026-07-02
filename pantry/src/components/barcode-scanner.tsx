import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { triggerHaptic } from "@/utils/scan-feedback";

export type ScanError = {
  type: "permission_denied" | "camera_unavailable" | "camera_in_use" | "unknown";
  message: string;
};

export interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: ScanError) => void;
  paused?: boolean;
  active?: boolean;
}

export function BarcodeScanner({ 
  onScan, 
  onError, 
  paused = false, 
  active = true 
}: BarcodeScannerProps) {
  const containerId = "barcode-reader-internal";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const [flash, setFlash] = useState(false);

  // Stable refs for callbacks so the camera effect doesn't re-fire
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Initialize and cleanup camera — only depends on `active`
  useEffect(() => {
    if (!active) return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const onDecodeSuccess = (decodedText: string) => {
      // Scan-lock: skip if already processing or paused (state 3)
      if (isProcessingRef.current || scannerRef.current?.getState() === 3) return;
      
      isProcessingRef.current = true;
      
      // Visual & Haptic feedback
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      triggerHaptic(50);
      
      onScanRef.current(decodedText);
    };

    const onDecodeError = () => {
      // Silently ignore per-frame decode failures
    };

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: (viewfinderWidth, viewfinderHeight) => ({ width: Math.min(250, viewfinderWidth * 0.8), height: Math.min(150, viewfinderHeight * 0.8) }) },
      onDecodeSuccess,
      onDecodeError
    ).catch((err: any) => {
      const cb = onErrorRef.current;
      if (!cb) return;
      const errorMsg = err?.toString().toLowerCase() || "";
      if (errorMsg.includes("notallowederror") || errorMsg.includes("permission denied")) {
        cb({ type: "permission_denied", message: "Camera permission denied." });
      } else if (errorMsg.includes("notfounderror") || errorMsg.includes("no camera") || errorMsg.includes("device not found")) {
        cb({ type: "camera_unavailable", message: "No camera found." });
      } else if (errorMsg.includes("notreadableerror") || errorMsg.includes("in use")) {
        cb({ type: "camera_in_use", message: "Camera is already in use by another application." });
      } else {
        cb({ type: "unknown", message: "Failed to initialize camera." });
      }
    });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
      scanner.clear();
      scannerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Handle paused state (freeze/resume)
  useEffect(() => {
    if (!scannerRef.current || !active) return;

    // Html5Qrcode states: 1 = NOT_STARTED, 2 = SCANNING, 3 = PAUSED
    const state = scannerRef.current.getState();

    if (paused && state === 2) {
      scannerRef.current.pause(true); // true = freeze camera view
    } else if (!paused && state === 3) {
      isProcessingRef.current = false;
      scannerRef.current.resume();
    } else if (!paused && state === 2) {
      // Just clear the lock if we are unpaused and already scanning
      isProcessingRef.current = false;
    }
  }, [paused, active]);

  if (!active) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black min-h-[300px]">
      <div 
        id={containerId} 
        className="w-full"
      />
      
      {/* Green flash overlay on detect */}
      {flash && (
        <div className="absolute inset-0 border-4 border-green-500 rounded-xl transition-opacity duration-300 pointer-events-none opacity-100 z-10" />
      )}
      
      {/* Dimmed overlay when paused */}
      {paused && (
        <div className="absolute inset-0 bg-black/40 transition-opacity duration-300 z-10 pointer-events-none" />
      )}
    </div>
  );
}
