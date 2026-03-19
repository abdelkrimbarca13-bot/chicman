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
      DEPOSIT: 'bg-blue-50 text-blue-700 border-blue-200',
      REMAINDER: 'bg-green-50 text-green-700 border-green-200',
      REFUND: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[type] || 'bg-gray-50 text-gray-700 border-gray-200';
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
        <h1 className="text-2xl md:text-3xl font-bold">Suivi des Revenus</h1>
        <div className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center">
            <TrendingUp className="mr-3" />
            <div>
                <p className="text-[10px] uppercase font-semibold opacity-80">Total Aujourd'hui</p>
                <p className="text-xl md:text-2xl font-bold">
                    {groupedRevenue[format(new Date(), 'yyyy-MM-dd')]?.total || 0} DA
                </p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {sortedDates.map(date => (
          <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button 
              onClick={() => toggleDay(date)}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="text-indigo-500 mr-4" size={24} />
                <div>
                  <p className="font-bold text-lg text-gray-800">
                    {format(new Date(date), 'dd MMMM yyyy')}
                    {date === format(new Date(), 'yyyy-MM-dd') && (
                        <span className="ml-3 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Aujourd'hui</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{groupedRevenue[date].items.length} transaction(s)</p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-xl font-black text-indigo-700 mr-6">{groupedRevenue[date].total} DA</p>
                {expandedDays[date] ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
              </div>
            </button>

            {expandedDays[date] && (
              <div className="border-t border-gray-50 bg-gray-50/50 p-5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="text-[10px] sm:text-xs font-bold uppercase text-gray-400 border-b pb-2">
                        <th className="pb-3 px-2">Heure</th>
                        <th className="pb-3 px-2">Client</th>
                        <th className="pb-3 px-2">Type</th>
                        <th className="pb-3 px-2">Description</th>
                        <th className="pb-3 px-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {groupedRevenue[date].items.map((movement, idx) => (
                        <tr key={idx} className="text-sm hover:bg-white/50 transition-colors">
                          <td className="py-3 px-2 text-gray-500 font-mono text-xs">{format(new Date(movement.date), 'HH:mm')}</td>
                          <td className="py-3 px-2 font-medium">{movement.rental.customer.firstName} {movement.rental.customer.lastName}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getMovementTypeColor(movement.type)}`}>
                              {getMovementTypeLabel(movement.type)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-gray-600 text-xs italic">
                            {movement.description || `Location #RENT-${movement.rentalId}`}
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-gray-900">{movement.amount} DA</td>
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
            <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 italic">Aucun mouvement de caisse enregistré pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Revenue;
