import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { triggerHaptic } from "@/utils/scan-feedback";
import { SwitchCamera } from "lucide-react";

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
  
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Initialize camera
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
        let queue = availableCameras;
        
        // Fetch and sort cameras on first load
        if (queue.length === 0) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          if (videoDevices.length === 0) throw new Error("No camera devices found.");
          
          const getCameraScore = (label: string) => {
            const lower = label.toLowerCase();
            if (lower.includes('front')) return -100;
            let score = 0;
            if (lower.includes('back') || lower.includes('environment') || lower.includes('rear')) score += 50;
            const match = lower.match(/camera\s*(\d+)/);
            if (match) score += (20 - parseInt(match[1], 10));
            return score;
          };
          
          queue = [...videoDevices].sort((a, b) => getCameraScore(b.label) - getCameraScore(a.label));
          setAvailableCameras(queue);
        }
        
        const targetCamera = queue[cameraIndex];
        if (!targetCamera) throw new Error("Target camera index out of bounds");

        // Briefly test the hardware lock (avoids driver crashes on bad lenses)
        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: targetCamera.deviceId } } }),
          new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 1500))
        ]) as MediaStream;
        
        stream.getTracks().forEach(t => t.stop());
        await new Promise(r => setTimeout(r, 500));
        
        if (!isMounted) return;

        await scanner.start(
          targetCamera.deviceId,
          { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
          onDecodeSuccess,
          () => {} 
        );
        setIsSwitching(false);
      } catch (err: any) {
        setIsSwitching(false);
        const cb = onErrorRef.current;
        if (!cb) return;
        cb({ type: "unknown", message: err?.message || "Failed to initialize camera." });
      }
    };

    const timerId = setTimeout(initScanner, 400);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(console.error).finally(() => scanner?.clear());
      } else if (scanner) {
        scanner.clear();
      }
      scannerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, cameraIndex]); // Re-run when cameraIndex changes

  useEffect(() => {
    if (!scannerRef.current || !active) return;
    const state = scannerRef.current.getState();
    if (paused && state === 2) {
      scannerRef.current.pause(true);
    } else if (!paused && state === 3) {
      isProcessingRef.current = false;
      scannerRef.current.resume();
    } else if (!paused && state === 2) {
      isProcessingRef.current = false;
    }
  }, [paused, active]);

  const cycleCamera = () => {
    if (availableCameras.length <= 1 || isSwitching) return;
    setIsSwitching(true);
    setCameraIndex((prev) => (prev + 1) % availableCameras.length);
  };

  if (!active) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black min-h-[300px]">
      <div 
        id={containerId} 
        className={`w-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_video]:absolute [&_video]:inset-0 [&_video]:!block [&_video]:!opacity-100 [&_video]:!visibility-visible transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {availableCameras.length > 1 && (
        <button
          onClick={cycleCamera}
          disabled={isSwitching}
          className="absolute top-4 right-4 z-20 bg-black/60 text-white p-3 rounded-full backdrop-blur-sm border border-white/20 shadow-xl active:scale-95 transition-transform"
        >
          <SwitchCamera className={`w-5 h-5 ${isSwitching ? 'animate-spin' : ''}`} />
        </button>
      )}
      
      {flash && <div className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none opacity-100 z-10" />}
      {paused && <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />}
    </div>
  );
}
