import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Trash2, Smartphone, DollarSign, FileText, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import SaleReceipt from '../components/SaleReceipt';

const Sales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState(null);
  const [scanTerm, setScanTerm] = useState('');
  
  const [newSale, setNewSale] = useState({
    customerName: '',
    customerPhone: '',
    items: [], // [{ id, price, name, reference, type, color, size }]
    totalAmount: 0,
    remarks: ''
  });

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [sRes, iRes] = await Promise.all([
        api.get('/sales'),
        api.get('/items') // Assuming we fetch available items to sell
      ]);
      setSales(Array.isArray(sRes.data) ? sRes.data : []);
      // Filter out only available items for selling
      const availableItems = (Array.isArray(iRes.data) ? iRes.data : []).filter(item => item.status === 'AVAILABLE');
      setItems(availableItems);
    } catch (err) {
      console.error('Erreur lors du chargement des données', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const total = newSale.items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
    if (newSale.totalAmount !== total) {
      setNewSale(prev => ({ ...prev, totalAmount: total }));
    }
  }, [newSale.items]);

  const addItem = (item) => {
    if (!newSale.items.some(i => i.id === item.id)) {
        setNewSale(prev => ({
            ...prev,
            items: [...prev.items, { 
              id: item.id, 
              price: item.rentalPrice * 2 || 0, // Default selling price example (can be modified by user)
              name: item.name,
              reference: item.reference,
              type: item.type,
              color: item.color,
              size: item.size
            }]
        }));
    }
    setScanTerm('');
  };

  const handleScan = (val) => {
    setScanTerm(val);
    const item = items.find(i => i.reference.toLowerCase() === val.toLowerCase());
    if (item) {
        addItem(item);
    }
  };

  const removeItem = (id) => {
    setNewSale(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItemPrice = (id, price) => {
    setNewSale(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, price } : item)
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newSale.items.length === 0) {
        alert('Veuillez sélectionner au moins un article');
        return;
    }
    try {
      const payload = {
        ...newSale,
        items: newSale.items.map(item => ({ 
          itemId: parseInt(item.id), 
          price: parseFloat(item.price)
        }))
      };

      await api.post('/sales', payload);
      setIsModalOpen(false);
      setNewSale({ 
        customerName: '', 
        customerPhone: '', 
        items: [], 
        totalAmount: 0,
        remarks: ''
      });
      fetchData();
      alert('Vente effectuée avec succès !');
    } catch (err) {
      if (err.response?.status !== 401) {
        alert(err.response?.data?.message || 'Erreur lors de la vente');
      }
    }
  };

  const filteredSales = sales.filter(sale => {
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const saleDate = new Date(sale.createdAt);
      saleDate.setHours(0,0,0,0);
      
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0,0,0,0);
        if (saleDate < start) matchesDate = false;
      }
      
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23,59,59,999);
        if (saleDate > end) matchesDate = false;
      }
    }

    let matchesCustomer = !filterCustomer;
    if (filterCustomer) {
      const searchTerm = filterCustomer.toLowerCase();
      matchesCustomer = sale.customerName.toLowerCase().includes(searchTerm) || 
                        sale.customerPhone.includes(searchTerm) ||
                        sale.id.toString().includes(searchTerm);
    }
    
    return matchesDate && matchesCustomer;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-widest text-gold uppercase border-b-2 border-gold/30 pb-2 flex items-center">
            <ShoppingCart className="mr-3" /> Gestion des Ventes
        </h1>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gold text-rich-black px-6 py-2 rounded-lg flex items-center justify-center hover:bg-light-gold shadow-lg shadow-gold/10 w-full sm:w-auto text-sm font-bold transition-all active:scale-95"
        >
            <Plus size={20} className="mr-2" /> Nouvelle Vente
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl border border-gold/10 mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-gold/60 mb-2 tracking-widest">Filtrer par Date</label>
            <div className="flex items-center gap-3">
                <input 
                type="date" 
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                />
                <span className="text-zinc-600 font-bold">au</span>
                <input 
                type="date" 
                className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                />
            </div>
        </div>
        <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-gold/60 mb-2 tracking-widest">Recherche</label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                <input 
                type="text" 
                placeholder="Client, Téléphone, ou ID..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                />
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gold/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Date & ID</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Client</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Articles Vendus</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Total</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredSales.map(sale => (
              <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900 dark:text-white text-base uppercase tracking-tighter">#{sale.id.toString().padStart(5, '0')}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-black text-gold uppercase truncate">{sale.customerName}</div>
                  <div className="text-xs text-zinc-500 dark:text-gold font-mono tracking-tight font-bold">{sale.customerPhone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1 text-[11px] font-bold">
                    {sale.items.map((si, idx) => (
                      <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 px-2 py-1 rounded border border-zinc-200 dark:border-gold/20 shadow-sm flex justify-between">
                        <span>{si.itemName} <span className="text-zinc-400 font-mono">({si.itemRef})</span></span>
                        <span className="text-gold">{si.price} DA</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                    <span className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                        {sale.totalAmount} DA
                    </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => setReceiptModal(sale)}
                    className="text-zinc-500 dark:text-zinc-300 hover:text-gold flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                  >
                    <FileText size={16} className="mr-1"/> Reçu
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="text-2xl font-black text-gold font-luxury tracking-widest uppercase">Nouvelle Vente</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gold border-b border-zinc-800 pb-2 tracking-widest font-luxury">Client</h3>
                    <input type="text" placeholder="Nom Complet" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white font-bold" value={newSale.customerName} onChange={e => setNewSale({...newSale, customerName: e.target.value})} required />
                    <input type="text" placeholder="Téléphone" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white font-bold" value={newSale.customerPhone} onChange={e => setNewSale({...newSale, customerPhone: e.target.value})} required />
                    <textarea 
                      placeholder="Remarques..."
                      className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white min-h-[80px]"
                      value={newSale.remarks}
                      onChange={e => setNewSale({...newSale, remarks: e.target.value})}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gold border-b border-zinc-800 pb-2 tracking-widest font-luxury">Articles</h3>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-2.5 text-gold" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scannez référence..." 
                            className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-zinc-900 dark:text-white font-bold"
                            value={scanTerm}
                            onChange={(e) => handleScan(e.target.value)}
                            autoFocus
                        />
                        {scanTerm.length >= 2 && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-y-auto max-h-[250px]">
                            {items.filter(item => 
                                item.name.toLowerCase().includes(scanTerm.toLowerCase()) || 
                                item.reference.toLowerCase().includes(scanTerm.toLowerCase())
                            ).map(item => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => addItem(item)}
                                    className="w-full p-3 text-left border-b border-zinc-700 last:border-0 hover:bg-zinc-700 transition-colors"
                                >
                                    <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                        {item.name}
                                        <span className="text-[10px] bg-gold/10 text-gold px-1.5 py-0.5 rounded border border-gold/20 uppercase font-black">{item.reference}</span>
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-bold uppercase mt-1 flex gap-3">
                                        <span>{item.size}</span>
                                        <span>{item.color}</span>
                                    </div>
                                </button>
                            ))}
                          </div>
                        )}
                    </div>

                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {newSale.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-700">
                          <div>
                            <span className="font-bold text-zinc-900 dark:text-white text-sm block">{item.name} <span className="text-[10px] text-zinc-500 font-mono">({item.reference})</span></span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                                <input 
                                    type="number"
                                    className="w-24 pl-2 pr-6 py-1 text-sm bg-white dark:bg-zinc-900 border border-zinc-700 rounded font-bold text-gold text-right outline-none focus:ring-1 focus:ring-gold"
                                    value={item.price}
                                    onChange={(e) => updateItemPrice(item.id, e.target.value)}
                                    required
                                />
                                <span className="absolute right-2 top-1.5 text-xs text-zinc-500 font-bold">DA</span>
                            </div>
                            <button type="button" onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {newSale.items.length === 0 && (
                          <div className="text-center py-6 text-zinc-500 text-sm font-bold uppercase tracking-widest border-2 border-dashed border-zinc-700 rounded-xl">
                              Aucun article sélectionné
                          </div>
                      )}
                    </div>

                    <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl border border-zinc-700 flex justify-between items-center shadow-inner">
                        <span className="font-black uppercase tracking-widest text-zinc-500">TOTAL A PAYER</span>
                        <span className="text-2xl font-black text-gold">{newSale.totalAmount} DA</span>
                    </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 border border-zinc-700 text-zinc-400 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-100 dark:bg-zinc-800 transition-colors">ANNULER</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gold text-rich-black rounded-xl font-black uppercase tracking-widest hover:bg-light-gold shadow-xl shadow-gold/10 transition-all transform active:scale-95 flex items-center justify-center">
                    <DollarSign size={18} className="mr-2" /> VALIDER LA VENTE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptModal && (
          <SaleReceipt sale={receiptModal} onClose={() => setReceiptModal(null)} />
      )}
    </div>
  );
};

export default Sales;
