import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Calendar, CheckCircle, Search, Trash2, Smartphone, DollarSign, X, FileText, Play, Info, Scissors, PlusCircle, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import RentalReceipt from '../components/RentalReceipt';

const Rentals = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [rentals, setRentals] = useState([]);
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRentalId, setEditingRentalId] = useState(null);
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
    addedAmount: 0,
    remarks: '',
    guaranteeDocument: ''
  });

  useEffect(() => {
    const rentalId = searchParams.get('rentalId');
    if (rentalId && rentals.length > 0) {
      const rental = rentals.find(r => r.id.toString() === rentalId);
      if (rental) setReceiptModal(rental);
    }

    const isNew = searchParams.get('new');
    if (isNew === 'true') {
      setNewRental(prev => ({
        ...prev,
        firstName: searchParams.get('firstName') || '',
        lastName: searchParams.get('lastName') || '',
        phone: searchParams.get('phone') || ''
      }));
      setIsModalOpen(true);
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/rentals');
    }
  }, [searchParams, rentals]);
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
    const total = Math.max(0, subtotal + (parseFloat(newRental.addedAmount) || 0) - (parseFloat(newRental.discount) || 0));
    if (newRental.totalAmount !== total) {
      setNewRental(prev => ({ ...prev, totalAmount: total }));
    }
  }, [newRental.items, newRental.discount, newRental.addedAmount]);

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

  const handleEditRental = (rental) => {
    setNewRental({
      firstName: rental.customer?.firstName || '',
      lastName: rental.customer?.lastName || '',
      phone: rental.customer?.phone || '',
      items: rental.items.map(ri => ({
        id: ri.item.id,
        remarks: ri.remarks || '',
        tailorModification: ri.tailorModification || '',
        price: ri.price,
        name: ri.item.name,
        type: ri.item.type
      })),
      startDate: new Date(rental.startDate).toISOString().split('T')[0],
      expectedReturn: new Date(rental.expectedReturn).toISOString().split('T')[0],
      totalAmount: rental.totalAmount,
      paidAmount: rental.paidAmount,
      discount: rental.discount,
      addedAmount: rental.addedAmount || 0,
      remarks: rental.remarks || '',
      guaranteeDocument: rental.guaranteeDocument
    });
    setEditingRentalId(rental.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newRental.items.length === 0) {
        alert('Veuillez sélectionner au moins un article');
        return;
    }
    try {
      const payload = {
        ...newRental,
        items: newRental.items.map(item => ({ 
          id: parseInt(item.id), 
          remarks: item.remarks,
          tailorModification: item.tailorModification,
          price: parseFloat(item.price)
        })),
        totalAmount: parseFloat(newRental.totalAmount),
        paidAmount: parseFloat(newRental.paidAmount),
        discount: parseFloat(newRental.discount),
        addedAmount: parseFloat(newRental.addedAmount || 0)
      };

      if (isEditMode) {
        await api.put(`/rentals/${editingRentalId}`, payload);
      } else {
        await api.post('/rentals', payload);
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingRentalId(null);
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
      alert(`Erreur lors de la ${isEditMode ? 'modification' : 'création'}`);
    }
  };

  const handleActivate = async (id) => {
    if (confirm('Activer la location ?')) {
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

  const handleDeleteRental = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette location ? Cette action est irréversible.')) {
        try {
            await api.delete(`/rentals/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Erreur lors de la suppression');
        }
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

  const handleQuickFilter = (days) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    
    if (days === 0) {
      // Today
      setFilterStartDate(start.toISOString().split('T')[0]);
      setFilterEndDate(end.toISOString().split('T')[0]);
    } else if (days === 1) {
      // Yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date();
      yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      setFilterStartDate(yesterday.toISOString().split('T')[0]);
      setFilterEndDate(yesterdayEnd.toISOString().split('T')[0]);
    } else if (days === 7) {
      // Last 7 days
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(0, 0, 0, 0);
      setFilterStartDate(lastWeek.toISOString().split('T')[0]);
      setFilterEndDate(end.toISOString().split('T')[0]);
    } else {
      setFilterStartDate('');
      setFilterEndDate('');
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
      const customerName = `${rental.customer?.firstName || ''} ${rental.customer?.lastName || ''}`.toLowerCase();
      matchesCustomer = customerName.includes(searchTerm) || 
                        rental.customer?.phone?.includes(searchTerm) ||
                        rental.id.toString().includes(searchTerm);
    }
    
    return matchesStatus && matchesDate && matchesCustomer;
  });

  return (
    <div>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-widest text-gold uppercase border-b-2 border-gold/30 pb-2">Gestion des Locations</h1>
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
            <div className="flex bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 p-1 w-full sm:w-auto">
                <button 
                    onClick={() => handleTabChange('ongoing')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'ongoing' ? 'bg-gold text-rich-black shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800'}`}
                >
                    En Cours
                </button>
                <button 
                    onClick={() => handleTabChange('history')}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-gold text-rich-black shadow-md' : 'text-zinc-500 hover:bg-zinc-100 dark:bg-zinc-800'}`}
                >
                    Historique
                </button>
            </div>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gold text-rich-black px-6 py-2 rounded-lg flex items-center justify-center hover:bg-light-gold shadow-lg shadow-gold/10 w-full sm:w-auto text-sm font-bold transition-all active:scale-95"
            >
                <Plus size={20} className="mr-2" /> Nouvelle Location
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl border border-gold/10 mb-6 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 items-stretch md:items-end">
            <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-gold/60 mb-2 tracking-widest">Filtrer par Période</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    />
                </div>
                <span className="text-zinc-600 font-bold text-center">au</span>
                <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input 
                    type="date" 
                    className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    />
                </div>
            </div>
            </div>
            <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-gold/60 mb-2 tracking-widest">Recherche</label>
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                <input 
                type="text" 
                placeholder="Nom, Téléphone ou N° Bon..."
                className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm text-zinc-900 dark:text-white"
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                />
            </div>
            </div>
            {user?.role === 'ADMIN' && (
                <button 
                    onClick={() => { setFilterStatus('ONGOING'); setFilterStartDate(''); setFilterEndDate(''); setFilterCustomer(''); setActiveTab('ongoing'); }}
                    className="px-6 py-2 text-gold hover:bg-gold/10 font-bold rounded-lg transition-colors text-sm border border-gold/20"
                >
                    Réinitialiser
                </button>
            )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800">
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mr-2">Filtres Rapides:</span>
            <button onClick={() => handleQuickFilter(0)} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-full border border-zinc-700 transition-colors uppercase">Aujourd'hui</button>
            <button onClick={() => handleQuickFilter(1)} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-full border border-zinc-700 transition-colors uppercase">Hier</button>
            <button onClick={() => handleQuickFilter(7)} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-full border border-zinc-700 transition-colors uppercase">7 derniers jours</button>
            <button onClick={() => handleQuickFilter(-1)} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-full border border-zinc-700 transition-colors uppercase">Tout</button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gold/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] sm:text-xs font-bold text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Client</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Articles</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 text-center whitespace-nowrap tracking-wider">Dates</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Statut</th>
                <th className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700 whitespace-nowrap tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredRentals.map(rental => (
              <tr key={rental.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900 dark:text-white text-base uppercase tracking-tighter">#{rental.id.toString().padStart(5, '0')}</div>
                  <div className="text-sm font-black text-gold uppercase truncate max-w-[150px]">{rental.customer?.firstName} {rental.customer?.lastName}</div>
                  <div className="text-xs text-zinc-500 dark:text-gold font-mono tracking-tight font-bold">{rental.customer?.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {rental.items.map((ri, idx) => (
                      <span key={idx} className="bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] px-2.5 py-1 rounded border border-zinc-200 dark:border-gold/20 font-bold shadow-sm">
                        {ri.item.name} 
                        {ri.remarks && <span className="text-zinc-400 dark:text-zinc-500 ml-1 italic font-medium">({ri.remarks})</span>}
                        {ri.tailorModification && (
                          <span className="text-gold ml-1 bg-gold/5 dark:bg-gold/10 px-1.5 py-0.5 rounded flex items-center gap-1 inline-flex border border-gold/20">
                            <Scissors size={8} /> {ri.tailorModification}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col items-center text-[10px] space-y-1.5">
                     <span className="flex items-center text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded border border-blue-100 dark:border-blue-900/30 w-full justify-center">
                       <Calendar size={10} className="mr-1.5" /> {format(new Date(rental.startDate), 'dd/MM/yy')}
                     </span>
                     <span className="flex items-center text-orange-700 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded border border-orange-100 dark:border-orange-900/30 w-full justify-center">
                       <Calendar size={10} className="mr-1.5" /> {format(new Date(rental.expectedReturn), 'dd/MM/yy')}
                     </span>
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border text-center ${
                      rental.status === 'ONGOING' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/30' : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30'
                    }`}>
                      {rental.status === 'ONGOING' ? 'En cours' : 'Retourné'}
                    </span>
                    {rental.status === 'ONGOING' && new Date(rental.expectedReturn) < new Date() && (
                      <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/50 bg-red-500/10 text-red-500 text-center animate-pulse">
                        Retard
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-4 flex-wrap">
                    <button 
                      onClick={() => setReceiptModal(rental)}
                      className="text-zinc-500 dark:text-zinc-300 hover:text-gold flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                      title="Afficher le bon de location"
                    >
                      <FileText size={16} className="mr-1"/> Bon
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button 
                        onClick={() => handleDeleteRental(rental.id)}
                        className="text-red-500 hover:text-red-400 flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                        title="Supprimer la location"
                      >
                        <Trash2 size={16} className="mr-1"/> Supprimer
                      </button>
                    )}
                    {rental.status === 'ONGOING' && (
                      <>
                        {!rental.isActivated ? (
                          <>
                            <button 
                              onClick={() => handleActivate(rental.id)}
                              className="text-orange-400 hover:text-orange-300 flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                              title="Activer la location"
                            >
                              <Play size={16} className="mr-1"/> Activer
                            </button>
                            <button 
                              onClick={() => handleEditRental(rental)}
                              className="text-gold hover:text-light-gold flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                              title="Modifier la location"
                            >
                              <Edit2 size={16} className="mr-1"/> Modifier
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleReturn(rental.id)}
                            className="text-green-600 hover:text-green-900 flex items-center font-bold text-sm"
                          >
                            <CheckCircle size={16} className="mr-1"/> Retourner
                          </button>
                        )}
                        <button 
                          onClick={() => setPaymentModal(rental)}
                          className="text-blue-400 hover:text-blue-300 flex items-center font-bold text-xs uppercase tracking-tighter transition-colors"
                          title="Ajouter paiement"
                        >
                          <DollarSign size={16} className="mr-1"/> Paiement
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h2 className="text-2xl font-black text-gold font-luxury tracking-widest uppercase">{isEditMode ? 'Modifier' : 'Nouvelle'} Location</h2>
                <div className="text-xs font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                    {isEditMode ? `ID: #${editingRentalId}` : `RENT-${rentId}`}
                </div>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-6">
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 border border-zinc-700">
                <div>
                  <label className="block text-xs font-black uppercase text-gold/60 mb-1 tracking-wider">Début de location</label>
                  <input type="date" className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-zinc-900 dark:text-white" value={newRental.startDate} onChange={e => setNewRental({...newRental, startDate: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gold/60 mb-1 tracking-wider">Fin de location</label>
                  <input type="date" className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-zinc-900 dark:text-white" value={newRental.expectedReturn} onChange={e => setNewRental({...newRental, expectedReturn: e.target.value})} required />
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-black uppercase text-zinc-500 tracking-wider">Scanner ou Chercher Articles</label>
                    <span className="text-[10px] text-gold font-bold uppercase tracking-tighter">Total: {newRental.items.length}</span>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Smartphone className="absolute left-3 top-3 text-gold" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scannez l'article ici..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-zinc-900 dark:text-white font-bold"
                            value={scanTerm}
                            onChange={(e) => handleScan(e.target.value)}
                            autoFocus
                        />
                        {scanTerm.length >= 2 && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden">
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
                                        className={`w-full p-3 text-left flex justify-between items-center border-b border-zinc-700 last:border-0 hover:bg-zinc-700 transition-colors ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div>
                                            <div className="font-bold text-zinc-900 dark:text-white">{item.name}</div>
                                            <div className="text-xs text-zinc-500 uppercase font-mono">{item.reference} - {item.type}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-gold">{item.rentalPrice} DA</div>
                                            {!isAvailable && <span className="text-[8px] font-black text-red-400 uppercase bg-red-900/30 px-1 rounded border border-red-900/50">Occupé</span>}
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
                  <label className="block text-xs font-black uppercase text-zinc-500 tracking-wider">Articles Sélectionnés</label>
                  {newRental.items.map(item => (
                    <div key={item.id} className="flex flex-col p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-700 group hover:border-gold/30 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-zinc-900 dark:text-white text-base">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-gold font-black">{item.price} DA</span>
                          <button type="button" onClick={() => removeItem(item.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="relative">
                          <Info size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
                          <input 
                            type="text"
                            placeholder="Remarques..."
                            className="w-full pl-9 pr-3 py-1.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-1 focus:ring-gold outline-none"
                            value={item.remarks}
                            onChange={(e) => updateItemRemarks(item.id, e.target.value)}
                          />
                        </div>
                        {item.type === 'Pantalon' && (
                          <div className="relative">
                            <Scissors size={14} className="absolute left-2.5 top-2.5 text-gold" />
                            <input 
                              type="text"
                              placeholder="Modification tailleur (ex: Raccourcir 2cm)"
                              className="w-full pl-9 pr-3 py-1.5 text-sm bg-gold/5 border border-gold/20 rounded text-gold focus:ring-1 focus:ring-gold outline-none font-medium"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gold border-b border-zinc-800 pb-2 tracking-widest font-luxury">Client</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Prénom" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white" value={newRental.firstName} onChange={e => setNewRental({...newRental, firstName: e.target.value})} required />
                        <input type="text" placeholder="Nom" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white" value={newRental.lastName} onChange={e => setNewRental({...newRental, lastName: e.target.value})} required />
                    </div>
                    <input type="text" placeholder="Téléphone" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white" value={newRental.phone} onChange={e => setNewRental({...newRental, phone: e.target.value})} required />
                    <select className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white" value={newRental.guaranteeDocument} onChange={e => setNewRental({...newRental, guaranteeDocument: e.target.value})} required>
                        <option value="">Document de garantie...</option>
                        <option value="PASSPORT">Passeport</option>
                        <option value="ID_CARD">Carte d'identité</option>
                        <option value="DRIVER_LICENSE">Permis de conduire</option>
                    </select>
                    <textarea 
                      placeholder="Remarques générales sur le bon..."
                      className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-gold text-zinc-900 dark:text-white min-h-[100px]"
                      value={newRental.remarks}
                      onChange={e => setNewRental({...newRental, remarks: e.target.value})}
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-gold border-b border-zinc-800 pb-2 tracking-widest font-luxury">Paiement</h3>
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-700 shadow-inner space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 uppercase font-bold tracking-tighter">Sous-total</span>
                            <span className="font-bold text-zinc-900 dark:text-white">{newRental.items.reduce((sum, i) => sum + i.price, 0)} DA</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 uppercase font-bold tracking-tighter">Remise</span>
                            <div className="flex items-center gap-2">
                                <input 
                                type="number" 
                                className="w-24 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-700 rounded text-right font-black text-red-400 focus:ring-1 focus:ring-red-500 outline-none" 
                                value={newRental.discount} 
                                onChange={e => setNewRental({...newRental, discount: parseFloat(e.target.value) || 0})}
                                />
                                <span className="text-zinc-500 text-xs font-bold">DA</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-500 uppercase font-bold tracking-tighter">Ajouter</span>
                            <div className="flex items-center gap-2">
                                <input 
                                type="number" 
                                className="w-24 p-1.5 bg-white dark:bg-zinc-900 border border-zinc-700 rounded text-right font-black text-blue-400 focus:ring-1 focus:ring-blue-500 outline-none" 
                                value={newRental.addedAmount} 
                                onChange={e => setNewRental({...newRental, addedAmount: parseFloat(e.target.value) || 0})}
                                />
                                <span className="text-zinc-500 text-xs font-bold">DA</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-zinc-700 text-xl">
                            <span className="font-black text-zinc-900 dark:text-white font-luxury uppercase tracking-wider">TOTAL</span>
                            <span className="font-black text-gold underline underline-offset-4 decoration-gold/30">{newRental.totalAmount} DA</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Versement Initial (Acompte)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-3.5 text-green-500" size={20} />
                            <input type="number" className="w-full pl-12 pr-4 py-3.5 bg-green-900/10 border-2 border-green-900/30 rounded-xl outline-none focus:border-green-500 text-green-400 font-black text-2xl shadow-inner" value={newRental.paidAmount} onChange={e => setNewRental({...newRental, paidAmount: parseFloat(e.target.value) || 0})} />
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-800 mt-8">
                <button type="button" onClick={() => { setIsModalOpen(false); setIsEditMode(false); setEditingRentalId(null); }} className="flex-1 px-6 py-4 border border-zinc-700 text-zinc-400 rounded-xl font-black uppercase tracking-widest hover:bg-zinc-100 dark:bg-zinc-800 transition-colors">ANNULER</button>
                <button type="submit" className="flex-1 px-6 py-4 bg-gold text-rich-black rounded-xl font-black uppercase tracking-widest hover:bg-light-gold shadow-xl shadow-gold/10 transition-all transform active:scale-95">{isEditMode ? 'ENREGISTRER' : 'CRÉER LE BON'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-gold uppercase tracking-widest font-luxury">Nouveau Versement</h2>
                <button onClick={() => setPaymentModal(null)} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-6">
                <div className="bg-zinc-100 dark:bg-zinc-800 p-5 rounded-xl border border-zinc-700 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-tighter">Client:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{paymentModal.customer.firstName} {paymentModal.customer.lastName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-tighter">Total du bon:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{paymentModal.totalAmount} DA</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 font-bold uppercase tracking-tighter">Déjà payé:</span>
                        <span className="font-bold text-green-400">{paymentModal.paidAmount} DA</span>
                    </div>
                    <div className="flex justify-between text-lg pt-3 border-t border-zinc-700">
                        <span className="text-zinc-400 font-black uppercase tracking-wider font-luxury text-sm">Reste à payer:</span>
                        <span className="font-black text-red-400">{paymentModal.totalAmount - paymentModal.paidAmount} DA</span>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Montant du versement</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-4 text-green-500" size={24} />
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-4 py-4 bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-gold font-black text-3xl text-zinc-900 dark:text-white shadow-inner"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                        />
                    </div>
                </div>

                <button type="submit" className="w-full py-4 bg-gold text-rich-black rounded-xl font-black uppercase tracking-widest hover:bg-light-gold shadow-xl shadow-gold/10 transition-all transform active:scale-95">
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
