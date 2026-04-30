import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Edit2, Trash2, QrCode, History, X, Printer, AlertCircle, CheckCircle2, Download, Scissors } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const Items = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('AVAILABLE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [qrModal, setQrModal] = useState(null);
  const [currentItem, setCurrentItem] = useState({
    name: '', model: '', reference: '', type: 'pantalon', size: '', color: '', quantity: 1, rentalPrice: 0, ensembleId: ''
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

  const handleExcelImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Mapper les colonnes Excel vers le format attendu par la DB
        const itemsToImport = data.map(row => ({
          name: row['Nom'] || row['Modèle'] || 'Sans nom',
          model: row['Modèle'] || '',
          type: row['Type'] || 'Autre',
          size: row['Taille']?.toString() || '',
          color: row['Couleur'] || '',
          rentalPrice: parseFloat(row['Prix']) || 0,
          reference: row['Référence']?.toString() || 'ART-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          quantity: 1,
          status: 'AVAILABLE'
        }));

        if (confirm(`Importer/Mettre à jour ${itemsToImport.length} articles ?`)) {
          await api.post('/items/bulk', itemsToImport);
          alert('Importation réussie !');
          fetchItems();
        }
      } catch (err) {
        alert('Erreur lors de l\'importation : ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const templateData = [{
      'Référence': '',
      'Nom': '',
      'Modèle': '',
      'Type': '',
      'Taille': '',
      'Couleur': '',
      'Prix': ''
    }];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modèle Importation");
    XLSX.writeFile(wb, "Modele_Import_Articles.xlsx");
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
        alert('Erreur lors du chargement de l\'historique : ' + (err.response?.data?.error || err.message));
    }
  };

  const handleStatusChange = async (itemId, newStatus) => {
    try {
      await api.put(`/items/${itemId}/status`, { status: newStatus });
      fetchItems();
    } catch (err) {
      alert('Erreur lors de la mise à jour du statut : ' + (err.response?.data?.error || err.message));
    }
  };

  const printQR = () => {
    const windowContent = document.getElementById('qr-to-print').innerHTML;
    const printWin = window.open('', '', 'width=400,height=600');
    printWin.document.open();
    printWin.document.write(`
      <html>
        <head>
          <title>Ticket CHIC MAN - ${qrModal.reference}</title>
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
            <div class="brand">CHIC MAN</div>
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
      alert('Erreur lors de l\'enregistrement : ' + (err.response?.data?.error || err.message));
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
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Gestion du Stock</h1>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {user?.role === 'ADMIN' && (
              <>
                <label className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-green-700 shadow-lg cursor-pointer transition-all border border-green-500/20 font-bold text-sm">
                    <Plus size={18} className="mr-2" /> Import Excel
                    <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                </label>
                <button 
                    onClick={downloadTemplate}
                    className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-800 text-gold px-4 py-2 rounded-lg flex items-center justify-center hover:bg-zinc-700 shadow-lg cursor-pointer transition-all border border-gold/20 font-bold text-sm"
                >
                    <Download size={18} className="mr-2" /> Modèle Excel
                </button>
              </>
            )}
            <button 
                onClick={() => { setCurrentItem({ name: '', model: '', reference: '', type: 'Veste', size: '', color: '', quantity: 1, rentalPrice: 0 }); setIsModalOpen(true); }}
                className="w-full sm:w-auto bg-gold text-rich-black px-4 py-2 rounded-lg flex items-center justify-center hover:bg-light-gold shadow-lg shadow-gold/10 transition-all active:scale-95 text-sm font-bold"
            >
                <Plus size={20} className="mr-2" /> Ajouter un article
            </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Scannez ou recherchez..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-gold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            value={searchTerm}
            autoFocus
            onChange={(e) => handleScanInput(e.target.value)}
          />
        </div>
        <select 
          className="w-full md:w-auto px-4 py-2 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-gold bg-white dark:bg-zinc-900 font-bold text-zinc-300"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">Tous les statuts</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="RENTED">Loué</option>
          <option value="CLEANING">Nettoyage</option>
          <option value="REPAIRING">Réparation</option>
          <option value="PENDING_REPAIR">Attente Réparation</option>
        </select>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden border border-gold/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Code / Réf</th>
                <th className="px-6 py-4 whitespace-nowrap">Article / Modèle</th>
                <th className="px-6 py-4 whitespace-nowrap">Type</th>
                <th className="px-6 py-4 whitespace-nowrap">Taille / Col</th>
                <th className="px-6 py-4 whitespace-nowrap">Prix Loc.</th>
                <th className="px-6 py-4 whitespace-nowrap">Statut</th>
                <th className="px-6 py-4 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredItems.map(item => (
              <tr 
                key={item.id} 
                className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                onClick={(e) => {
                  // Empêcher l'ouverture si on clique sur un bouton ou un select
                  if (e.target.closest('button') || e.target.closest('select')) return;
                  showHistory(item.id);
                }}
              >
                <td className="px-6 py-4 font-mono text-sm font-bold text-gold group-hover:text-light-gold transition-colors">{item.reference}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900 dark:text-white group-hover:text-gold transition-colors">{item.name}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-tighter">{item.model}</div>
                </td>
                <td className="px-6 py-4 capitalize font-medium">{item.type}</td>
                <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-bold">{item.size} / {item.color}</td>
                <td className="px-6 py-4 font-black text-gold">{item.rentalPrice} DA</td>
                <td className="px-6 py-4">
                  <select 
                    value={item.status} 
                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border cursor-pointer transition-all ${
                      item.status === 'AVAILABLE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900/50' :
                      item.status === 'RENTED' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-900/50' :
                      item.status === 'CLEANING' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50' :
                      item.status === 'PENDING_REPAIR' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-900/50' :
                      'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900/50'
                    }`}
                  >
                    <option value="AVAILABLE" className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Disponible</option>
                    <option value="RENTED" className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Loué</option>
                    <option value="CLEANING" className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Nettoyage</option>
                    <option value="REPAIRING" className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Réparation</option>
                    <option value="PENDING_REPAIR" className="bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">Attente Réparation</option>
                  </select>
                </td>
                <td className="px-6 py-4 flex space-x-3">
                  <button onClick={() => setQrModal(item)} className="text-zinc-400 hover:text-gold" title="Générer QR"><QrCode size={18}/></button>
                  <button onClick={() => showHistory(item.id)} className="text-blue-400 hover:text-blue-300" title="Historique"><History size={18}/></button>
                  <button onClick={() => { setCurrentItem(item); setIsModalOpen(true); }} className="text-gold hover:text-light-gold" title="Modifier"><Edit2 size={18}/></button>
                  {user?.role === 'ADMIN' && (
                    <button onClick={async () => { 
                      if(confirm('Supprimer cet article ? Cela supprimera également son historique de location.')) { 
                        try {
                          await api.delete(`/items/${item.id}`); 
                          fetchItems(); 
                        } catch (err) {
                          alert('Erreur lors de la suppression : ' + (err.response?.data?.error || err.message));
                        }
                      } 
                    }} className="text-red-400 hover:text-red-300" title="Supprimer"><Trash2 size={18}/></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 w-full max-w-md border border-gold/20 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-gold font-luxury tracking-widest uppercase border-b border-gold/10 pb-2">{currentItem.id ? 'Modifier' : 'Ajouter'} l'article</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Nom (ex: Blazer Zara)" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.name} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} required />
                <input type="text" placeholder="Modèle (ex: Collection 2023)" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.model} onChange={e => setCurrentItem({...currentItem, model: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Référence (laisser vide pour auto-générer)" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.reference} onChange={e => setCurrentItem({...currentItem, reference: e.target.value})} />
                <input type="text" placeholder="ID Ensemble (ex: COSTUME-01)" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.ensembleId || ''} onChange={e => setCurrentItem({...currentItem, ensembleId: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.type} onChange={e => setCurrentItem({...currentItem, type: e.target.value})}>
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
                <input type="number" placeholder="Prix Location (DA)" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold font-bold" value={currentItem.rentalPrice} onChange={e => setCurrentItem({...currentItem, rentalPrice: parseFloat(e.target.value)})} required />
              </div>
              <div className="flex gap-4">
                <input type="text" placeholder="Taille" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.size} onChange={e => setCurrentItem({...currentItem, size: e.target.value})} required />
                <input type="text" placeholder="Couleur" className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold" value={currentItem.color} onChange={e => setCurrentItem({...currentItem, color: e.target.value})} required />
              </div>
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-400 font-semibold hover:text-zinc-900 dark:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-gold text-rich-black rounded font-bold hover:bg-light-gold transition-all active:scale-95 shadow-lg shadow-gold/10">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-80 overflow-hidden border border-gold">
            <div className="bg-rich-black text-gold py-4 text-center border-b-2 border-gold">
                <h3 className="font-luxury text-xl tracking-widest font-bold uppercase">CHIC MAN</h3>
                <p className="text-[10px] tracking-[0.3em] uppercase opacity-80">Luxury Rental Service</p>
            </div>
            
            <div className="p-6 flex flex-col items-center">
                <div id="qr-to-print" className="p-4 bg-white border-2 border-dashed border-zinc-200 rounded-lg mb-4 shadow-inner">
                    <QRCodeSVG value={qrModal.reference} size={160} level="H" />
                </div>
                
                <div className="w-full text-center space-y-1 mb-6">
                    <p className="font-luxury font-bold text-lg text-rich-black leading-tight uppercase">{qrModal.name}</p>
                    <p className="font-mono text-sm font-bold text-gold tracking-wider">{qrModal.reference}</p>
                    <div className="flex justify-center gap-2 text-[10px] uppercase font-bold text-zinc-500 pt-2 border-t border-zinc-100">
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
                        className="flex-1 py-2 text-zinc-500 font-bold text-xs uppercase hover:bg-zinc-50 rounded transition-colors"
                    >
                        Fermer
                    </button>
                    <button 
                        onClick={printQR}
                        className="flex-1 py-2 bg-rich-black text-gold font-bold text-xs uppercase rounded hover:bg-zinc-100 dark:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Printer size={14} /> Imprimer
                    </button>
                </div>
            </div>
            
            <div className="bg-zinc-50 py-2 text-center">
                <p className="text-[9px] text-zinc-400 italic">Scannez pour identifier cet article</p>
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gold/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gold/10 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gold font-luxury tracking-widest uppercase">{historyModal.name}</h2>
                    <p className="text-zinc-500 font-mono text-xs">{historyModal.reference} - {historyModal.model}</p>
                </div>
                <button onClick={() => setHistoryModal(null)} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors"><X size={24}/></button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-lg text-center border border-zinc-700">
                        <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Total Locations</p>
                        <p className="text-3xl font-bold text-gold">{historyModal.rentals.length}</p>
                    </div>
                    <div className={`p-4 rounded-lg text-center border ${
                        historyModal.rentals.some(r => r.rental.status === 'ONGOING') 
                        ? 'bg-orange-900/20 border-orange-900/50' 
                        : 'bg-green-900/20 border-green-900/50'
                    }`}>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${
                            historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'text-orange-400' : 'text-green-400'
                        }`}>Statut Actuel</p>
                        <p className={`text-xl font-bold mt-1 ${
                            historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'text-orange-400' : 'text-green-400'
                        }`}>
                            {historyModal.rentals.some(r => r.rental.status === 'ONGOING') ? 'OCCUPÉ' : 'DISPONIBLE'}
                        </p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-4 text-gold flex items-center font-luxury uppercase tracking-widest">
                        <History size={20} className="mr-2"/> Dates d'occupation
                    </h3>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-700">
                        {historyModal.rentals.filter(r => new Date(r.rental.expectedReturn) >= new Date()).length > 0 ? (
                            <div className="space-y-3">
                                {historyModal.rentals
                                    .filter(r => new Date(r.rental.expectedReturn) >= new Date())
                                    .sort((a, b) => new Date(a.rental.startDate) - new Date(b.rental.startDate))
                                    .map((r, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg border-l-4 border-gold shadow-md">
                                            <div className="flex-1">
                                                <p className="font-bold text-zinc-900 dark:text-white text-sm">Du {new Date(r.rental.startDate).toLocaleDateString()} au {new Date(r.rental.expectedReturn).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Client: {r.rental.customer.firstName} {r.rental.customer.lastName}</p>
                                                {r.tailorModification && (
                                                    <div className="flex items-center gap-1.5 text-[10px] text-gold font-bold bg-gold/10 px-2 py-1 rounded border border-gold/20 w-fit">
                                                        <Scissors size={12} className="text-gold" />
                                                        <span>Tailleur: {r.tailorModification}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                new Date(r.rental.startDate) <= new Date() ? 'bg-orange-900/30 text-orange-400' : 'bg-blue-900/30 text-blue-400'
                                            }`}>
                                                {new Date(r.rental.startDate) <= new Date() ? 'En cours' : 'À venir'}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        ) : (
                            <p className="text-center py-4 text-zinc-500 italic text-sm">Aucune location future prévue. L'article est disponible.</p>
                        )}
                    </div>
                </div>

                <h3 className="font-bold text-lg mb-4 text-gold font-luxury uppercase tracking-widest">Historique Complet</h3>
                <table className="w-full text-left">
                    <thead className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold uppercase text-zinc-500">
                        <tr>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3 text-center">Dates</th>
                            <th className="px-4 py-3 text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {historyModal.rentals.map((r, i) => (
                            <tr key={i} className="text-xs hover:bg-zinc-100 dark:bg-zinc-800/50 transition-colors">
                                <td className="px-4 py-4 font-medium text-zinc-900 dark:text-white">
                                    {r.rental.customer.firstName} {r.rental.customer.lastName}
                                    <div className="text-[10px] text-zinc-500 font-mono mb-1">{r.rental.customer.phone}</div>
                                    {r.tailorModification && (
                                        <div className="flex items-center gap-1 text-[9px] text-gold font-bold bg-gold/5 px-1.5 py-0.5 rounded border border-gold/10 w-fit">
                                            <Scissors size={10} /> {r.tailorModification}
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4 text-center text-zinc-400">
                                    {new Date(r.rental.startDate).toLocaleDateString()} <br/>
                                    <span className="text-[10px]">au</span> <br/>
                                    {new Date(r.rental.expectedReturn).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        r.rental.status === 'RETURNED' ? 'bg-green-900/30 text-green-400' : 'bg-blue-900/30 text-blue-400'
                                    }`}>
                                        {r.rental.status === 'RETURNED' ? 'Rendu' : 'En cours'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Items;
