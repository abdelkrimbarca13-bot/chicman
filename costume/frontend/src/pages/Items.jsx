import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Search, Edit2, Trash2, QrCode, History, X, Printer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Items = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [currentItem, setCurrentItem] = useState({
    name: '', model: '', reference: '', type: 'pantalon', size: '', color: '', quantity: 1, rentalPrice: 0
  });

  const fetchItems = () => {
    api.get('/items').then(res => {
      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    }).catch(err => {
      console.error(err);
      alert('Erreur lors de la récupération des articles: ' + (err.response?.data?.error || err.message));
      setItems([]);
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleScanInput = async (val) => {
    setSearchTerm(val);
    const match = items.find(i => i.reference === val);
    if (match) {
        showHistory(match.id);
    }
  };

  const showHistory = async (id) => {
    try {
        const res = await api.get(`/items/${id}`);
        setHistoryModal(res.data);
    } catch (err) {
        alert('Erreur lors du chargement de l\'historique');
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await api.put(`/items/${itemId}/status`, { status: newStatus });
      fetchItems();
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const printQR = () => {
    const windowContent = document.getElementById('qr-to-print').innerHTML;
    const printWin = window.open('', '', 'width=400,height=600');
    printWin.document.open();
    printWin.document.write(`
      <html>
        <head>
          <title>Ticket CHIC MEN - ${qrModal.reference}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Poppins', sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              height: 100vh; 
              margin: 0;
              text-align: center;
            }
            .ticket {
              border: 2px solid #000;
              padding: 20px;
              width: 250px;
            }
            .brand { 
              font-family: 'Cinzel', serif; 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            .sub-brand {
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-bottom: 20px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
            }
            .qr-container { margin: 20px 0; }
            .item-name { 
              font-family: 'Cinzel', serif; 
              font-weight: bold; 
              font-size: 16px; 
              margin: 10px 0 5px; 
            }
            .ref { 
              font-family: monospace; 
              font-weight: bold; 
              font-size: 14px; 
              color: #444;
            }
            .details {
              font-size: 10px;
              text-transform: uppercase;
              color: #666;
              margin-top: 10px;
              display: flex;
              justify-content: center;
              gap: 5px;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="brand">CHIC MEN</div>
            <div class="sub-brand">Luxury Rental</div>
            <div class="qr-container">${windowContent}</div>
            <div class="item-name">${qrModal.name}</div>
            <div class="ref">${qrModal.reference}</div>
            <div class="details">
              <span>${qrModal.type}</span> | 
              <span>Taille: ${qrModal.size}</span> | 
              <span>${qrModal.color}</span>
            </div>
          </div>
          <script>
            setTimeout(() => { 
              window.print(); 
              window.close(); 
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentItem.id) {
        await api.put(`/items/${currentItem.id}`, currentItem);
        setIsModalOpen(false);
      } else {
        const data = { ...currentItem };
        if (!data.reference) data.reference = 'ART-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const res = await api.post('/items', data);
        setIsModalOpen(false);
        // Ouvrir automatiquement le modal QR pour imprimer le ticket
        setQrModal(res.data);
      }
      setCurrentItem({ name: '', model: '', reference: '', type: 'pantalon', size: '', color: '', quantity: 1, rentalPrice: 0 });
      fetchItems();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement');
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-wider text-indigo-900 border-b-2 border-amber-500 w-fit pb-2">Gestion du Stock</h1>
        <button 
          onClick={() => { setCurrentItem({ name: '', model: '', reference: '', type: 'Veste', size: '', color: '', quantity: 1, rentalPrice: 0 }); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 text-sm md:text-base"
        >
          <Plus size={20} className="mr-2" /> Ajouter un article
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Scannez ou recherchez..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            value={searchTerm}
            autoFocus
            onChange={(e) => handleScanInput(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-auto px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-gray-700"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tous les statuts</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="RENTED">Loué</option>
          <option value="CLEANING">Nettoyage</option>
          <option value="REPAIRING">Réparation</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 uppercase text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3 whitespace-nowrap">Code / Réf</th>
                <th className="px-6 py-3 whitespace-nowrap">Article / Modèle</th>
                <th className="px-6 py-3 whitespace-nowrap">Type</th>
                <th className="px-6 py-3 whitespace-nowrap">Taille / Col</th>
                <th className="px-6 py-3 whitespace-nowrap">Prix Loc.</th>
                <th className="px-6 py-3 whitespace-nowrap">Statut</th>
                <th className="px-6 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono text-sm font-bold text-indigo-700">{item.reference}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.model}</div>
                </td>
                <td className="px-6 py-4 capitalize">{item.type}</td>
                <td className="px-6 py-4 text-sm text-gray-500 font-semibold">{item.size} / {item.color}</td>
                <td className="px-6 py-4 font-bold text-gray-900">{item.rentalPrice} DA</td>
                <td className="px-6 py-4">
                  <select 
                    value={item.status} 
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className={`text-xs font-bold px-2 py-1 rounded border-0 cursor-pointer ${
                      item.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' :
                      item.status === 'RENTED' ? 'bg-orange-100 text-orange-800' :
                      item.status === 'CLEANING' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    <option value="AVAILABLE">Disponible</option>
                    <option value="RENTED">Loué</option>
                    <option value="CLEANING">Nettoyage</option>
                    <option value="REPAIRING">Réparation</option>
                  </select>
                </td>
                <td className="px-6 py-4 flex space-x-3">
                  <button onClick={() => setQrModal(item)} className="text-gray-600 hover:text-black" title="Générer QR"><QrCode size={18}/></button>
                  <button onClick={() => showHistory(item.id)} className="text-blue-600 hover:text-blue-900" title="Historique"><History size={18}/></button>
                  <button onClick={() => { setCurrentItem(item); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900" title="Modifier"><Edit2 size={18}/></button>
                  <button onClick={async () => { 
                    if(confirm('Supprimer cet article ? Cela supprimera également son historique de location.')) { 
                      try {
                        await api.delete(`/items/${item.id}`); 
                        fetchItems(); 
                      } catch (err) {
                        alert('Erreur lors de la suppression : ' + (err.response?.data?.error || err.message));
                      }
                    } 
                  }} className="text-red-600 hover:text-red-900" title="Supprimer"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{currentItem.id ? 'Modifier' : 'Ajouter'} l'article</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nom (ex: Blazer Zara)" className="w-full p-2 border rounded" value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} required />
                <input type="text" placeholder="Modèle (ex: Collection 2023)" className="w-full p-2 border rounded" value={currentItem.model} onChange={e => setCurrentItem({...currentItem, model: e.target.value})} />
              </div>
              <input type="text" placeholder="Référence (laisser vide pour auto-générer)" className="w-full p-2 border rounded" value={currentItem.reference} onChange={e => setCurrentItem({...currentItem, reference: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-2 border rounded" value={currentItem.type} onChange={e => setCurrentItem({...currentItem, type: e.target.value})}>
                  <option value="Veste">Veste</option>
                  <option value="Chemise">Chemise</option>
                  <option value="Gilet">Gilet</option>
                  <option value="Pantalon">Pantalon</option>
                  <option value="Chaussures">Chaussures</option>
                  <option value="Karakou">Karakou</option>
                  <option value="Djabadour">Djabadour</option>
                  <option value="Ceinture">Ceinture</option>
                  <option value="Gilet accessoire">Gilet accessoire</option>
                  <option value="Cravate">Cravate</option>
                </select>
                <input type="number" placeholder="Prix Location (DA)" className="w-full p-2 border rounded" value={currentItem.rentalPrice} onChange={e => setCurrentItem({...currentItem, rentalPrice: parseFloat(e.target.value)})} required />
              </div>
              <div className="flex gap-4">
                <input type="text" placeholder="Taille" className="w-full p-2 border rounded" value={currentItem.size} onChange={e => setCurrentItem({...currentItem, size: e.target.value})} required />
                <input type="text" placeholder="Couleur" className="w-full p-2 border rounded" value={currentItem.color} onChange={e => setCurrentItem({...currentItem, color: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-semibold">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden border border-amber-200">
            <div className="bg-black text-amber-400 py-4 text-center border-b-2 border-amber-400">
                <h3 className="font-['Cinzel'] text-xl tracking-widest font-bold">CHIC MEN</h3>
                <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">Luxury Rental Service</p>
            </div>
            
            <div className="p-6 flex flex-col items-center">
                <div id="qr-to-print" className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-lg mb-4">
                    <QRCodeSVG value={qrModal.reference} size={160} level="H" />
                </div>
                
                <div className="w-full text-center space-y-1 mb-6">
                    <p className="font-['Cinzel'] font-bold text-lg text-gray-900 leading-tight">{qrModal.name}</p>
                    <p className="font-mono text-sm font-bold text-amber-600 tracking-wider">{qrModal.reference}</p>
                    <div className="flex justify-center gap-2 text-[10px] uppercase font-bold text-gray-500 pt-2 border-t border-gray-100">
                        <span>{qrModal.type}</span>
                        <span>•</span>
                        <span>Taille: {qrModal.size}</span>
                        <span>•</span>
                        <span>{qrModal.color}</span>
                    </div>
                </div>

                <div className="flex gap-3 w-full">
                    <button 
                        onClick={() => setQrModal(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={printQR}
                        className="flex-1 flex items-center justify-center bg-black text-amber-400 px-4 py-2 rounded-lg font-bold hover:bg-gray-900 transition-all shadow-lg"
                    >
                        <Printer size={18} className="mr-2"/> Imprimer
                    </button>
                </div>
            </div>
            
            <div className="bg-gray-50 py-2 text-center">
                <p className="text-[9px] text-gray-400 italic">Scannez pour identifier cet article</p>
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                    <h2 className="text-2xl font-bold">{historyModal.name}</h2>
                    <p className="text-gray-500 font-mono">{historyModal.reference} - {historyModal.model}</p>
                </div>
                <button onClick={() => setHistoryModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24}/></button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100">
                    <p className="text-sm text-blue-600 font-semibold uppercase">Total Locations</p>
                    <p className="text-3xl font-bold text-blue-900">{historyModal.rentals.length}</p>
                </div>
                <div className={`p-4 rounded-lg text-center border ${
                    historyModal.rentals.some(r => r.rental.status === 'ONGOING') 
                    ? 'bg-orange-50 border-orange-100' 
                    : 'bg-green-50 border-green-100'
                }`}>
                    <p className={`text-sm font-semibold uppercase ${
                        historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'text-orange-600' : 'text-green-600'
                    }`}>Statut Actuel</p>
                    <p className={`text-xl font-bold mt-1 ${
                        historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'text-orange-900' : 'text-green-900'
                    }`}>
                        {historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'OCCUPÉ' : 'DISPONIBLE'}
                    </p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold text-lg mb-4 text-indigo-900 flex items-center">
                    <History size={20} className="mr-2"/> Dates d'occupation (Calendrier)
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    {historyModal.rentals.filter(r => new Date(r.rental.expectedReturn) >= new Date()).length > 0 ? (
                        <div className="space-y-3">
                            {historyModal.rentals
                                .filter(r => new Date(r.rental.expectedReturn) >= new Date())
                                .sort((a, b) => new Date(a.rental.startDate) - new Date(b.rental.startDate))
                                .map((r, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border-l-4 border-indigo-500">
                                        <div>
                                            <p className="font-bold text-indigo-900">Du {new Date(r.rental.startDate).toLocaleDateString()} au {new Date(r.rental.expectedReturn).toLocaleDateString()}</p>
                                            <p className="text-xs text-gray-500">Client: {r.rental.customer.firstName} {r.rental.customer.lastName}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            new Date(r.rental.startDate) <= new Date() ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {new Date(r.rental.startDate) <= new Date() ? 'En cours' : 'À venir'}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-gray-500 italic">Aucune location future prévue. L'article est disponible.</p>
                    )}
                </div>
            </div>

            <h3 className="font-bold text-lg mb-4">Historique Complet</h3>
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs font-bold uppercase text-gray-500">
                    <tr>
                        <th className="px-4 py-2">Client</th>
                        <th className="px-4 py-2">Date Début</th>
                        <th className="px-4 py-2">Retour Prévu</th>
                        <th className="px-4 py-2">Statut</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {historyModal.rentals.map((r, i) => (
                        <tr key={i} className="text-sm">
                            <td className="px-4 py-3 font-medium">
                                {r.rental.customer.firstName} {r.rental.customer.lastName}
                                <div className="text-xs text-gray-400">{r.rental.customer.phone}</div>
                            </td>
                            <td className="px-4 py-3">{new Date(r.rental.startDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3">{new Date(r.rental.expectedReturn).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.rental.status === 'RETURNED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {r.rental.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
