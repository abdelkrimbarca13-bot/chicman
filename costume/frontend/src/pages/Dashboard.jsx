import React, { useEffect, useState } from 'react';
import api from '../api';
import { Shirt, ClipboardList, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        setStats(res.data && typeof res.data === 'object' ? res.data : {});
      })
      .catch(err => {
        console.error(err);
        setStats({}); // Set to empty object to stop loading
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
    </div>
  );

  const cards = [
    { title: 'Locations en cours', value: stats?.activeRentals || 0, icon: <ClipboardList />, color: 'bg-gold' },
    { title: 'Articles disponibles', value: stats?.availableItems || 0, icon: <Shirt />, color: 'bg-gold' },
    { title: 'Articles loués', value: stats?.rentedItems || 0, icon: <CheckCircle />, color: 'bg-gold' },
    { title: 'Revenu du Jour', value: `${stats?.dailyRevenue || 0} DA`, icon: <TrendingUp />, color: 'bg-gold' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-zinc-900 p-6 rounded-lg shadow-xl flex items-center border border-gold/10">
            <div className={`${card.color} p-4 rounded-full text-rich-black mr-4 shadow-[0_0_15px_rgba(197,160,33,0.3)]`}>
              {card.icon}
            </div>
            <div>
              <p className="text-zinc-400 text-sm uppercase font-semibold tracking-tighter">{card.title}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-900 rounded-lg shadow-xl p-6 overflow-hidden border border-gold/10">
        <div className="flex items-center mb-6 text-red-400">
          <AlertTriangle className="mr-2" />
          <h2 className="text-xl font-bold font-poppins">Alertes Retards</h2>
        </div>
        {(!stats?.delayedRentals || stats.delayedRentals.length === 0) ? (
          <p className="text-zinc-500">Aucun retard à signaler.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-sm uppercase">
                  <th className="py-3 px-2">Client</th>
                  <th className="py-3 px-2">Date retour prévue</th>
                  <th className="py-3 px-2">Téléphone</th>
                </tr>
              </thead>
              <tbody className="text-zinc-200">
                {stats.delayedRentals.map(rental => (
                  <tr key={rental.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                    <td className="py-4 px-2 font-medium">{rental.customer?.firstName} {rental.customer?.lastName}</td>
                    <td className="py-4 px-2">{rental.expectedReturn ? new Date(rental.expectedReturn).toLocaleDateString() : ''}</td>
                    <td className="py-4 px-2 font-mono text-gold">{rental.customer?.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
