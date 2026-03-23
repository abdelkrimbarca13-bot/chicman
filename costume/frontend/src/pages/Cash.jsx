import React, { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Plus, Receipt, Calculator, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

const Cash = () => {
  const [dailyCash, setDailyCash] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isInitialCashModalOpen, setIsInitialCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', slipNumber: '' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [cashRes, expenseRes, historyRes] = await Promise.all([
        api.get('/cash/status'),
        api.get(`/cash/expenses?date=${today}`),
        api.get('/cash/history')
      ]);
      setDailyCash(cashRes.data);
      setExpenses(expenseRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Erreur chargement caisse', err);
      setError('Erreur lors du chargement des données de la caisse. Veuillez vérifier votre connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetInitialCash = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash/initial', { amount: parseFloat(initialAmount) });
      setIsInitialCashModalOpen(false);
      setInitialAmount('');
      fetchData();
    } catch {
      alert('Erreur lors de la mise à jour de la monnaie initiale');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash/expense', newExpense);
      setIsExpenseModalOpen(false);
      setNewExpense({ amount: '', description: '', slipNumber: '' });
      fetchData();
    } catch {
      alert('Erreur lors de l\'enregistrement de la dépense');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-gray-500 uppercase tracking-widest animate-pulse">Chargement de la caisse...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border-2 border-red-100 inline-block max-w-md">
            <h2 className="text-xl font-black mb-2 uppercase">Une erreur est survenue</h2>
            <p className="font-bold text-sm mb-4">{error}</p>
            <button 
                onClick={fetchData}
                className="px-6 py-2 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 transition-colors"
            >
                RÉESSAYER
            </button>
        </div>
    </div>
  );

  if (!dailyCash) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-gold font-luxury tracking-widest uppercase border-b-2 border-gold/30 pb-2">Gestion de la Caisse</h1>
        <div className="flex bg-zinc-900 rounded-xl shadow-lg border border-zinc-800 p-1 w-full sm:w-auto">
            <button 
                onClick={() => setActiveTab('current')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'current' ? 'bg-gold text-rich-black shadow-md' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
                Aujourd'hui
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-black text-[10px] sm:text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-gold text-rich-black shadow-md' : 'text-zinc-500 hover:bg-zinc-800'}`}
            >
                Historique
            </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-gold/10 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 text-gold group-hover:scale-110 transition-transform">
                <DollarSign size={100} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Monnaie Initiale</p>
            <h3 className="text-2xl font-black text-white">{dailyCash.initialCash} DA</h3>
            <button 
                onClick={() => setIsInitialCashModalOpen(true)}
                className="mt-4 text-[10px] font-black uppercase text-gold hover:text-light-gold flex items-center gap-1 transition-colors"
            >
                <Plus size={12} /> Modifier
            </button>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-gold/10 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 text-green-500 group-hover:scale-110 transition-transform">
                <ArrowDownCircle size={100} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Recette Locations</p>
            <h3 className="text-2xl font-black text-green-400">+{dailyCash.totalRentals} DA</h3>
            <p className="mt-4 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter">Entrées du jour</p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-2xl shadow-xl border border-gold/10 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 text-red-500 group-hover:scale-110 transition-transform">
                <ArrowUpCircle size={100} />
            </div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Dépenses (Sorties)</p>
            <h3 className="text-2xl font-black text-red-400">-{dailyCash.totalExpenses} DA</h3>
            <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-4 text-[10px] font-black uppercase text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
            >
                <Plus size={12} /> Ajouter Dépense
            </button>
        </div>

        <div className="bg-gold p-6 rounded-2xl shadow-2xl relative overflow-hidden group shadow-gold/20">
            <div className="absolute right-[-10px] top-[-10px] opacity-20 text-rich-black group-hover:scale-110 transition-transform">
                <Calculator size={100} />
            </div>
            <p className="text-[10px] font-black text-rich-black/60 uppercase tracking-widest mb-1">Solde Final Caisse</p>
            <h3 className="text-3xl font-black text-rich-black">{dailyCash.finalBalance} DA</h3>
            <p className="mt-4 text-[10px] font-bold text-rich-black/40 uppercase tracking-tighter">Argent réel en caisse</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses Table */}
        <div className="bg-zinc-900 rounded-2xl shadow-xl border border-gold/10 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/50">
                <h3 className="font-black text-gold uppercase tracking-widest flex items-center gap-2 font-luxury text-sm">
                    <ArrowUpCircle className="text-red-400" size={20} />
                    Dépenses de la journée
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-zinc-800 uppercase text-[10px] font-black text-zinc-500">
                        <tr>
                            <th className="px-6 py-4 tracking-wider">Bon N°</th>
                            <th className="px-6 py-4 tracking-wider">Description</th>
                            <th className="px-6 py-4 text-right tracking-wider">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 text-zinc-300">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-zinc-600 font-bold italic text-sm tracking-tight">Aucune dépense enregistrée</td>
                            </tr>
                        ) : (
                            expenses.map((exp, idx) => (
                                <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-gold">{exp.slipNumber || 'N/S'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-white">{exp.description}</td>
                                    <td className="px-6 py-4 text-right font-black text-red-400">-{exp.amount} DA</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Daily Summary Report Style */}
        <div className="bg-zinc-900 rounded-2xl shadow-xl border border-gold/10 p-8 space-y-6 flex flex-col justify-center relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
            <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4 border border-gold/20 shadow-lg shadow-gold/5">
                    <Receipt size={32} />
                </div>
                <h3 className="text-2xl font-black text-gold uppercase tracking-widest font-luxury">Rapport de Fin de Journée</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Résumé automatique du {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            <div className="space-y-4 border-y-2 border-dashed border-zinc-800 py-8">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Caisse de départ (+)</span>
                    <span className="font-black text-white text-lg">{dailyCash.initialCash} DA</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Recettes (+)</span>
                    <span className="font-black text-green-400 text-lg">{dailyCash.totalRentals} DA</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total Dépenses (-)</span>
                    <span className="font-black text-red-400 text-lg">{dailyCash.totalExpenses} DA</span>
                </div>
            </div>

            <div className="flex justify-between items-center pt-6">
                <span className="text-lg font-black text-white uppercase tracking-widest font-luxury">SOLDE FINAL</span>
                <span className="text-4xl font-black text-gold underline decoration-gold/30 decoration-4 underline-offset-[12px]">{dailyCash.finalBalance} DA</span>
            </div>
        </div>
      </div>
      </>
      ) : (
        <div className="space-y-6">
            <div className="bg-zinc-900 p-4 rounded-xl shadow-xl border border-zinc-800 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Filtrer par Période (Caisse)</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                            <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm font-bold text-white"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            />
                        </div>
                        <span className="text-zinc-600 font-bold">au</span>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                            <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:ring-2 focus:ring-gold outline-none text-sm font-bold text-white"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="px-4 py-2 text-gold hover:bg-gold/10 font-black text-xs uppercase rounded-lg transition-colors border border-gold/20"
                >
                Réinitialiser
                </button>
            </div>

            <div className="bg-zinc-900 rounded-2xl shadow-xl border border-gold/10 overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/30">
                    <h3 className="font-black text-gold uppercase tracking-widest flex items-center gap-2 font-luxury text-sm">
                        <Receipt className="text-gold" size={20} />
                        Historique des Clôtures de Caisse
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-800/50 uppercase text-[10px] font-black text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 tracking-wider">Date</th>
                                <th className="px-6 py-4 tracking-wider">Fond de Caisse</th>
                                <th className="px-6 py-4 text-green-500/80 tracking-wider">Recettes (+)</th>
                                <th className="px-6 py-4 text-red-500/80 tracking-wider">Dépenses (-)</th>
                                <th className="px-6 py-4 font-black text-gold tracking-wider">Solde Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800 text-zinc-300">
                            {history.filter(day => {
                                let matches = true;
                                const dayDate = new Date(day.date);
                                dayDate.setHours(0,0,0,0);
                                if (filterStartDate) {
                                    const start = new Date(filterStartDate);
                                    start.setHours(0,0,0,0);
                                    if (dayDate < start) matches = false;
                                }
                                if (filterEndDate) {
                                    const end = new Date(filterEndDate);
                                    end.setHours(23,59,59,999);
                                    if (dayDate > end) matches = false;
                                }
                                return matches;
                            }).length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-600 font-bold italic text-sm tracking-tight">Aucun historique disponible pour cette période</td>
                                </tr>
                            ) : (
                                history.filter(day => {
                                    let matches = true;
                                    const dayDate = new Date(day.date);
                                    dayDate.setHours(0,0,0,0);
                                    if (filterStartDate) {
                                        const start = new Date(filterStartDate);
                                        start.setHours(0,0,0,0);
                                        if (dayDate < start) matches = false;
                                    }
                                    if (filterEndDate) {
                                        const end = new Date(filterEndDate);
                                        end.setHours(23,59,59,999);
                                        if (dayDate > end) matches = false;
                                    }
                                    return matches;
                                }).map((day, idx) => (
                                    <tr key={idx} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-zinc-200">{format(new Date(day.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-zinc-400">{day.initialCash} DA</td>
                                        <td className="px-6 py-4 font-black text-green-400">+{day.totalRentals} DA</td>
                                        <td className="px-6 py-4 font-black text-red-400">-{day.totalExpenses} DA</td>
                                        <td className="px-6 py-4 font-black text-gold text-lg italic tracking-tighter">{day.finalBalance} DA</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Modals */}
      {isInitialCashModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-gold uppercase tracking-widest font-luxury">Monnaie Initiale</h2>
                <button onClick={() => setIsInitialCashModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSetInitialCash} className="p-6 space-y-6">
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-2 tracking-widest">Montant de départ en caisse</label>
                    <div className="relative">
                        <DollarSign className="absolute left-4 top-4 text-gold" size={24} />
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-4 py-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-gold font-black text-3xl text-white shadow-inner"
                            value={initialAmount}
                            onChange={(e) => setInitialAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="w-full py-4 bg-gold text-rich-black rounded-xl font-black uppercase tracking-widest hover:bg-light-gold shadow-xl shadow-gold/10 transition-all transform active:scale-95">
                    ENREGISTRER LE DÉPART
                </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md border border-gold/20">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="text-xl font-black text-red-400 uppercase tracking-widest font-luxury">Sortie de Caisse</h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Montant</label>
                    <input 
                        type="number" 
                        className="w-full p-4 bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-red-500 font-black text-2xl text-red-400 shadow-inner"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Référence (N° Bon)</label>
                    <input 
                        type="text" 
                        className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-gold text-white font-bold"
                        value={newExpense.slipNumber}
                        onChange={(e) => setNewExpense({...newExpense, slipNumber: e.target.value})}
                        placeholder="Ex: BON-001"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-zinc-500 mb-1 tracking-widest">Justification / Description</label>
                    <textarea 
                        className="w-full p-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl outline-none focus:border-gold text-white font-medium min-h-[100px]"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Ex: Achat fournitures bureau..."
                        required
                    />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase tracking-widest hover:bg-red-700 shadow-xl transition-all transform active:scale-95 mt-2">
                    CONFIRMER LA SORTIE
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cash;
