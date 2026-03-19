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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-gray-800">Gestion de la Caisse</h1>
        <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1">
            <button 
                onClick={() => setActiveTab('current')}
                className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${activeTab === 'current' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                Aujourd'hui
            </button>
            <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-black text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                Historique
            </button>
        </div>
      </div>

      {activeTab === 'current' ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-5 group-hover:scale-110 transition-transform">
                <DollarSign size={100} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Monnaie Initiale</p>
            <h3 className="text-2xl font-black text-gray-800">{dailyCash.initialCash} DA</h3>
            <button 
                onClick={() => setIsInitialCashModalOpen(true)}
                className="mt-4 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
                <Plus size={12} /> Modifier
            </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-5 text-green-600 group-hover:scale-110 transition-transform">
                <ArrowDownCircle size={100} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Recette Locations</p>
            <h3 className="text-2xl font-black text-green-600">+{dailyCash.totalRentals} DA</h3>
            <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase">Entrées du jour</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-5 text-red-600 group-hover:scale-110 transition-transform">
                <ArrowUpCircle size={100} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Dépenses (Sorties)</p>
            <h3 className="text-2xl font-black text-red-600">-{dailyCash.totalExpenses} DA</h3>
            <button 
                onClick={() => setIsExpenseModalOpen(true)}
                className="mt-4 text-[10px] font-black uppercase text-red-600 hover:text-red-800 flex items-center gap-1"
            >
                <Plus size={12} /> Ajouter Dépense
            </button>
        </div>

        <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg relative overflow-hidden group">
            <div className="absolute right-[-10px] top-[-10px] opacity-10 text-white group-hover:scale-110 transition-transform">
                <Calculator size={100} />
            </div>
            <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Solde Final Caisse</p>
            <h3 className="text-3xl font-black text-white">{dailyCash.finalBalance} DA</h3>
            <p className="mt-4 text-[10px] font-bold text-indigo-300 uppercase">Argent réel en caisse</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                    <ArrowUpCircle className="text-red-500" size={20} />
                    Dépenses de la journée
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 uppercase text-[10px] font-black text-gray-400">
                        <tr>
                            <th className="px-6 py-4">Bon N°</th>
                            <th className="px-6 py-4">Description</th>
                            <th className="px-6 py-4 text-right">Montant</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-gray-400 font-bold italic">Aucune dépense enregistrée</td>
                            </tr>
                        ) : (
                            expenses.map((exp, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{exp.slipNumber || 'N/S'}</td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{exp.description}</td>
                                    <td className="px-6 py-4 text-right font-black text-red-600">-{exp.amount} DA</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Daily Summary Report Style */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 flex flex-col justify-center">
            <div className="text-center space-y-2 mb-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt size={32} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Rapport de Fin de Journée</h3>
                <p className="text-gray-400 text-sm font-medium">Résumé financier automatique du {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>

            <div className="space-y-4 border-y-2 border-dashed border-gray-100 py-6">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Caisse de départ (+)</span>
                    <span className="font-black text-gray-800">{dailyCash.initialCash} DA</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Recettes (+)</span>
                    <span className="font-black text-green-600">{dailyCash.totalRentals} DA</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Dépenses (-)</span>
                    <span className="font-black text-red-600">{dailyCash.totalExpenses} DA</span>
                </div>
            </div>

            <div className="flex justify-between items-center pt-4">
                <span className="text-lg font-black text-gray-800 uppercase">SOLDE FINAL</span>
                <span className="text-3xl font-black text-indigo-600 underline decoration-indigo-200 decoration-4 underline-offset-8">{dailyCash.finalBalance} DA</span>
            </div>
        </div>
      </div>
      </>
      ) : (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[300px]">
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">Filtrer par Période (Caisse)</label>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={filterStartDate}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            />
                        </div>
                        <span className="text-gray-400 font-bold">au</span>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input 
                            type="date" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                            value={filterEndDate}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 font-black text-xs uppercase rounded-lg transition-colors"
                >
                Réinitialiser
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        <Receipt className="text-indigo-600" size={20} />
                        Historique des Clôtures de Caisse
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 uppercase text-[10px] font-black text-gray-400">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Fond de Caisse</th>
                                <th className="px-6 py-4 text-green-600">Recettes (+)</th>
                                <th className="px-6 py-4 text-red-600">Dépenses (-)</th>
                                <th className="px-6 py-4 font-black text-indigo-600">Solde Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
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
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-bold italic">Aucun historique disponible pour cette période</td>
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
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-700">{format(new Date(day.date), 'dd/MM/yyyy')}</td>
                                        <td className="px-6 py-4 font-medium text-gray-600">{day.initialCash} DA</td>
                                        <td className="px-6 py-4 font-black text-green-600">+{day.totalRentals} DA</td>
                                        <td className="px-6 py-4 font-black text-red-600">-{day.totalExpenses} DA</td>
                                        <td className="px-6 py-4 font-black text-indigo-600 text-lg">{day.finalBalance} DA</td>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">Monnaie Initiale</h2>
                <button onClick={() => setIsInitialCashModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSetInitialCash} className="p-6 space-y-6">
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Montant de départ en caisse</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-indigo-600" size={24} />
                        <input 
                            type="number" 
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 font-black text-2xl text-gray-800"
                            value={initialAmount}
                            onChange={(e) => setInitialAmount(e.target.value)}
                            placeholder="0.00"
                            autoFocus
                            required
                        />
                    </div>
                </div>
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 shadow-xl transition-all transform active:scale-95">
                    ENREGISTRER LE DÉPART
                </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">Sortie de Caisse</h2>
                <button onClick={() => setIsExpenseModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1">Montant</label>
                    <input 
                        type="number" 
                        className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-red-500 font-black text-xl text-red-600"
                        value={newExpense.amount}
                        onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                        placeholder="0.00"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1">Référence (N° Bon)</label>
                    <input 
                        type="text" 
                        className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 font-bold"
                        value={newExpense.slipNumber}
                        onChange={(e) => setNewExpense({...newExpense, slipNumber: e.target.value})}
                        placeholder="Ex: BON-001"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-1">Justification / Description</label>
                    <textarea 
                        className="w-full p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-indigo-500 font-medium min-h-[100px]"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        placeholder="Ex: Achat fournitures bureau..."
                        required
                    />
                </div>
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl font-black hover:bg-red-700 shadow-xl transition-all transform active:scale-95 mt-2">
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
