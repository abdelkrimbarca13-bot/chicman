import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { History, User, Clock, Info, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

const Audit = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
          return `Dépense: ${data.amount} DA - ${data.description}`;
          
        case 'CREATE_WITHDRAWAL':
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
    'UPDATE_ITEM_STATUS': 'MàJ Statut Article',
    'DELETE_ITEM': 'Suppression Article',
    'BULK_IMPORT_ITEMS': 'Import Massif Articles',
    'CREATE_CUSTOMER': 'Nouveau Client',
    'UPDATE_CUSTOMER': 'Modification Client',
    'DELETE_CUSTOMER': 'Suppression Client',
    'TOGGLE_BLACKLIST': 'Liste Noire',
    'CREATE_EXPENSE': 'Nouvelle Dépense',
    'CREATE_WITHDRAWAL': 'Sortie de Caisse',
    'LOGIN': 'Connexion'
  };

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Historique des Actions</h1>
      
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
