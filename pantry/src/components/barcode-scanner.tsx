import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [flash, setFlash] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [isSwitching, setIsSwitching] = useState(false);

  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!active) return;
    let isMounted = true;
    
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }

    const initCamera = async () => {
      if (!isMounted) return;
      try {
        let queue = availableCameras;
        
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
        if (!targetCamera) throw new Error("Camera index out of bounds");

        const stream = await Promise.race([
          navigator.mediaDevices.getUserMedia({ 
            video: { 
              deviceId: { exact: targetCamera.deviceId }
            } 
          }),
          new Promise((_, r) => setTimeout(() => r(new Error("Camera initialization timed out (Driver freeze)")), 3000))
        ]) as MediaStream;
        
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setIsSwitching(false);

        const scanLoop = async () => {
          if (!isMounted || !videoRef.current) return;
          if (!pausedRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const result = await codeReaderRef.current?.decodeFromVideoElement(videoRef.current);
              if (result && !pausedRef.current) {
                setFlash(true);
                setTimeout(() => setFlash(false), 300);
                triggerHaptic(50);
                onScanRef.current(result.getText());
              }
            } catch (err) {
              if (!(err instanceof NotFoundException)) {
                // Ignore silent parsing errors on bad frames
              }
            }
          }
          setTimeout(scanLoop, 250); // Scan every 250ms (4 FPS) to save battery and avoid lockups
        };

        scanLoop();
      } catch (err: any) {
        setIsSwitching(false);
        const cb = onErrorRef.current;
        if (!cb) return;
        const errMsg = err?.message || err?.toString() || "";
        const msg = errMsg.toLowerCase();
        
        if (msg.includes("not allowed") || msg.includes("permission denied")) {
          cb({ type: "permission_denied", message: "Camera permission denied." });
        } else if (msg.includes("not readable") || msg.includes("in use") || msg.includes("concurrent")) {
          cb({ type: "camera_in_use", message: "Camera is busy or releasing lock. Please try again." });
        } else {
          cb({ type: "unknown", message: `Error: ${errMsg}` });
        }
      }
    };

    // Small delay before init to prevent concurrent access on fast mounts
    const timerId = setTimeout(initCamera, 200);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      stopStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, cameraIndex]);

  const cycleCamera = async () => {
    if (availableCameras.length <= 1 || isSwitching) return;
    setIsSwitching(true);
    
    stopStream();
    
    // CRITICAL: Wait 750ms for Android driver to safely release the hardware lens 
    await new Promise(r => setTimeout(r, 750));
    
    setCameraIndex((prev) => (prev + 1) % availableCameras.length);
  };

  if (!active) return null;

  return (
    <div className="relative w-full overflow-hidden bg-black min-h-[300px]">
      <video 
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* Target Box Overlay */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
         <div className="w-[250px] h-[150px] border-2 border-white/20 rounded-xl relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 rounded-br-lg" />
         </div>
      </div>
      
      {availableCameras.length > 1 && (
        <button
          onClick={cycleCamera}
          disabled={isSwitching}
          className="absolute top-4 right-4 z-20 bg-black/60 text-white p-3 rounded-full backdrop-blur-sm border border-white/20 shadow-xl active:scale-95 transition-transform disabled:opacity-50"
        >
          <SwitchCamera className={`w-5 h-5 ${isSwitching ? 'animate-spin' : ''}`} />
        </button>
      )}
      
      {flash && <div className="absolute inset-0 border-4 border-green-500 rounded-xl pointer-events-none opacity-100 z-10" />}
      {paused && <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none backdrop-blur-sm" />}
    </div>
  );
}
