import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const CameraScanner = ({ isOpen, onClose, onScanSuccess }) => {
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the DOM element is fully rendered
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("reader-container");
        html5QrcodeRef.current = html5QrCode;

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode.start(
          { facingMode: "environment" }, // back camera
          config,
          (decodedText) => {
            // On success
            onScanSuccess(decodedText);
            stopScanner();
            onClose();
          },
          (errorMessage) => {
            // Ignore scan failures (they are generated continuously when scanning finds nothing)
          }
        ).catch((err) => {
          console.error("Error starting camera scanner:", err);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen]);

  const stopScanner = () => {
    if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
      html5QrcodeRef.current.stop().then(() => {
        html5QrcodeRef.current.clear();
      }).catch((err) => {
        console.error("Error stopping scanner:", err);
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-[100] no-print">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center text-white">
          <h3 className="font-bold text-sm uppercase tracking-widest text-gold">Scanner avec caméra</h3>
          <button 
            onClick={() => { stopScanner(); onClose(); }}
            className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center bg-black">
          <div id="reader-container" className="w-full max-w-xs aspect-square rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"></div>
          <p className="text-zinc-500 text-[10px] mt-4 uppercase tracking-wider text-center">
            Cadrez le code QR / code-barres dans le carré
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraScanner;
