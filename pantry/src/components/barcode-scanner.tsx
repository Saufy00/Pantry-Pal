import { useEffect, useRef, useState } from "react";
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

  // Initialize and cleanup camera
  useEffect(() => {
    if (!active) return;

    // Html5Qrcode requires the DOM element ID
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const onDecodeSuccess = (decodedText: string) => {
      // Scan-lock to prevent multiple emissions for the same scan event
      // State 3 = PAUSED
      if (isProcessingRef.current || scannerRef.current?.getState() === 3) return;
      
      isProcessingRef.current = true;
      
      // Visual & Haptic feedback
      setFlash(true);
      setTimeout(() => setFlash(false), 300);
      triggerHaptic(50);
      
      onScan(decodedText);
    };

    const onDecodeError = () => {
      // Silently ignore frame errors, which happen on every frame without a barcode
    };

    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777778 },
      onDecodeSuccess,
      onDecodeError
    ).catch((err: any) => {
      if (!onError) return;
      const errorMsg = err?.toString().toLowerCase() || "";
      if (errorMsg.includes("notallowederror") || errorMsg.includes("permission denied")) {
        onError({ type: "permission_denied", message: "Camera permission denied." });
      } else if (errorMsg.includes("notfounderror") || errorMsg.includes("no camera") || errorMsg.includes("device not found")) {
        onError({ type: "camera_unavailable", message: "No camera found." });
      } else if (errorMsg.includes("notreadableerror") || errorMsg.includes("in use")) {
        onError({ type: "camera_in_use", message: "Camera is already in use by another application." });
      } else {
        onError({ type: "unknown", message: "Failed to initialize camera." });
      }
    });

    return () => {
      if (scanner.isScanning) {
        scanner.stop().catch(console.error);
      }
      scanner.clear();
      scannerRef.current = null;
    };
  }, [active, onScan, onError]);

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
    <div className="relative w-full max-w-md mx-auto overflow-hidden rounded-xl bg-black aspect-[9/16]">
      <div 
        id={containerId} 
        className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
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
