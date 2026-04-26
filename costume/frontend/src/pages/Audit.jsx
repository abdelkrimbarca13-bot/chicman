import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { History, User, Clock, Info, ShieldAlert, Search, Receipt, Calendar, X } from 'lucide-react';
import { format } from 'date-fns';

const Audit = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await api.get(`/cash/search?query=${searchQuery}`);
      setSearchResult(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Aucun bon trouvé');
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get('/audit')
        .then(res => setLogs(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <ShieldAlert size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold">Accès Refusé</h2>
        <p>Seul l'administrateur peut consulter l'historique des actions.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
    </div>
  );

  const formatDetails = (details, action) => {
    if (!details) return '-';
    try {
      const data = JSON.parse(details);
      
      switch (action) {
        case 'CREATE_RENTAL':
        case 'UPDATE_RENTAL':
        case 'ACTIVATE_RENTAL':
        case 'RETURN_RENTAL':
        case 'DELETE_RENTAL':
        case 'UPDATE_PAYMENT':
        case 'DELETE_PAYMENT':
          return `Location #${data.rentalId?.toString().padStart(5, '0') || '?'}`;
          
        case 'CREATE_ITEM':
        case 'UPDATE_ITEM':
        case 'DELETE_ITEM':
        case 'UPDATE_ITEM_STATUS':
          return `Article: ${data.name || data.reference || data.id || '?'}`;
          
        case 'CREATE_CUSTOMER':
        case 'UPDATE_CUSTOMER':
        case 'DELETE_CUSTOMER':
        case 'TOGGLE_BLACKLIST':
          return `Client: ${data.name || data.customerId || '?'}`;
          
        case 'CREATE_EXPENSE':
        case 'UPDATE_EXPENSE':
        case 'DELETE_EXPENSE':
          return `Dépense: ${data.amount} DA - ${data.description}`;
          
        case 'CREATE_WITHDRAWAL':
        case 'UPDATE_WITHDRAWAL':
        case 'DELETE_WITHDRAWAL':
          return `Retrait: ${data.amount} DA - ${data.description}`;
          
        default:
          return details;
      }
    } catch {
      return details;
    }
  };

  const actionMapping = {
    'CREATE_RENTAL': 'Création Location',
    'ACTIVATE_RENTAL': 'Activation Location',
    'RETURN_RENTAL': 'Retour Location',
    'UPDATE_RENTAL': 'Modification Location',
    'DELETE_RENTAL': 'Suppression Location',
    'CREATE_ITEM': 'Création Article',
    'UPDATE_ITEM': 'Modification Article',
    'UPDATE_ITEM_STATUS': 'Statut Article',
    'DELETE_ITEM': 'Suppression Article',
    'BULK_IMPORT_ITEMS': 'Import Massif Articles',
    'CREATE_CUSTOMER': 'Nouveau Client',
    'UPDATE_CUSTOMER': 'Modification Client',
    'DELETE_CUSTOMER': 'Suppression Client',
    'TOGGLE_BLACKLIST': 'Liste Noire',
    'CREATE_EXPENSE': 'Nouvelle Dépense',
    'UPDATE_EXPENSE': 'Modif Dépense',
    'DELETE_EXPENSE': 'Suppr Dépense',
    'CREATE_WITHDRAWAL': 'Sortie de Caisse',
    'UPDATE_WITHDRAWAL': 'Modif Retrait',
    'DELETE_WITHDRAWAL': 'Suppr Retrait',
    'UPDATE_PAYMENT': 'Modif Paiement',
    'DELETE_PAYMENT': 'Suppr Paiement',
    'LOGIN': 'Connexion'
  };

  return (
    <div className="pb-10">
      <div className="flex justify-between items-center mb-8 border-b-2 border-gold/50 pb-2">
        <h1 className="text-3xl font-black font-luxury tracking-wider text-gold uppercase">Historique des Actions</h1>
        
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <input 
              type="text" 
              className="w-full p-2 pl-10 bg-zinc-900 border border-gold/30 rounded-lg text-sm font-bold text-white focus:border-gold outline-none" 
              placeholder="Chercher un Bon (N° ou ID)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
            <button type="submit" className="absolute right-1 top-1 bg-gold text-rich-black px-3 py-1 rounded text-[10px] font-black uppercase">Chercher</button>
        </form>
      </div>

      {searchResult && (
        <div className="bg-zinc-900 border-2 border-gold rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300 mb-8 shadow-2xl">
          <div className="p-4 bg-gold flex justify-between items-center">
            <h3 className="font-black text-rich-black uppercase tracking-widest flex items-center gap-2">
              <Receipt size={18} /> Résultat de la recherche : {searchResult.type === 'EXPENSE' ? 'Dépense' : 'Location'}
            </h3>
            <button onClick={() => setSearchResult(null)} className="text-rich-black/60 hover:text-rich-black"><X size={20}/></button>
          </div>
          <div className="p-6">
            {searchResult.type === 'EXPENSE' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">N° Bon</p>
                    <p className="font-bold text-gold text-xl">{searchResult.data.slipNumber || 'N/S'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Description / Motif</p>
                    <p className="font-medium text-white">{searchResult.data.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Montant</p>
                    <p className="font-black text-red-400 text-2xl">-{searchResult.data.amount} DA</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Date</p>
                    <p className="font-bold text-white text-sm">{format(new Date(searchResult.data.date), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Par</p>
                    <p className="font-black text-zinc-400 uppercase text-xs">{searchResult.data.performedBy || 'Inconnu'}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-6 mt-6">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <History size={14} className="text-gold" /> Historique des Actions sur cette Dépense
                  </p>
                  <div className="space-y-3">
                    {searchResult.logs && searchResult.logs.length > 0 ? (
                      searchResult.logs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter bg-red-900/20 text-red-400 border border-red-900/30 w-fit mb-1`}>
                                {actionMapping[log.action] || log.action}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">
                                    {formatDetails(log.details, log.action)}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-zinc-300">
                              par <span className="text-gold uppercase tracking-tighter">{log.user?.username}</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-500 italic">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Aucun log trouvé pour cette dépense.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 border-b border-zinc-800 pb-6">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">N° Location</p>
                    <p className="font-bold text-gold text-2xl">#{searchResult.data.id.toString().padStart(5, '0')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Client</p>
                    <p className="font-bold text-white text-lg uppercase">{searchResult.data.customer.firstName} {searchResult.data.customer.lastName}</p>
                    <p className="text-xs text-zinc-500">{searchResult.data.customer.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Status</p>
                    <span className={`px-2 py-1 rounded text-[10px] font-black ${
                      searchResult.data.status === 'RETURNED' ? 'bg-green-500/20 text-green-500' : 
                      searchResult.data.status === 'DELAYED' ? 'bg-red-500/20 text-red-500' : 'bg-gold/20 text-gold'
                    }`}>
                      {searchResult.data.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Total Payé</p>
                    <p className="font-black text-green-400 text-2xl">{searchResult.data.payments.reduce((sum, p) => sum + p.amount, 0)} DA</p>
                    <p className="text-[10px] text-zinc-500">Sur un total de {searchResult.data.totalAmount} DA</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">Articles Loués</p>
                    <div className="space-y-2">
                      {searchResult.data.items.map((ri, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded border border-zinc-700">
                           <span className="text-xs font-bold text-white">{ri.item.name}</span>
                           <div className="flex gap-2">
                             <span className="text-[10px] text-zinc-500 uppercase">Taille: {ri.item.size}</span>
                             <span className="text-[10px] text-gold uppercase">Couleur: {ri.item.color}</span>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">Historique Paiements</p>
                    <div className="space-y-2">
                      {searchResult.data.payments.map((p, i) => (
                        <div key={i} className="flex justify-between items-center bg-zinc-800/50 p-2 rounded border border-zinc-700">
                          <span className="text-xs text-zinc-400">{format(new Date(p.createdAt), 'dd/MM/yyyy')}</span>
                          <span className="text-sm font-black text-green-400">+{p.amount} DA</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <p className="text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                    <History size={14} className="text-gold" /> Historique complet des Actions sur cette Location
                  </p>
                  <div className="space-y-3">
                    {searchResult.logs && searchResult.logs.length > 0 ? (
                      searchResult.logs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between bg-zinc-800/30 p-3 rounded-lg border border-zinc-800/50">
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-black uppercase tracking-tighter border mb-1 w-fit ${
                                    log.action.includes('DELETE') ? 'bg-red-900/20 text-red-400 border-red-900/30' :
                                    log.action.includes('CREATE') || log.action.includes('ACTIVATE') ? 'bg-green-900/20 text-green-400 border-green-900/30' :
                                    'bg-blue-900/20 text-blue-400 border-blue-900/30'
                                }`}>
                                    {actionMapping[log.action] || log.action}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">
                                    {formatDetails(log.details, log.action)}
                                </span>
                            </div>
                            <span className="text-xs font-bold text-zinc-300">
                              par <span className="text-gold uppercase tracking-tighter">{log.user?.username}</span>
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-zinc-500 italic">
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-600 italic">Aucun log trouvé pour cette location.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gold/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] font-black tracking-widest text-zinc-400">
              <tr>
                <th className="px-6 py-4">Utilisateur</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4">Date et Heure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-800 dark:text-zinc-300">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-2">
                    <User size={14} className="text-gold" />
                    <span className="font-bold">{log.user?.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter ${
                      log.action.includes('DELETE') ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                      log.action.includes('CREATE') || log.action.includes('ACTIVATE') ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50' :
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                    }`}>
                      {actionMapping[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-500 max-w-xs truncate">
                    {formatDetails(log.details, log.action)}
                  </td>
                  <td className="px-6 py-4 flex items-center gap-2 text-xs">
                    <Clock size={14} className="text-zinc-500" />
                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Audit;
