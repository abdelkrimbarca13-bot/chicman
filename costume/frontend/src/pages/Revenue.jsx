import React, { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { TrendingUp, Calendar, ChevronRight, ChevronDown } from 'lucide-react';

const Revenue = () => {
  const [groupedRevenue, setGroupedRevenue] = useState({});
  const [expandedDays, setExpandedDays] = useState({});

  const getMovementTypeLabel = (type) => {
    const labels = {
      DEPOSIT: 'Versement initial',
      REMAINDER: 'Solde location',
      REFUND: 'Remboursement'
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type) => {
    const colors = {
      DEPOSIT: 'bg-gold/10 text-gold border-gold/20',
      REMAINDER: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      REFUND: 'bg-red-500/10 text-red-500 border-red-500/20'
    };
    return colors[type] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const groupMovementsByDay = (data) => {
    const groups = data.reduce((acc, movement) => {
      const date = format(new Date(movement.date), 'yyyy-MM-dd');
      if (!acc[date]) acc[date] = { total: 0, items: [] };
      acc[date].total += movement.amount;
      acc[date].items.push(movement);
      return acc;
    }, {});
    setGroupedRevenue(groups);
    
    // Expand today by default
    const today = format(new Date(), 'yyyy-MM-dd');
    if (groups[today]) {
        setExpandedDays({ [today]: true });
    }
  };

  useEffect(() => {
    api.get('/rentals/cash/movements').then(res => {
      if (Array.isArray(res.data)) {
        groupMovementsByDay(res.data);
      } else {
        setGroupedRevenue({});
      }
    }).catch(err => {
      console.error(err);
      setGroupedRevenue({});
    });
  }, []);

  const toggleDay = (date) => {
    setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const sortedDates = Object.keys(groupedRevenue).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white">Suivi des Revenus</h1>
        <div className="w-full sm:w-auto bg-gold text-black px-6 py-3 rounded-xl shadow-lg flex items-center">
            <TrendingUp className="mr-3" />
            <div>
                <p className="text-[10px] uppercase font-bold opacity-80">Total Aujourd'hui</p>
                <p className="text-xl md:text-2xl font-black italic">
                    {groupedRevenue[format(new Date(), 'yyyy-MM-dd')]?.total || 0} DA
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedDates.map(date => (
          <div key={date} className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-800 overflow-hidden">
            <button 
              onClick={() => toggleDay(date)}
              className="w-full flex items-center justify-between p-5 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="text-gold mr-4" size={24} />
                <div className="text-left">
                  <p className="font-bold text-lg text-zinc-900 dark:text-white">
                    {format(new Date(date), 'dd MMMM yyyy')}
                    {date === format(new Date(), 'yyyy-MM-dd') && (
                        <span className="ml-3 bg-gold/20 text-gold text-xs px-2 py-1 rounded-full border border-gold/30">Aujourd'hui</span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-500">{groupedRevenue[date].items.length} transaction(s)</p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-xl font-black italic text-gold mr-6">{groupedRevenue[date].total} DA</p>
                {expandedDays[date] ? <ChevronDown size={20} className="text-zinc-500"/> : <ChevronRight size={20} className="text-zinc-500"/>}
              </div>
            </button>

            {expandedDays[date] && (
              <div className="border-t border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="text-[10px] sm:text-xs font-black uppercase text-zinc-500 border-b border-zinc-800 pb-2 bg-zinc-800/20">
                        <th className="py-4 px-4 whitespace-nowrap">Heure</th>
                        <th className="py-4 px-4 text-zinc-300">Client</th>
                        <th className="py-4 px-4 whitespace-nowrap">Type</th>
                        <th className="py-4 px-4">Articles</th>
                        <th className="py-4 px-4 text-right text-gold">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {groupedRevenue[date].items.map((movement, idx) => (
                        <tr key={idx} className="text-sm hover:bg-zinc-800/30 transition-all group">
                          <td className="py-4 px-4 text-zinc-500 font-mono text-xs">{format(new Date(movement.date), 'HH:mm')}</td>
                          <td className="py-4 px-4">
                            <p className="font-bold text-white uppercase text-xs">{movement.rental.customer.firstName} {movement.rental.customer.lastName}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">{movement.rental.customer.phone}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase border tracking-tighter ${getMovementTypeColor(movement.type)}`}>
                              {getMovementTypeLabel(movement.type)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {movement.rental?.items?.map((ri, j) => (
                                <span key={j} className="bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-[9px] font-medium text-zinc-400">
                                  {ri.item.name} <span className="text-gold/50">(T:{ri.item.size})</span>
                                </span>
                              ))}
                              {!movement.rental?.items?.length && <span className="text-[10px] text-zinc-600 italic">-</span>}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-black italic text-zinc-100">{movement.amount} DA</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
        {sortedDates.length === 0 && (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-800">
                <p className="text-zinc-500 italic">Aucun mouvement de caisse enregistré pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Revenue;
