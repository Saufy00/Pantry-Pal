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

    let isMounted = true;
    let scanner: Html5Qrcode | null = null;

    const initScanner = async () => {
      if (!isMounted) return;
      
      scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;

      const onDecodeSuccess = (decodedText: string) => {
        if (isProcessingRef.current || scannerRef.current?.getState() === 3) return;
        
        isProcessingRef.current = true;
        setFlash(true);
        setTimeout(() => setFlash(false), 300);
        triggerHaptic(50);
        
        onScanRef.current(decodedText);
      };

      try {
        // 1. Get raw list of cameras using the native browser API
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        
        if (videoDevices.length === 0) {
          throw new Error("No camera devices found.");
        }
        
        // 2. Identify potential back cameras. Put them at the front of the list.
        const backCameras = videoDevices.filter(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'));
        const otherCameras = videoDevices.filter(d => !backCameras.includes(d));
        // Test back cameras first, then fallback to testing the rest
        const testQueue = [...backCameras, ...otherCameras];
        
        let goldenDeviceId: string | null = null;
        
        // 3. The Aggressive Lock-Picker: Test each camera with a strict 1500ms timeout
        for (const device of testQueue) {
          try {
            const stream = await Promise.race([
              navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } } }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1500))
            ]) as MediaStream;
            
            // If it succeeds without hanging, this is our safe camera!
            goldenDeviceId = device.deviceId;
            
            // Immediately release the hardware lock so Html5Qrcode can use it
            stream.getTracks().forEach(t => t.stop());
            break; 
          } catch (probeErr) {
            // It hung or failed. Ignore and move to the next lens.
            continue;
          }
        }
        
        if (!goldenDeviceId) {
          throw new Error("All cameras timed out or failed to initialize.");
        }
        
        // 4. Safely initialize the scanner with the proven hardware ID
        await scanner.start(
          goldenDeviceId,
          { 
            fps: 10, 
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0 
          },
          onDecodeSuccess,
          () => {} // silent on per-frame decode errors
        );
      } catch (err: any) {
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
          cb({ type: "unknown", message: err?.message || "Failed to initialize camera." });
        }
      }
    };

    // Delay initialization to ensure the browser has painted the DOM and calculated 
    // real CSS dimensions. Increased to 400ms for slower mobile devices.
    const timerId = setTimeout(initScanner, 400);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error).finally(() => {
          scanner?.clear();
        });
      } else if (scanner) {
        scanner.clear();
      }
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
        className="w-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:absolute [&_video]:inset-0 [&_video]:!block [&_video]:!opacity-100 [&_video]:!visibility-visible"
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
