import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Shirt, ClipboardList, CheckCircle, AlertTriangle, TrendingUp, Scissors, Droplets } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        setStats(res.data && typeof res.data === 'object' ? res.data : {});
      })
      .catch(err => {
        console.error(err);
        setStats({});
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
    { title: 'Locations en cours', value: stats?.activeRentals || 0, icon: <ClipboardList />, color: 'bg-blue-600', path: '/rentals' },
    { title: 'Articles disponibles', value: stats?.availableItems || 0, icon: <Shirt />, color: 'bg-green-600', path: '/items' },
    { title: 'Articles loués', value: stats?.rentedItems || 0, icon: <CheckCircle />, color: 'bg-orange-600', path: '/items' },
    { title: 'En Réparation', value: stats?.repairingItems || 0, icon: <Scissors />, color: 'bg-red-600', path: '/items' },
    { title: 'En Nettoyage', value: stats?.cleaningItems || 0, icon: <Droplets />, color: 'bg-cyan-600', path: '/items' },
  ];

  if (user?.role === 'ADMIN') {
    cards.push({ title: 'Revenu du Jour', value: `${stats?.dailyRevenue || 0} DA`, icon: <TrendingUp />, color: 'bg-gold', path: '/cash' });
  }

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {cards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => card.path && navigate(card.path)}
            className="bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl flex flex-col items-center border border-gold/10 cursor-pointer hover:border-gold/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all active:scale-95"
          >
            <div className={`${card.color} p-4 rounded-full text-white mb-4 shadow-lg`}>
              {card.icon}
            </div>
            <div className="text-center">
              <p className="text-zinc-600 dark:text-zinc-400 text-[10px] uppercase font-bold tracking-tighter mb-1">{card.title}</p>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 overflow-hidden border border-gold/10">
        <div className="flex items-center mb-6 text-red-500 dark:text-red-400">
          <AlertTriangle className="mr-2" />
          <h2 className="text-xl font-bold font-poppins">Alertes Retards</h2>
        </div>
        {(!stats?.delayedRentals || stats.delayedRentals.length === 0) ? (
          <p className="text-zinc-500 dark:text-zinc-400">Aucun retard à signaler.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm uppercase">
                  <th className="py-3 px-2 whitespace-nowrap">Client</th>
                  <th className="py-3 px-2 whitespace-nowrap">Articles</th>
                  <th className="py-3 px-2 whitespace-nowrap text-center">Date retour prévue</th>
                  <th className="py-3 px-2 whitespace-nowrap">Téléphone</th>
                </tr>
              </thead>
              <tbody className="text-zinc-800 dark:text-zinc-200">
                {stats.delayedRentals.map(rental => (
                  <tr 
                    key={rental.id} 
                    onClick={() => navigate(`/rentals?rentalId=${rental.id}`)}
                    className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-2 font-medium group-hover:text-gold">{rental.customer?.firstName} {rental.customer?.lastName}</td>
                    <td className="py-4 px-2">
                        <div className="flex flex-wrap gap-1">
                            {rental.items?.map((ri, idx) => (
                                <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700">{ri.item.name}</span>
                            ))}
                        </div>
                    </td>
                    <td className="py-4 px-2 text-center text-red-500 dark:text-red-400 font-bold">{rental.expectedReturn ? new Date(rental.expectedReturn).toLocaleDateString() : ''}</td>
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
