import React from 'react';
import { format } from 'date-fns';
import { X, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const RentalReceipt = ({ rental, onClose }) => {
  const guaranteeDocuments = {
    PASSPORT: 'Passeport',
    ID_CARD: 'Carte d\'identité',
    DRIVER_LICENSE: 'Permis de conduire'
  };

  const handlePrint = () => {
    window.print();
  };

  const balance = rental.totalAmount - rental.paidAmount;
  const qrValue = JSON.stringify({
    id: rental.id,
    customer: `${rental.customer.firstName} ${rental.customer.lastName}`,
    total: rental.totalAmount,
    date: format(new Date(rental.createdAt), 'dd/MM/yyyy')
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:max-h-none print:overflow-visible print:w-full print:max-w-none">
        <div className="p-6 border-b border-gray-300 flex justify-between items-center sticky top-0 bg-white z-10 no-print">
          <h2 className="text-2xl font-black text-black">BON DE LOCATION</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-black text-white rounded font-bold flex items-center hover:bg-gray-800 transition-colors"
            >
              <Printer size={18} className="mr-2" /> Imprimer
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 text-gray-800 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300 shadow-sm"
              title="Quitter"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div id="receipt-content" className="p-8 bg-white text-black font-mono print:p-0">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A5;
                margin: 5mm;
              }
              body * {
                visibility: hidden;
              }
              #receipt-content, #receipt-content * {
                visibility: visible;
              }
              #receipt-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black tracking-tighter border-b-4 border-black inline-block px-6 pb-2 mb-1">CHIC MAN</h1>
            <p className="text-[12px] uppercase tracking-[0.3em] font-black">LUXURY RENTAL</p>
          </div>

          <div className="flex justify-between items-end mb-6 border-b-2 border-black pb-3">
            <div>
              <p className="text-[12px] uppercase font-black mb-1">BON N°</p>
              <p className="text-3xl font-black">#{rental.id.toString().padStart(5, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] uppercase font-black mb-1">DATE</p>
              <p className="text-base font-black">{format(new Date(rental.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 border-b border-black pb-4">
            <div className="flex justify-between items-center">
              <span className="font-black text-[12px] uppercase">CLIENT:</span>
              <span className="font-black uppercase text-lg">{rental.customer.firstName} {rental.customer.lastName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-[12px] uppercase">TEL:</span>
              <span className="font-black text-lg">{rental.customer.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-[11px] uppercase">DOC GARANTIE:</span>
              <span className="font-black uppercase text-[13px]">{guaranteeDocuments[rental.guaranteeDocument] || 'N/S'}</span>
            </div>
            <div className="flex flex-col mt-2 pt-2 border-t border-dotted border-black">
              <span className="font-black text-[12px] uppercase mb-1">PERIODE DE LOCATION:</span>
              <div className="flex justify-between font-black text-base bg-black text-white px-3 py-1.5 rounded">
                <span>DU {format(new Date(rental.startDate), 'dd/MM/yy')}</span>
                <span>AU {format(new Date(rental.expectedReturn), 'dd/MM/yy')}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black text-[13px] uppercase font-black">
                  <th className="py-2">ARTICLES</th>
                  <th className="py-2 text-right">TAILLE</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-dotted divide-black">
                {rental.items.map((ri, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <p className="font-black text-base uppercase">{ri.item.name}</p>
                      <p className="text-[11px] font-black font-mono">REF: {ri.item.reference}</p>
                      {ri.remarks && <p className="text-[11px] font-black mt-1 uppercase border-l-2 border-black pl-2">NOTE: {ri.remarks}</p>}
                      {ri.tailorModification && <p className="text-[11px] font-black mt-1 uppercase bg-black text-white px-2 inline-block">RETOUCHE: {ri.tailorModification}</p>}
                    </td>
                    <td className="py-3 text-right font-black text-base uppercase">{ri.item.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rental.remarks && (
            <div className="border-4 border-black p-4 mb-6 text-center">
              <p className="font-black uppercase mb-2 border-b-2 border-black inline-block text-sm">REMARQUES IMPORTANTES:</p>
              <p className="font-black text-base uppercase leading-tight">{rental.remarks}</p>
            </div>
          )}

          <div className="flex flex-col items-end mb-8 space-y-2 bg-white p-4 border-2 border-black rounded-lg">
              {rental.discount > 0 && (
                <div className="w-full flex justify-between text-[13px] font-black">
                  <span className="uppercase">REMISE:</span>
                  <span>-{rental.discount} DA</span>
                </div>
              )}
              <div className="w-full flex justify-between text-base font-black pt-2 border-t-2 border-black">
                <span className="uppercase">TOTAL LOCATION:</span>
                <span className="text-xl">{rental.totalAmount} DA</span>
              </div>
              <div className="w-full flex justify-between text-[13px] font-black pt-2 border-t border-dotted border-black">
                <span className="uppercase">VERSEMENT (AVANCE):</span>
                <span className="border-b-2 border-black">{rental.paidAmount} DA</span>
              </div>
              <div className="w-full flex justify-between text-2xl font-black pt-3 border-t-4 border-double border-black bg-black text-white px-2 py-1 mt-2">
                <span className="uppercase tracking-tighter">RESTE à PAYER:</span>
                <span>{balance} DA</span>
              </div>
          </div>

          <div className="flex justify-center items-center mb-10 px-4">
              <div className="flex flex-col items-center">
                  <QRCodeSVG value={qrValue} size={65} level="H" />
                  <p className="text-[8px] font-black mt-2 uppercase tracking-widest">AUTHENTIFIER LE BON</p>
              </div>
          </div>

          <div className="text-center border-t-2 border-dashed border-black pt-4">
            <p className="text-[11px] uppercase font-black mb-2">MERCI DE VOTRE CONFIANCE</p>
            <div className="space-y-2">
              <div className="text-[9px] font-black uppercase leading-tight">
                <p>L’avance n’est pas remboursable.</p>
                <p>Merci de retourner le costume avant 12h00 le jour du retour.</p>
                <p>Tout retard peut entraîner des frais supplémentaires.</p>
                <p>Le magasin n’est pas responsable en cas de perte du bon.</p>
              </div>
              <div className="text-[10px] font-bold leading-tight" dir="rtl">
                <p>المبلغ المدفوع مسبقاً (العربون) لا يُسترجع.</p>
                <p>يرجى إرجاع البدلة قبل الساعة 12:00 يوم الإرجاع.</p>
                <p>في حالة التأخير قد يتم فرض رسوم إضافية.</p>
                <p>المحل غير مسؤول عن ضياع الوصل.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 no-print flex justify-center gap-4">
          <button 
              onClick={handlePrint}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
          >
              IMPRIMER
          </button>
          <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200"
          >
              FERMER
          </button>
        </div>
      </div>
    </div>
  );
};

export default RentalReceipt;
