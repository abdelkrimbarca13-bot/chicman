import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Search, Scissors, CheckCircle2 } from 'lucide-react';

const Tailor = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchItems = () => {
    api.get('/items').then(res => {
      if (Array.isArray(res.data)) {
        // Filter for items with status TAILOR
        setItems(res.data.filter(item => item.status === 'TAILOR'));
      } else {
        setItems([]);
      }
    }).catch(err => {
      console.error(err);
      setItems([]);
    });
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleFinishTailor = async (itemId) => {
    if (confirm('Marquer cet article comme prêt et disponible ?')) {
        try {
          await api.put(`/items/${itemId}/status`, { status: 'AVAILABLE' });
          fetchItems();
        } catch (err) {
          alert('Erreur lors de la mise à jour : ' + (err.response?.data?.error || err.message));
        }
    }
  };

  const filteredItems = items.filter(item => {
    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.reference.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Liste Tailleur</h1>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher un article chez le tailleur..."
            className="w-full pl-10 pr-4 py-2 border border-zinc-800 rounded-lg focus:ring-2 focus:ring-gold bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl overflow-hidden border border-gold/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-zinc-100 dark:bg-zinc-800 uppercase text-[10px] font-bold text-zinc-500 dark:text-zinc-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Réf</th>
                <th className="px-6 py-4">Article</th>
                <th className="px-6 py-4">Détails</th>
                <th className="px-6 py-4 text-gold">Remarques Tailleur</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
            {filteredItems.length === 0 ? (
                <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-zinc-500 font-bold uppercase tracking-widest">
                        Aucun article chez le tailleur
                    </td>
                </tr>
            ) : filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm font-bold text-gold">{item.reference}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-zinc-900 dark:text-white">{item.name}</div>
                  <div className="text-xs text-zinc-500 font-medium uppercase">{item.model}</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                    {item.type} - {item.size} - {item.color}
                </td>
                <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white bg-gold/5 italic border-l-2 border-gold/30">
                  {item.statusRemarks || 'Aucune remarque'}
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => handleFinishTailor(item.id)}
                    className="flex items-center gap-2 bg-green-600/20 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg hover:bg-green-600/40 transition-all font-bold text-xs uppercase"
                  >
                    <CheckCircle2 size={14} /> Terminé
                  </button>
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

export default Tailor;
