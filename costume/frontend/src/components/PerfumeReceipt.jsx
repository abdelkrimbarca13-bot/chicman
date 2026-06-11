import React from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { X, Printer, Tag } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const PerfumeReceipt = ({ sale, onClose, onPrintLabel }) => {
  const handlePrint = () => {
    window.print();
  };

  const qrValue = JSON.stringify({
    type: 'PERFUME_SALE',
    id: sale.id,
    perfume: `${sale.perfume.brand} ${sale.perfume.name}`,
    total: sale.totalAmount,
    date: format(new Date(sale.date), 'dd/MM/yyyy')
  });

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible print:w-full print:max-w-none">
        <div className="p-6 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white z-10 no-print">
          <h2 className="text-xl font-black text-black uppercase tracking-widest">Ticket Parfum</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black text-white rounded-lg font-bold flex items-center hover:bg-gray-800 transition-colors text-xs"
            >
              <Printer size={16} className="mr-2" /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 shadow-sm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div id="receipt-content" className="p-8 bg-white text-black font-mono print:p-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              #receipt-content {
                width: 80mm !important;
                padding: 5mm !important;
                margin: 0 !important;
                box-sizing: border-box !important;
              }
            }
          `}} />
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black tracking-tighter border-b-2 border-black inline-block px-4 pb-1 mb-1 font-serif">CHIC MAN</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black">PARFUMERIE DE LUXE</p>
          </div>

          <div className="flex justify-between items-end mb-4 border-b border-black pb-2">
            <div>
              <p className="text-[10px] uppercase font-black">VENTE N°</p>
              <p className="text-xl font-black">#P{sale.id.toString().padStart(5, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-black">DATE</p>
              <p className="text-xs font-black">{format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          <div className="mb-6 space-y-4">
            <div className="border-b-2 border-dotted border-black pb-4">
              <p className="text-[10px] uppercase font-black text-gray-500 mb-1">PRODUIT:</p>
              <p className="text-lg font-black uppercase leading-tight">{sale.perfume.brand}</p>
              <p className="text-base font-bold uppercase">{sale.perfume.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase font-black text-gray-500">QUANTITÉ:</p>
                <p className="text-base font-black">{sale.quantityMl} ml</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-black text-gray-500">PRIX/ML:</p>
                <p className="text-base font-black">{sale.unitPriceMl} DA</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center mb-6 bg-black text-white p-4 rounded-lg">
              <p className="text-xs uppercase font-black mb-1 opacity-70">TOTAL À PAYER</p>
              <p className="text-3xl font-black">{sale.totalAmount.toLocaleString()} DA</p>
          </div>

          <div className="flex flex-col items-center mb-6">
              <QRCodeSVG value={qrValue} size={80} level="H" />
              <p className="text-[8px] font-black mt-2 uppercase tracking-widest">MERCI DE VOTRE VISITE</p>
          </div>

          <div className="text-center border-t border-dotted border-black pt-4">
            <p className="text-[9px] font-black uppercase leading-tight">
              Tlemcen, Algérie
            </p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 no-print flex flex-col gap-4">
          <div className="flex gap-4">
            <button 
                onClick={handlePrint}
                className="flex-[2] px-4 py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Printer size={18} /> IMPRIMER TICKET
            </button>
            <button 
                onClick={() => onClose()}
                className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200"
            >
                FERMER
            </button>
          </div>
          <button 
              onClick={() => onPrintLabel(sale.perfume)}
              className="w-full px-4 py-3 bg-gold text-white rounded-xl font-black uppercase tracking-widest hover:bg-light-gold transition-all shadow-lg flex items-center justify-center gap-2"
          >
              <Tag size={18} /> IMPRIMER ÉTIQUETTE FLACON
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PerfumeReceipt;
