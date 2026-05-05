import React, { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Plus, Receipt, Calculator, Calendar, X, User, ShoppingBag, Info, Search, Filter, Download, Printer, LogOut, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Cash = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [dailyCash, setDailyCash] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Modal states
  const [isInitialCashModalOpen, setIsInitialCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // { date, payments, expenses, totals }
  const [globalSummary, setGlobalSummary] = useState(null);
  
  const [initialAmount, setInitialAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', slipNumber: '', category: 'AUTRE' });

  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  
  const [editingSale, setEditingSale] = useState(null);
  const [editSaleAmount, setEditSaleAmount] = useState('');
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const calls = [
        api.get('/cash/status'),
        api.get(`/cash/expenses?date=${today}`)
      ];

      if (isAdmin) {
        calls.push(api.get('/cash/history'));
        calls.push(api.get('/cash/summary')); 
        calls.push(api.get('/cash/withdrawals')); 
      }

      const results = await Promise.all(calls);
      
      setDailyCash(results[0].data);
      setExpenses(results[1].data);
      if (isAdmin && results[2]) {
        setHistory(results[2].data);
      }
      if (isAdmin && results[3]) {
        setGlobalSummary(results[3].data);
      }
      if (isAdmin && results[4]) {
        setWithdrawals(results[4].data);
      }
    } catch {
      console.error('Erreur chargement caisse');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetInitialCash = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash/initial', { amount: parseFloat(initialAmount) });
      setIsInitialCashModalOpen(false);
      setInitialAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/cash/expense/${editingExpense.id}`, newExpense);
      } else {
        // On combine la catégorie dans la description pour la traçabilité si le champ n'existe pas
        const payload = { 
          ...newExpense, 
          description: `[${newExpense.category}] ${newExpense.description}` 
        };
        await api.post('/cash/expense', payload);
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setNewExpense({ amount: '', description: '', slipNumber: '', category: 'AUTRE' });
      fetchData();
      if (detailModal) {
        // Refresh detail modal if open
        const res = await api.get(`/cash/details/${detailModal.date}`);
        setDetailModal(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!isAdmin) return;
    if (confirm('Supprimer cette dépense ?')) {
      try {
        await api.delete(`/cash/expense/${id}`);
        fetchData();
        if (detailModal) {
            const res = await api.get(`/cash/details/${detailModal.date}`);
            setDetailModal(res.data);
        }
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleCreateWithdrawal = async (e) => {
    e.preventDefault();
    try {
      if (editingWithdrawal) {
        await api.put(`/cash/withdrawal/${editingWithdrawal.id}`, {
          amount: parseFloat(withdrawalAmount),
          description: withdrawalDescription
        });
      } else {
        await api.post('/cash/withdrawal', { 
          amount: parseFloat(withdrawalAmount),
          description: withdrawalDescription
        });
      }
      setIsWithdrawalModalOpen(false);
      setEditingWithdrawal(null);
      setWithdrawalAmount('');
      setWithdrawalDescription('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de l\'enregistrement du retrait');
    }
  };

  const handleDeleteWithdrawal = async (id) => {
    if (!isAdmin) return;
    if (confirm('Supprimer ce retrait ?')) {
      try {
        await api.delete(`/cash/withdrawal/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression');
      }
    }
  };

  const handleDeletePayment = async (id) => {
    if (!isAdmin) return;
    if (confirm('Supprimer ce paiement ? Attention, cela impactera le solde de la location associée.')) {
        try {
            await api.delete(`/cash/payment/${id}`);
            fetchData();
            if (detailModal) {
                const res = await api.get(`/cash/details/${detailModal.date}`);
                setDetailModal(res.data);
            }
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression');
        }
    }
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    try {
        await api.put(`/cash/payment/${editingPayment.id}`, { amount: parseFloat(editAmount) });
        setEditingPayment(null);
        setEditAmount('');
        fetchData();
        if (detailModal) {
            const res = await api.get(`/cash/details/${detailModal.date}`);
            setDetailModal(res.data);
        }
    } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la modification');
    }
  };

  const handleDeleteSale = async (id) => {
    if (!isAdmin) return;
    if (confirm('Supprimer cette vente ? Les articles seront remis en stock.')) {
      try {
        await api.delete(`/sales/${id}`);
        fetchData();
        if (detailModal) {
          const res = await api.get(`/cash/details/${detailModal.date}`);
          setDetailModal(res.data);
        }
      } catch (err) {
        alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression de la vente');
      }
    }
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/sales/${editingSale.id}`, { totalAmount: parseFloat(editSaleAmount) });
      setEditingSale(null);
      setEditSaleAmount('');
      fetchData();
      if (detailModal) {
        const res = await api.get(`/cash/details/${detailModal.date}`);
        setDetailModal(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la modification de la vente');
    }
  };

  const fetchGlobalSummary = React.useCallback(async () => {
    if (!filterStartDate || !filterEndDate) {
      setGlobalSummary(null);
      // Re-fetch default history if filters cleared
      if (activeTab === 'history') {
        const hRes = await api.get('/cash/history');
        const wRes = await api.get('/cash/withdrawals');
        setHistory(hRes.data);
        setWithdrawals(wRes.data);
      }
      return;
    }
    try {
      const query = `?startDate=${filterStartDate}&endDate=${filterEndDate}`;
      const [sRes, hRes, wRes] = await Promise.all([
        api.get(`/cash/summary${query}`),
        api.get(`/cash/history${query}`),
        api.get(`/cash/withdrawals${query}`)
      ]);
      setGlobalSummary(sRes.data);
      setHistory(hRes.data);
      setWithdrawals(wRes.data);
    } catch {
      console.error('Erreur summary');
    }
  }, [filterStartDate, filterEndDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchGlobalSummary();
    }
  }, [fetchGlobalSummary, activeTab]);


  const handleExportExcel = async () => {
    try {
      const response = await api.get('/cash/export-excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'historique_caisse.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors de l\'export Excel');
    }
  };

  const showDayDetails = async (date) => {
    try {
      const res = await api.get(`/cash/details/${date}`);
      setDetailModal(res.data);
    } catch (err) {
      alert('Erreur lors du chargement des détails');
    }
  };

  const filteredHistory = history.filter(item => {
    if (!filterStartDate && !filterEndDate) return true;
    const itemDate = new Date(item.date).toISOString().split('T')[0];
    if (filterStartDate && itemDate < filterStartDate) return false;
    if (filterEndDate && itemDate > filterEndDate) return false;
    return true;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-gold uppercase tracking-widest animate-pulse">Chargement...</p>
    </div>
  );

  if (!dailyCash) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gold font-luxury tracking-widest uppercase border-b-2 border-gold/30 pb-2">Gestion de la Caisse</h1>
        {isAdmin && (
            <div className="flex bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 p-1 w-full sm:w-auto">
                <button onClick={() => setActiveTab('current')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'current' ? 'bg-gold text-rich-black' : 'text-zinc-500'}`}>Aujourd'hui</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-gold text-rich-black' : 'text-zinc-500'}`}>Historique</button>
            </div>
        )}
      </div>

      {activeTab === 'current' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8">
            {isAdmin && (
              <>
                <div className="bg-zinc-950 p-6 rounded-2xl border-2 border-gold shadow-2xl relative overflow-hidden group shadow-gold/10">
                    <p className="text-[10px] font-black text-gold/60 uppercase tracking-widest mb-1">TRÉSORERIE GLOBALE</p>
                    <h3 className="text-3xl font-black text-gold font-luxury">{globalSummary?.globalCash || 0} DA</h3>
                    <p className="mt-4 text-[10px] font-bold text-gold/40 uppercase tracking-tighter">Argent total (Net)</p>
                </div>

                <div 
                  onClick={() => showDayDetails(new Date().toISOString().split('T')[0])}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gold/10 relative overflow-hidden group cursor-pointer hover:border-green-500/50 transition-all"
                >
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">BÉNÉFICE DU JOUR</p>
                    <h3 className="text-2xl font-black text-green-400">+{dailyCash.totalRentals - dailyCash.totalExpenses} DA</h3>
                    <p className="mt-4 text-[10px] font-bold text-green-500/60 uppercase tracking-tighter flex items-center gap-1"><Info size={12}/> Recettes - Dépenses</p>
                </div>
              </>
            )}

            <div 
              onClick={() => showDayDetails(new Date().toISOString().split('T')[0])}
              className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gold/10 relative overflow-hidden group cursor-pointer hover:border-red-500/50 transition-all"
            >
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Dépenses (Sorties)</p>
                <h3 className="text-2xl font-black text-red-400">-{dailyCash.totalExpenses} DA</h3>
                <button onClick={(e) => { e.stopPropagation(); setIsExpenseModalOpen(true); }} className="mt-4 text-[10px] font-black uppercase text-red-400 hover:underline flex items-center gap-1"><Plus size={12} /> Ajouter Dépense</button>
            </div>

            {isAdmin && (
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gold/10 relative overflow-hidden group cursor-pointer hover:border-red-500/50 transition-all">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Prélèvement Admin</p>
                  <h3 className="text-2xl font-black text-red-500">RETRAIT</h3>
                  <button onClick={() => setIsWithdrawalModalOpen(true)} className="mt-4 text-[10px] font-black uppercase text-red-500 hover:underline flex items-center gap-1"><LogOut size={12} /> Sortir du cash</button>
              </div>
            )}

            {isAdmin && (
              <div className="bg-gold p-6 rounded-2xl shadow-2xl relative overflow-hidden group shadow-gold/20">
                  <p className="text-[10px] font-black text-rich-black/60 uppercase tracking-widest mb-1">CAISSE</p>
                  <h3 className="text-3xl font-black text-rich-black">{dailyCash.finalBalance} DA</h3>
                  <p className="mt-4 text-[10px] font-bold text-rich-black/40 uppercase tracking-tighter">Argent physique réel</p>
                  <button onClick={() => setIsInitialCashModalOpen(true)} className="mt-2 text-[10px] font-black uppercase text-rich-black/60 hover:text-rich-black hover:underline flex items-center gap-1"><Plus size={12} /> Fond de caisse</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gold/10 overflow-hidden">
                <div className="p-6 border-b border-zinc-800 bg-zinc-100 dark:bg-zinc-800/50">
                    <h3 className="font-black text-gold uppercase tracking-widest flex items-center gap-2 font-luxury text-sm"><Receipt size={20} /> Journal des Mouvements (Aujourd'hui)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] font-black text-zinc-500">
                            <tr>
                                <th className="px-6 py-4">Heure</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4">Par</th>
                                <th className="px-6 py-4 text-right">Montant</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                            {(() => {
                              const movements = [
                                ...dailyCash.details.payments.map(p => ({ 
                                  time: new Date(p.createdAt), 
                                  type: 'LOCATION', 
                                  desc: `Acompte/Solde - #${p.rentalId.toString().padStart(5, '0')}`, 
                                  by: p.performedBy || 'Inconnu', 
                                  amount: p.amount,
                                  color: 'text-green-400'
                                })),
                                ...dailyCash.details.sales.map(s => ({ 
                                  time: new Date(s.createdAt), 
                                  type: 'VENTE', 
                                  desc: `Vente Articles - #${s.id.toString().padStart(5, '0')}`, 
                                  by: s.performedBy || 'Inconnu', 
                                  amount: s.totalAmount,
                                  color: 'text-green-400'
                                })),
                                ...dailyCash.details.expenses.map(e => ({ 
                                  time: new Date(e.date), 
                                  type: 'DÉPENSE', 
                                  desc: e.description, 
                                  by: e.performedBy || 'Inconnu', 
                                  amount: -e.amount,
                                  color: 'text-red-400'
                                })),
                                ...withdrawals.filter(w => new Date(w.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).map(w => ({ 
                                  time: new Date(w.date), 
                                  type: 'RETRAIT', 
                                  desc: w.description || 'Retrait Admin', 
                                  by: w.performedBy || 'Admin', 
                                  amount: -w.amount,
                                  color: 'text-red-500'
                                }))
                              ].sort((a, b) => b.time - a.time);

                              if (movements.length === 0) {
                                return <tr><td colSpan="5" className="px-6 py-12 text-center text-zinc-600 font-bold italic text-sm">Aucun mouvement aujourd'hui</td></tr>;
                              }

                              return movements.map((m, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/50">
                                    <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">{format(m.time, 'HH:mm')}</td>
                                    <td className="px-6 py-4">
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${m.amount > 0 ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                                        {m.type}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-zinc-900 dark:text-white truncate max-w-[200px]">{m.desc}</td>
                                    <td className="px-6 py-4 text-[10px] font-black uppercase text-zinc-500">{m.by}</td>
                                    <td className={`px-6 py-4 text-right font-black ${m.color}`}>{m.amount > 0 ? '+' : ''}{m.amount} DA</td>
                                </tr>
                              ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAdmin && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gold/10 p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
                    <div className="text-center space-y-2 mb-4">
                        <h3 className="text-2xl font-black text-gold uppercase tracking-widest font-luxury">État du Tiroir</h3>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{format(new Date(), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="space-y-4 border-y-2 border-dashed border-zinc-800 py-8">
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Fond de Caisse (+)</span><span className="font-black text-white">{dailyCash.initialCash} DA</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Entrées (+)</span><span className="font-black text-green-400">{dailyCash.totalRentals} DA</span></div>
                        <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dépenses/Retraits (-)</span><span className="font-black text-red-400">-{dailyCash.totalExpenses + (withdrawals.filter(w => new Date(w.date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]).reduce((sum, w) => sum + w.amount, 0))} DA</span></div>
                    </div>
                    <div className="flex justify-between items-center pt-6">
                        <span className="text-lg font-black text-white uppercase tracking-widest font-luxury">CAISSE</span>
                        <span className={`text-4xl font-black ${dailyCash.finalBalance < 0 ? 'text-red-500' : 'text-gold'}`}>{dailyCash.finalBalance} DA</span>
                    </div>
                </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-2 tracking-widest">Filtrer par Période (Caisse)</label>
                    <div className="flex items-center gap-3">
                        <input type="date" className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-bold text-white" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
                        <span className="text-zinc-600 font-bold">au</span>
                        <input type="date" className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-bold text-white" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="px-6 py-2 text-zinc-500 hover:text-white font-black text-xs uppercase rounded-lg border border-zinc-800">Réinitialiser</button>
                    {isAdmin && (
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase rounded-lg shadow-lg shadow-green-900/20 transition-all active:scale-95">
                            <Download size={14} /> Excel
                        </button>
                    )}
                </div>
            </div>


            {globalSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-green-500/30">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Recettes Période</p>
                        <h3 className="text-2xl font-black text-green-400">+{globalSummary.totalIncome} DA</h3>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-red-500/30">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Dépenses Période</p>
                        <h3 className="text-2xl font-black text-red-400">-{globalSummary.totalExpenses} DA</h3>
                    </div>
                    <div className="bg-zinc-900 p-6 rounded-2xl border border-gold/50 shadow-xl shadow-gold/10">
                        <p className="text-[10px] font-black text-rich-black uppercase tracking-widest mb-1 bg-gold px-2 py-0.5 rounded w-fit">Recette Net Cumulée</p>
                        <h3 className="text-2xl font-black text-gold">{globalSummary.netRevenue} DA</h3>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Historique des Journaux de Caisse */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gold/10 overflow-hidden shadow-xl">
                    <div className="p-4 bg-zinc-800/50 border-b border-zinc-800">
                        <h3 className="font-black text-gold uppercase tracking-widest text-xs flex items-center gap-2">
                            <Calendar size={16} /> Historique des Journaux
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-800 uppercase text-[9px] font-black text-zinc-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Départ</th>
                                    <th className="px-4 py-3 text-green-400">Recettes</th>
                                    <th className="px-4 py-3 text-red-400">Dépenses</th>
                                    <th className="px-4 py-3 text-gold text-right">Cash Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                                {filteredHistory.map((day) => (
                                    <tr key={day.id} className="hover:bg-zinc-800/30 transition-all cursor-pointer" onClick={() => showDayDetails(day.date.split('T')[0])}>
                                        <td className="px-4 py-3 font-bold text-xs text-zinc-400">{format(new Date(day.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-4 py-3 font-bold text-xs">{day.initialCash} DA</td>
                                        <td className="px-4 py-3 font-black text-xs text-green-400">+{day.totalRentals} DA</td>
                                        <td className="px-4 py-3 font-black text-xs text-red-400">-{day.totalExpenses} DA</td>
                                        <td className="px-4 py-3 font-black text-sm text-gold text-right">{day.finalBalance} DA</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Historique des Retraits Admin */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-500/10 overflow-hidden shadow-xl">
                    <div className="p-4 bg-red-900/10 border-b border-zinc-800">
                        <h3 className="font-black text-red-500 uppercase tracking-widest text-xs flex items-center gap-2">
                            <LogOut size={16} /> Historique des Retraits Admin
                        </h3>
                    </div>
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-800 uppercase text-[9px] font-black text-zinc-500 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-3">Date/Heure</th>
                                    <th className="px-4 py-3">Motif / Association</th>
                                    <th className="px-4 py-3">Admin</th>
                                    <th className="px-4 py-3 text-right">Montant</th>
                                    {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                                {withdrawals.length === 0 ? (
                                    <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-12 text-center text-zinc-600 font-bold italic text-xs">Aucun retrait enregistré</td></tr>
                                ) : (
                                    withdrawals.map((w) => (
                                        <tr key={w.id} className="hover:bg-zinc-800/30 transition-all">
                                            <td className="px-4 py-3 font-bold text-xs text-zinc-400">
                                                {format(new Date(w.date), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="px-4 py-3 text-xs font-medium text-white">
                                                {w.description || <span className="text-zinc-600 italic">Sans motif</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                                        <User size={12} className="text-zinc-500" />
                                                    </div>
                                                    <span className="text-xs font-black uppercase text-zinc-200">{w.performedBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-red-500">-{w.amount} DA</td>
                                            {isAdmin && (
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => {
                                                            setEditingWithdrawal(w);
                                                            setWithdrawalAmount(w.amount);
                                                            setWithdrawalDescription(w.description);
                                                            setIsWithdrawalModalOpen(true);
                                                        }} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Modifier"><Edit2 size={14}/></button>
                                                        <button onClick={() => handleDeleteWithdrawal(w.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg" title="Supprimer"><Trash2 size={14}/></button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-40">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <div>
                  <h2 className="text-xl font-black text-gold uppercase tracking-widest font-luxury">Détails de Caisse</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase">{format(new Date(detailModal.date), 'dd MMMM yyyy')}</p>
                </div>
                <button onClick={() => setDetailModal(null)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={24}/></button>
            </div>
            
            <div className="p-6 space-y-8">
                {detailModal.initialCash > 0 && (
                  <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-700 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Fond de Caisse Initial</p>
                      {detailModal.initialCashLogs && detailModal.initialCashLogs.length > 0 && (
                        <p className="text-[10px] text-zinc-400 mt-1">
                          Dernière modif par <span className="font-bold text-white uppercase">{detailModal.initialCashLogs[0].user.username}</span> à {format(new Date(detailModal.initialCashLogs[0].createdAt), 'HH:mm')}
                        </p>
                      )}
                    </div>
                    <p className="text-xl font-black text-white">{detailModal.initialCash} DA</p>
                  </div>
                )}
                {/* Summary in modal */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Entrées (+)</p>
                    <p className="text-xl font-black text-green-400">+{detailModal.totalRentals} DA</p>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Dépenses (-)</p>
                    <p className="text-xl font-black text-red-400">-{detailModal.totalExpenses} DA</p>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-700 text-center">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Retraits Admin (-)</p>
                    <p className="text-xl font-black text-red-500">-{detailModal.withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0} DA</p>
                  </div>
                  <div className="bg-gold/10 p-4 rounded-xl border border-gold/20 text-center">
                    <p className="text-[10px] font-black text-gold uppercase mb-1">Caisse</p>
                    <p className="text-xl font-black text-gold">{detailModal.finalBalance} DA</p>
                  </div>
                </div>

                {/* Unified Chronology for Past Days */}
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Receipt className="text-gold" size={18} /> Journal Chronologique
                  </h3>
                  <div className="bg-zinc-800/30 rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Détails</th>
                          <th className="px-4 py-3">Par</th>
                          <th className="px-4 py-3 text-right">Montant</th>
                          {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {(() => {
                          const movements = [
                            ...detailModal.payments.map(p => ({ 
                              id: p.id,
                              type: 'LOCATION', 
                              desc: `${p.rental.customer.firstName} ${p.rental.customer.lastName} (#${p.rentalId})`, 
                              by: p.performedBy || 'N/S', 
                              amount: p.amount,
                              color: 'text-green-400',
                              original: p,
                              category: 'payment'
                            })),
                            ...(detailModal.sales || []).map(s => ({ 
                              id: s.id,
                              type: 'VENTE', 
                              desc: `${s.customerName} (#${s.id})`, 
                              by: s.performedBy || 'N/S', 
                              amount: s.totalAmount,
                              color: 'text-green-400',
                              original: s,
                              category: 'sale'
                            })),
                            ...detailModal.expenses.map(e => ({ 
                              id: e.id,
                              type: 'DÉPENSE', 
                              desc: e.description, 
                              by: e.performedBy || 'N/S', 
                              amount: -e.amount,
                              color: 'text-red-400',
                              original: e,
                              category: 'expense'
                            })),
                            ...(detailModal.withdrawals || []).map(w => ({ 
                              id: w.id,
                              type: 'RETRAIT', 
                              desc: w.description || 'Retrait Admin', 
                              by: w.performedBy || 'Admin', 
                              amount: -w.amount,
                              color: 'text-red-500',
                              original: w,
                              category: 'withdrawal'
                            }))
                          ].sort((a, b) => {
                            const dateA = new Date(a.original.createdAt || a.original.date);
                            const dateB = new Date(b.original.createdAt || b.original.date);
                            return dateB - dateA;
                          });

                          if (movements.length === 0) {
                            return <tr><td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-zinc-600 font-bold italic text-xs">Aucun mouvement pour cette journée</td></tr>;
                          }

                          return movements.map((m, idx) => (
                            <tr key={idx} className="text-xs hover:bg-zinc-800/20 transition-all group">
                              <td className="px-4 py-3">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${m.amount > 0 ? 'border-green-500/20 text-green-500 bg-green-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                                  {m.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-bold text-white uppercase truncate max-w-[200px]">{m.desc}</p>
                                <p className="text-[9px] text-zinc-500">
                                  {format(new Date(m.original.createdAt || m.original.date), 'HH:mm')}
                                </p>
                              </td>
                              <td className="px-4 py-3 font-bold text-[10px] uppercase text-zinc-400">{m.by}</td>
                              <td className={`px-4 py-3 text-right font-black ${m.color}`}>{m.amount > 0 ? '+' : ''}{m.amount} DA</td>
                              {isAdmin && (
                                <td className="px-4 py-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {m.category === 'payment' && (
                                          <>
                                            <button onClick={() => { setEditingPayment(m.original); setEditAmount(m.original.amount); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded" title="Modifier"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDeletePayment(m.original.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                          </>
                                        )}
                                        {m.category === 'sale' && (
                                          <>
                                            <button onClick={() => { setEditingSale(m.original); setNewSale({ customerName: m.original.customerName, customerPhone: m.original.customerPhone, totalAmount: m.original.totalAmount, remarks: m.original.remarks || '' }); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded" title="Modifier"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDeleteSale(m.original.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                          </>
                                        )}
                                        {m.category === 'expense' && (
                                          <>
                                            <button onClick={() => { setEditingExpense(m.original); setNewExpense({ amount: m.original.amount, description: m.original.description, slipNumber: m.original.slipNumber || '', category: 'AUTRE' }); setIsExpenseModalOpen(true); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded" title="Modifier"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDeleteExpense(m.original.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                          </>
                                        )}
                                        {m.category === 'withdrawal' && (
                                          <>
                                            <button onClick={() => { setEditingWithdrawal(m.original); setWithdrawalAmount(m.original.amount); setWithdrawalDescription(m.original.description); setIsWithdrawalModalOpen(true); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded" title="Modifier"><Edit2 size={12} /></button>
                                            <button onClick={() => handleDeleteWithdrawal(m.original.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded" title="Supprimer"><Trash2 size={12} /></button>
                                          </>
                                        )}
                                    </div>
                                </td>
                              )}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
                                    {s.items.map((si, j) => (
                                      <span key={j} className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-[9px]">
                                        {si.name} (T:{si.size || '-'}, C:{si.color || '-'})
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3 font-bold text-[10px] uppercase text-zinc-400">{s.performedBy}</td>
                                <td className="px-4 py-3 text-right font-black text-blue-400">+{s.totalAmount} DA</td>
                                {isAdmin && (
                                  <td className="px-4 py-3 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setEditingSale(s); setEditSaleAmount(s.totalAmount); }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded transition-colors" title="Modifier"><Edit2 size={12} /></button>
                                          <button onClick={() => handleDeleteSale(s.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors" title="Supprimer"><Trash2 size={12} /></button>
                                      </div>
                                  </td>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Expenses Section */}
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ArrowUpCircle className="text-red-400" size={18} /> Dépenses (Sorties)
                  </h3>
                  <div className="bg-zinc-800/30 rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-800 text-[10px] font-black text-zinc-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">Réf/Bon</th>
                          <th className="px-4 py-3">Motif / Description</th>
                          <th className="px-4 py-3">Par</th>
                          <th className="px-4 py-3">Date/Heure</th>
                          <th className="px-4 py-3 text-right">Montant</th>
                          {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {detailModal.expenses.length === 0 ? (
                          <tr><td colSpan={isAdmin ? 6 : 5} className="p-4 text-center text-zinc-600 font-bold italic text-xs">Aucune dépense</td></tr>
                        ) : (
                          detailModal.expenses.map((e, i) => (
                            <tr key={i} className="text-xs">
                              <td className="px-4 py-3 font-bold text-gold">{e.slipNumber || 'N/S'}</td>
                              <td className="px-4 py-3 font-medium text-white">{e.description}</td>
                              <td className="px-4 py-3 text-[10px] font-black uppercase text-zinc-500">{e.performedBy || 'N/S'}</td>
                              <td className="px-4 py-3 text-zinc-500">{format(new Date(e.date), 'HH:mm')}</td>
                              <td className="px-4 py-3 text-right font-black text-red-400">-{e.amount} DA</td>
                              {isAdmin && (
                                <td className="px-4 py-3 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button onClick={() => { 
                                      setEditingExpense(e); 
                                      setNewExpense({ amount: e.amount, description: e.description, slipNumber: e.slipNumber || '', category: 'AUTRE' });
                                      setIsExpenseModalOpen(true);
                                    }} className="p-1 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"><Edit2 size={12} /></button>
                                    <button onClick={() => handleDeleteExpense(e.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded transition-colors"><Trash2 size={12} /></button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Initial Cash Modal */}
      {isInitialCashModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-gold/20">
            <h2 className="text-xl font-black text-gold uppercase mb-6">Ajouter Monnaie d'Ouverture</h2>
            <form onSubmit={handleSetInitialCash} className="space-y-4">
              <input type="number" className="w-full p-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white font-black text-2xl" value={initialAmount} onChange={(e) => setInitialAmount(e.target.value)} placeholder="0.00" required />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsInitialCashModalOpen(false)} className="flex-1 py-3 text-zinc-400 font-bold">Annuler</button>
                {isAdmin && dailyCash.initialCash > 0 && (
                    <button 
                        type="button" 
                        onClick={async () => {
                            if (confirm('Réinitialiser le fond de caisse à 0 ?')) {
                                await api.post('/cash/initial', { amount: 0 });
                                setIsInitialCashModalOpen(false);
                                fetchData();
                            }
                        }}
                        className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold border border-red-500/20"
                    >
                        Réinitialiser
                    </button>
                )}
                <button type="submit" className="flex-1 py-3 bg-gold text-rich-black rounded-xl font-black uppercase">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-red-400 uppercase tracking-widest font-luxury">{editingExpense ? 'Modifier' : 'Sortie de'} Caisse</h2>
                <button onClick={() => { setIsExpenseModalOpen(false); setEditingExpense(null); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Montant</label>
                    <input type="number" className="w-full p-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-red-400 font-black text-2xl" value={newExpense.amount} onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})} placeholder="0.00" required />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Catégorie</label>
                    <select className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white font-bold" value={newExpense.category} onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}>
                        <option value="COUTURE">COUTURE</option>
                        <option value="NETTOYAGE">NETTOYAGE</option>
                        <option value="ACHAT">ACHAT</option>
                        <option value="AUTRE">AUTRE</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Référence (N° Bon)</label>
                    <input type="text" className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white font-bold" value={newExpense.slipNumber} onChange={(e) => setNewExpense({...newExpense, slipNumber: e.target.value})} placeholder="Ex: BON-001" />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Justification</label>
                    <textarea className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white font-medium min-h-[100px]" value={newExpense.description} onChange={(e) => setNewExpense({...newExpense, description: e.target.value})} placeholder="Détails de la dépense..." required />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase mt-2">{editingExpense ? 'ENREGISTRER LES MODIFICATIONS' : 'CONFIRMER LA SORTIE'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-red-500/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-red-500 uppercase tracking-widest font-luxury">{editingWithdrawal ? 'Modifier' : 'Retrait d\'Argent'} (ADMIN)</h2>
                <button onClick={() => { setIsWithdrawalModalOpen(false); setEditingWithdrawal(null); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateWithdrawal} className="p-6 space-y-6">
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 mb-4">
                  <p className="text-[10px] text-red-400 font-bold uppercase text-center leading-relaxed">
                    Attention : Ce retrait sera enregistré au nom de <span className="text-white underline">{user?.username}</span> et sera déduit du solde final de la caisse.
                  </p>
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Montant du Retrait</label>
                    <input 
                      type="number" 
                      className="w-full p-4 bg-zinc-800 border-2 border-red-500/50 rounded-xl text-white font-black text-3xl text-center" 
                      value={withdrawalAmount} 
                      onChange={(e) => setWithdrawalAmount(e.target.value)} 
                      placeholder="0.00" 
                      required 
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Motif du Retrait (Association)</label>
                    <textarea 
                      className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white font-medium min-h-[80px]" 
                      value={withdrawalDescription} 
                      onChange={(e) => setWithdrawalDescription(e.target.value)} 
                      placeholder="Indiquez la raison ou l'association..." 
                      required 
                    />
                </div>
                <div className="flex flex-col gap-2">
                  <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase transition-all active:scale-95 shadow-lg shadow-red-900/20">{editingWithdrawal ? 'SAUVEGARDER' : 'CONFIRMER LE RETRAIT'}</button>
                  <button type="button" onClick={() => { setIsWithdrawalModalOpen(false); setEditingWithdrawal(null); }} className="w-full py-3 text-zinc-500 font-bold uppercase text-xs">Annuler</button>
                </div>
            </form>
          </div>
        </div>
      )}
      {/* Payment Editing Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-gold uppercase tracking-widest font-luxury">Modifier Versement</h2>
                <button onClick={() => { setEditingPayment(null); setEditAmount(''); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Montant</label>
                    <input type="number" className="w-full p-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-green-400 font-black text-2xl" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} required />
                </div>
                <button type="submit" className="w-full py-4 bg-gold text-rich-black rounded-xl font-black uppercase mt-2">SAUVEGARDER</button>
            </form>
          </div>
        </div>
      )}

      {/* Sale Editing Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-blue-500/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-blue-400 uppercase tracking-widest font-luxury">Modifier Vente #{editingSale.id.toString().padStart(5, '0')}</h2>
                <button onClick={() => { setEditingSale(null); setEditSaleAmount(''); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateSale} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Montant Total</label>
                    <input type="number" className="w-full p-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-blue-400 font-black text-2xl" value={editSaleAmount} onChange={(e) => setEditSaleAmount(e.target.value)} required />
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase mt-2 transition-colors">SAUVEGARDER</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Cash;
