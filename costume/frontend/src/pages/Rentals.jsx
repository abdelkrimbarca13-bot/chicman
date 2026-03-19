import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { Plus, Calendar, CheckCircle, Search, Trash2, Smartphone, DollarSign, X, FileText, Play, Info, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import RentalReceipt from '../components/RentalReceipt';

const Rentals = () => {
  const [rentals, setRentals] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [receiptModal, setReceiptModal] = useState(null);
  const [scanTerm, setScanTerm] = useState('');
  const [newRental, setNewRental] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    items: [], // [{ id, remarks, price, name }]
    startDate: new Date().toISOString().split('T')[0],
    expectedReturn: '',
    totalAmount: 0,
    paidAmount: 0,
    discount: 0,
    remarks: '',
    guaranteeDocument: ''
  });
  const [filterStatus, setFilterStatus] = useState('ONGOING');
  const [activeTab, setActiveTab] = useState('ongoing');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [rentId] = useState(() => Date.now().toString().slice(-6));

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilterStatus(tab === 'ongoing' ? 'ONGOING' : 'RETURNED');
  };

  const fetchData = useCallback(async () => {
    try {
      const [rRes, iRes] = await Promise.all([
        api.get('/rentals'),
        api.get('/items')
      ]);
      setRentals(Array.isArray(rRes.data) ? rRes.data : []);
      setAllItems(Array.isArray(iRes.data) ? iRes.data : []);
    } catch (err) {
      console.error('Erreur lors du chargement des données', err);
    }
  }, []);

  const fetchAvailableItems = useCallback(async () => {
    try {
      let url = '/items';
      if (newRental.startDate && newRental.expectedReturn) {
        url += `?startDate=${newRental.startDate}&endDate=${newRental.expectedReturn}`;
      }
      const iRes = await api.get(url);
      setItems(Array.isArray(iRes.data) ? iRes.data : []);
    } catch (err) {
      console.error('Erreur chargement articles', err);
      setItems([]);
    }
  }, [newRental.startDate, newRental.expectedReturn]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchAvailableItems(); }, [fetchAvailableItems]);
  
  useEffect(() => {
    if (isModalOpen) {
      fetchAvailableItems();
    }
  }, [isModalOpen, fetchAvailableItems]);

  useEffect(() => {
    const subtotal = newRental.items.reduce((sum, item) => sum + (item.price || 0), 0);
    const total = Math.max(0, subtotal - (parseFloat(newRental.discount) || 0));
    if (newRental.totalAmount !== total) {
      setNewRental(prev => ({ ...prev, totalAmount: total }));
    }
  }, [newRental.items, newRental.discount]);

  const addItem = (item) => {
    const isAvailable = items.some(i => i.id === item.id);
    if (!isAvailable) {
        alert(`L'article ${item.name} (${item.reference}) est occupé pour les dates sélectionnées.`);
        setScanTerm('');
        return;
    }
    if (!newRental.items.some(i => i.id === item.id)) {
        setNewRental(prev => ({
            ...prev,
            items: [...prev.items, { 
              id: item.id, 
              remarks: '', 
              tailorModification: '',
              price: item.rentalPrice || 0, 
              name: item.name,
              type: item.type
            }]
        }));
    }
    setScanTerm('');
  };

  const handleScan = (val) => {
    setScanTerm(val);
    const item = allItems.find(i => i.reference.toLowerCase() === val.toLowerCase());
    if (item) {
        addItem(item);
    }
  };

  const removeItem = (id) => {
    setNewRental(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItemRemarks = (id, remarks) => {
    setNewRental(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, remarks } : item)
    }));
  };

  const updateItemTailor = (id, tailorModification) => {
    setNewRental(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? { ...item, tailorModification } : item)
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newRental.items.length === 0) {
        alert('Veuillez sélectionner au moins un article');
        return;
    }
    try {
      await api.post('/rentals', {
        ...newRental,
        items: newRental.items.map(item => ({ 
          id: parseInt(item.id), 
          remarks: item.remarks,
          tailorModification: item.tailorModification
        }))
      });
      setIsModalOpen(false);
      setNewRental({ 
        firstName: '', 
        lastName: '', 
        phone: '', 
        items: [], 
        startDate: new Date().toISOString().split('T')[0],
        expectedReturn: '',
        totalAmount: 0,
        paidAmount: 0,
        discount: 0,
        remarks: '',
        guaranteeDocument: ''
      });
      fetchData();
    } catch {
      alert('Erreur lors de la création');
    }
  };

  const handleActivate = async (id) => {
    if (confirm('Activer la location ? Le solde restant sera ajouté à la caisse.')) {
      try {
        await api.post(`/rentals/${id}/activate`);
        fetchData();
        alert('Location activée avec succès');
      } catch {
        alert('Erreur lors de l\'activation');
      }
    }
  };

  const handleReturn = async (id) => {
    if (confirm('Marquer comme retourné ?')) {
      await api.post(`/rentals/${id}/return`);
      fetchData();
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }
    try {
      await api.post(`/rentals/${paymentModal.id}/payment`, { amount: parseFloat(paymentAmount) });
      setPaymentModal(null);
      setPaymentAmount('');
      fetchData();
    } catch {
      alert('Erreur lors de l\'enregistrement du paiement');
    }
  };

  const filteredRentals = rentals.filter(rental => {
    const matchesStatus = filterStatus === 'ALL' || rental.status === filterStatus;
    
    let matchesDate = true;
    if (filterStartDate || filterEndDate) {
      const rentalDate = new Date(rental.startDate);
      rentalDate.setHours(0,0,0,0);
      
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0,0,0,0);
        if (rentalDate < start) matchesDate = false;
      }
      
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23,59,59,999);
        if (rentalDate > end) matchesDate = false;
      }
    }

    let matchesCustomer = !filterCustomer;
    if (filterCustomer) {
      const searchTerm = filterCustomer.toLowerCase();
      const customerName = `${rental.customer.firstName} ${rental.customer.lastName}`.toLowerCase();
      matchesCustomer = customerName.includes(searchTerm) || 
                        rental.customer.firstName.toLowerCase().includes(searchTerm) ||
                        rental.customer.lastName.toLowerCase().includes(searchTerm);
    }
    
    return matchesStatus && matchesDate && matchesCustomer;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Gestion des Locations</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
            <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-full sm:w-auto">
                <button 
                    onClick={() => handleTabChange('ongoing')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'ongoing' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    En Cours
                </button>
                <button 
                    onClick={() => handleTabChange('history')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    Historique
                </button>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-indigo-700 shadow-lg w-full sm:w-auto text-sm"
            >
                <Plus size={20} className="mr-2" /> Nouvelle Location
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Filtrer par Période</label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                />
            </div>
            <span className="text-gray-400 font-bold text-center">au</span>
            <div className="relative flex-1">
                <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                type="date" 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Filtrer par Client</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Nom ou Prénom..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => { setFilterStatus('ONGOING'); setFilterStartDate(''); setFilterEndDate(''); setFilterCustomer(''); setActiveTab('ongoing'); }}
          className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-bold rounded-lg transition-colors text-sm"
        >
          Réinitialiser
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-gray-50 uppercase text-[10px] sm:text-xs font-semibold text-gray-600">
              <tr>
                <th className="px-6 py-3 border-b whitespace-nowrap">Client</th>
                <th className="px-6 py-3 border-b whitespace-nowrap">Articles</th>
                <th className="px-6 py-3 border-b text-center whitespace-nowrap">Dates</th>
                <th className="px-6 py-3 border-b whitespace-nowrap">Statut</th>
                <th className="px-6 py-3 border-b whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {filteredRentals.map(rental => (
              <tr key={rental.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800">{rental.customer.firstName} {rental.customer.lastName}</div>
                  <div className="text-xs text-gray-500 font-mono">{rental.customer.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {rental.items.map((ri, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-1 rounded-md border border-indigo-100 font-medium">
                        {ri.item.name} 
                        {ri.remarks && <span className="text-gray-400 ml-1">({ri.remarks})</span>}
                        {ri.tailorModification && (
                          <span className="text-indigo-900 ml-1 bg-indigo-200/50 px-1 rounded flex items-center gap-0.5 inline-flex">
                            <Scissors size={8} /> {ri.tailorModification}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col items-center text-xs space-y-1">
                     <span className="flex items-center text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded"><Calendar size={10} className="mr-1" /> {format(new Date(rental.startDate), 'dd/MM/yy')}</span>
                     <span className="flex items-center text-orange-600 font-semibold bg-orange-50 px-2 py-0.5 rounded"><Calendar size={10} className="mr-1" /> {format(new Date(rental.expectedReturn), 'dd/MM/yy')}</span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    rental.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {rental.status === 'ONGOING' ? 'En cours' : 'Retourné'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 flex-wrap">
                    <button 
                      onClick={() => setReceiptModal(rental)}
                      className="text-purple-600 hover:text-purple-900 flex items-center font-bold text-sm"
                      title="Afficher le bon de location"
                    >
                      <FileText size={16} className="mr-1"/> Bon
                    </button>
                    {rental.status === 'ONGOING' && (
                      <>
                        {!rental.isActivated && (
                          <button 
                            onClick={() => handleActivate(rental.id)}
                            className="text-orange-600 hover:text-orange-900 flex items-center font-bold text-sm"
                            title="Activer la location"
                          >
                            <Play size={16} className="mr-1"/> Activer
                          </button>
                        )}
                        <button 
                          onClick={() => setPaymentModal(rental)}
                          className="text-blue-600 hover:text-blue-900 flex items-center font-bold text-sm"
                          title="Ajouter paiement"
                        >
                          <DollarSign size={16} className="mr-1"/> Paiement
                        </button>
                        <button 
                          onClick={() => handleReturn(rental.id)}
                          className="text-green-600 hover:text-green-900 flex items-center font-bold text-sm"
                        >
                          <CheckCircle size={16} className="mr-1"/> Retourner
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                <h2 className="text-2xl font-black text-gray-800">Nouvelle Location</h2>
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                    RENT-{rentId}
                </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="bg-indigo-50/50 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 border border-indigo-100">
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-600 mb-1">Début de location</label>
                  <input type="date" className="w-full p-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRental.startDate} onChange={e => setNewRental({...newRental, startDate: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-indigo-600 mb-1">Fin de location</label>
                  <input type="date" className="w-full p-2.5 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={newRental.expectedReturn} onChange={e => setNewRental({...newRental, expectedReturn: e.target.value})} required />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase text-gray-500">Scanner ou Chercher Articles</label>
                    <span className="text-[10px] text-indigo-500 font-bold">Total Sélectionné: {newRental.items.length}</span>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-3 text-indigo-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scannez l'article ici..." 
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 font-bold"
                            value={scanTerm}
                            onChange={(e) => handleScan(e.target.value)}
                            autoFocus
                        />
                        {scanTerm.length >= 2 && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            {allItems.filter(item => 
                                item.name.toLowerCase().includes(scanTerm.toLowerCase()) || 
                                item.reference.toLowerCase().includes(scanTerm.toLowerCase())
                            ).slice(0, 6).map(item => {
                                const isAvailable = items.some(i => i.id === item.id);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => addItem(item)}
                                        className={`w-full p-3 text-left flex justify-between items-center border-b last:border-0 hover:bg-gray-50 transition-colors ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div>
                                            <div className="font-bold text-gray-800">{item.name}</div>
                                            <div className="text-xs text-gray-500 uppercase font-mono">{item.reference} - {item.type}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-indigo-600">{item.rentalPrice} DA</div>
                                            {!isAvailable && <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 rounded">Indisponible</span>}
                                        </div>
                                    </button>
                                );
                            })}
                          </div>
                        )}
                    </div>
                </div>
              </div>

              {newRental.items.length > 0 && (
                <div className="space-y-3">
                  <label className="block text-xs font-black uppercase text-gray-500">Articles Sélectionnés</label>
                  {newRental.items.map(item => (
                    <div key={item.id} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-200 group">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-800">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-indigo-600 font-bold">{item.price} DA</span>
                          <button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Info size={14} className="absolute left-2 top-2.5 text-gray-400" />
                          <input 
                            type="text"
                            placeholder="Remarques..."
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 outline-none"
                            value={item.remarks}
                            onChange={(e) => updateItemRemarks(item.id, e.target.value)}
                          />
                        </div>
                        {item.type === 'Pantalon' && (
                          <div className="relative">
                            <Scissors size={14} className="absolute left-2 top-2.5 text-indigo-400" />
                            <input 
                              type="text"
                              placeholder="Modification tailleur (ex: Raccourcir 2cm)"
                              className="w-full pl-8 pr-3 py-1.5 text-sm border border-indigo-100 bg-indigo-50/30 rounded focus:ring-1 focus:ring-indigo-400 outline-none font-medium text-indigo-700"
                              value={item.tailorModification}
                              onChange={(e) => updateItemTailor(item.id, e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 border-b pb-1">Client</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Prénom" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newRental.firstName} onChange={e => setNewRental({...newRental, firstName: e.target.value})} required />
                        <input type="text" placeholder="Nom" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newRental.lastName} onChange={e => setNewRental({...newRental, lastName: e.target.value})} required />
                    </div>
                    <input type="text" placeholder="Téléphone" className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newRental.phone} onChange={e => setNewRental({...newRental, phone: e.target.value})} required />
                    <select className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" value={newRental.guaranteeDocument} onChange={e => setNewRental({...newRental, guaranteeDocument: e.target.value})} required>
                        <option value="">Document de garantie...</option>
                        <option value="PASSPORT">Passeport</option>
                        <option value="ID_CARD">Carte d'identité</option>
                        <option value="DRIVER_LICENSE">Permis de conduire</option>
                    </select>
                    <textarea 
                      placeholder="Remarques générales sur le bon..."
                      className="w-full p-2.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                      value={newRental.remarks}
                      onChange={e => setNewRental({...newRental, remarks: e.target.value})}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gray-800 border-b pb-1">Paiement</h3>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Sous-total</span>
                            <span className="font-bold">{newRental.items.reduce((sum, i) => sum + i.price, 0)} DA</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Remise</span>
                            <input 
                              type="number" 
                              className="w-24 p-1 border rounded text-right font-bold text-red-600" 
                              value={newRental.discount} 
                              onChange={e => setNewRental({...newRental, discount: parseFloat(e.target.value) || 0})}
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-lg">
                            <span className="font-black text-gray-800">TOTAL</span>
                            <span className="font-black text-indigo-600">{newRental.totalAmount} DA</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Versement Initial (Acompte)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-3 text-green-600" size={18} />
                            <input type="number" className="w-full pl-10 pr-4 py-2.5 border-2 border-green-100 rounded-lg outline-none focus:border-green-500 bg-green-50/30 font-black text-green-700 text-xl" value={newRental.paidAmount} onChange={e => setNewRental({...newRental, paidAmount: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 sticky bottom-0 bg-white border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 border border-gray-300 text-gray-600 rounded-xl font-black hover:bg-gray-50 transition-colors">ANNULER</button>
                <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all transform active:scale-95">CRÉER LE BON</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">Nouveau Versement</h2>
                <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-6">
                <div className="bg-indigo-50 p-4 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-indigo-600 font-bold">Client:</span>
                        <span className="font-bold">{paymentModal.customer.firstName} {paymentModal.customer.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-indigo-600 font-bold">Total du bon:</span>
                        <span className="font-bold">{paymentModal.totalAmount} DA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-indigo-600 font-bold">Déjà payé:</span>
                        <span className="font-bold text-green-600">{paymentModal.paidAmount} DA</span>
                    </div>
                    <div className="flex justify-between text-lg pt-2 border-t border-indigo-200">
                        <span className="text-indigo-900 font-black">Reste à payer:</span>
                        <span className="font-black text-red-600">{paymentModal.totalAmount - paymentModal.paidAmount} DA</span>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Montant du versement</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-green-600" size={24} />
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-black text-2xl text-gray-800"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>

                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl transition-all transform active:scale-95">
                    CONFIRMER LE PAIEMENT
                </button>
            </form>
          </div>
        </div>
      )}

      {receiptModal && <RentalReceipt rental={receiptModal} onClose={() => setReceiptModal(null)} />}
    </div>
  );
};

export default Rentals;
