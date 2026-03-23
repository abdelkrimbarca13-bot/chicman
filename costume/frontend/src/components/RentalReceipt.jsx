import React from 'react';
import { format } from 'date-fns';
import { X, Printer } from 'lucide-react';

const RentalReceipt = ({ rental, onClose }) => {
  const guaranteeDocuments = {
    PASSPORT: 'Passeport',
    ID_CARD: 'Carte d\'identité',
    DRIVER_LICENSE: 'Permis de conduire'
  };

  const handlePrint = () => {
    const printContent = document.getElementById('receipt-content').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // To restore event listeners
  };

  const balance = rental.totalAmount - rental.paidAmount;
  const subtotal = rental.items.reduce((sum, ri) => sum + (ri.item.rentalPrice || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <div id="receipt-content" className="p-8 bg-white text-black font-serif">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page {
                size: A5;
                margin: 5mm;
              }
              .no-print { display: none !important; }
              body { 
                padding: 0; 
                margin: 0; 
                background: white;
              }
              #receipt-content { 
                padding: 5mm !important; 
                width: 100% !important;
                font-size: 10pt !important;
              }
              h1 { font-size: 24pt !important; }
              .text-4xl { font-size: 24pt !important; }
              .text-2xl { font-size: 16pt !important; }
              .text-lg { font-size: 12pt !important; }
              .p-8 { padding: 5mm !important; }
              .mb-8 { margin-bottom: 4mm !important; }
              .mb-6 { margin-bottom: 3mm !important; }
              table th, table td { padding: 4px !important; }
            }
          `}} />
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-widest border-b-4 border-black inline-block px-8 pb-2">CHIC MAN</h1>
            <p className="text-sm uppercase tracking-[0.5em] mt-2 font-bold">Luxury Rental Service</p>
          </div>

          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs uppercase font-bold tracking-widest mb-1">N° Bon</p>
              <p className="text-2xl font-black">#RENT-{rental.id.toString().padStart(5, '0')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase font-bold tracking-widest mb-1">Date d'édition</p>
              <p className="text-lg font-bold">{format(new Date(rental.createdAt), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-0 border-2 border-black mb-6">
            <div className="border-r-2 border-black p-4">
              <h3 className="font-black text-xs uppercase tracking-widest mb-4 border-b-2 border-black pb-1">Client</h3>
              <div className="space-y-1 text-sm">
                <p className="font-black text-lg uppercase">{rental.customer.firstName} {rental.customer.lastName}</p>
                <p className="font-bold">Tél: {rental.customer.phone}</p>
                <p className="text-xs">Garantie: <span className="font-black uppercase">{guaranteeDocuments[rental.guaranteeDocument] || 'N/S'}</span></p>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <h3 className="font-black text-xs uppercase tracking-widest mb-4 border-b-2 border-black pb-1">Période</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Du:</span>
                  <span className="font-black">{format(new Date(rental.startDate), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase">Au:</span>
                  <span className="font-black">{format(new Date(rental.expectedReturn), 'dd/MM/yyyy')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-2 border-black">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-black bg-gray-100">
                  <th className="p-3 text-xs uppercase font-black">Article</th>
                  <th className="p-3 text-xs uppercase font-black text-center">Taille</th>
                  <th className="p-3 text-xs uppercase font-black text-right">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {rental.items.map((ri, idx) => (
                  <tr key={idx}>
                    <td className="p-3">
                      <p className="font-bold text-sm uppercase">{ri.item.name}</p>
                      <p className="text-[10px] text-gray-600 font-mono">{ri.item.reference} - {ri.item.color}</p>
                      {ri.remarks && <p className="text-[10px] italic font-bold text-indigo-700 mt-1">Note: {ri.remarks}</p>}
                      {ri.tailorModification && <p className="text-[10px] font-black text-indigo-900 mt-1 uppercase bg-indigo-50 inline-block px-1">Modif. Tailleur: {ri.tailorModification}</p>}
                    </td>
                    <td className="p-3 text-center font-bold text-sm uppercase">{ri.item.size}</td>
                    <td className="p-3 text-right font-bold text-sm">{ri.item.rentalPrice || 0} DA</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rental.remarks && (
            <div className="border-2 border-black p-4 mb-6 italic text-sm">
              <p className="font-black uppercase text-[10px] not-italic mb-1 border-b border-black inline-block">Remarques Générales:</p>
              <p>{rental.remarks}</p>
            </div>
          )}

          <div className="flex justify-end mb-8">
            <div className="w-64 border-2 border-black divide-y-2 divide-black">
              <div className="flex justify-between p-2 text-sm">
                <span className="font-bold">Sous-total</span>
                <span>{subtotal} DA</span>
              </div>
              <div className="flex justify-between p-2 text-sm font-bold text-red-600">
                <span>Remise</span>
                <span>-{rental.discount || 0} DA</span>
              </div>
              <div className="flex justify-between p-3 bg-black text-white">
                <span className="font-black uppercase tracking-wider">Total Net</span>
                <span className="font-black text-xl">{rental.totalAmount} DA</span>
              </div>
              <div className="flex justify-between p-2 text-sm font-bold">
                <span>Payé (Acompte)</span>
                <span className="text-green-700">{rental.paidAmount} DA</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-100 font-black text-lg">
                <span>RESTE</span>
                <span className={balance > 0 ? "text-red-600" : "text-green-700"}>
                  {balance} DA
                </span>
              </div>
            </div>
          </div>



          <div className="text-center border-t-2 border-dashed border-black pt-4">
            <p className="text-[10px] uppercase font-bold tracking-widest">Merci de votre confiance - CHIC MAN Luxury Rental</p>
            <p className="text-[9px] text-gray-500 mt-1">Les articles doivent être retournés dans leur état d'origine. Tout dommage sera facturé.</p>
          </div>

          <div className="mt-10 no-print flex justify-center">
            <button 
                onClick={onClose}
                className="px-8 py-3 bg-zinc-100 text-zinc-600 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200"
            >
                QUITTER SANS IMPRIMER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentalReceipt;
