import React from 'react';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PerfumeLabel = ({ perfume, quantity, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  // The QR code contains the perfume ID for quick scanning in the app
  const qrValue = JSON.stringify({
    type: 'PERFUME_REF',
    id: perfume.id,
    brand: perfume.brand,
    name: perfume.name
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden print:shadow-none print:w-full print:max-w-none">
        <div className="p-6 border-b border-gray-300 flex justify-between items-center no-print">
          <h2 className="text-xl font-black text-black uppercase tracking-widest">Étiquette Flacon</h2>
          <button
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div id="label-content" className="p-4 bg-white text-black print:p-0 flex flex-col items-center justify-center">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 50mm 30mm;
                margin: 0;
              }
              body * {
                visibility: hidden;
              }
              #label-content, #label-content * {
                visibility: visible;
              }
              #label-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 50mm !important;
                height: 30mm !important;
                padding: 2mm !important;
                margin: 0 !important;
                display: flex !important;
                flex-direction: row !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 2mm !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />
          
          <div className="flex flex-row items-center gap-4 border-2 border-black p-2 rounded-lg w-full h-full max-w-[50mm] max-h-[30mm]">
            <div className="flex-1 flex flex-col justify-center overflow-hidden">
              <p className="text-[6px] font-black uppercase tracking-widest text-gold leading-none mb-0.5">CHIC MAN</p>
              <p className="text-[12px] font-black uppercase leading-tight truncate">{perfume.brand}</p>
              <p className="text-[10px] font-bold uppercase leading-tight truncate">{perfume.name}</p>
              <p className="text-[7px] font-bold uppercase text-zinc-500 leading-none mt-0.5">{perfume.type}</p>
              
              {quantity ? (
                <div className="mt-1 pt-1 border-t border-black flex justify-between items-center">
                  <span className="text-[12px] font-black uppercase">{quantity} ML</span>
                </div>
              ) : (
                <div className="mt-1 pt-1 border-t border-black/20 flex justify-between">
                  <span className="text-[7px] font-black uppercase">{perfume.salePriceMl} DA/ml</span>
                </div>
              )}
            </div>
            
            {!quantity && (
              <div className="flex flex-col items-center shrink-0">
                  <QRCodeSVG value={qrValue} size={45} level="M" />
                  <p className="text-[5px] font-black mt-1 uppercase">SCAN TO SELL</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 no-print flex flex-col gap-3">
          <p className="text-[10px] text-zinc-500 font-bold uppercase text-center mb-2">
            Format d'impression optimisé : 50mm x 30mm
          </p>
          <button 
              onClick={handlePrint}
              className="w-full px-4 py-3 bg-gold text-white rounded-xl font-black uppercase tracking-widest hover:bg-light-gold transition-all shadow-lg flex items-center justify-center gap-2"
          >
              <Printer size={18} /> IMPRIMER ÉTIQUETTE
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfumeLabel;
