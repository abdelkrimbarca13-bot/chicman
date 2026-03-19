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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const cards = [
    { title: 'Locations en cours', value: stats?.activeRentals || 0, icon: <ClipboardList />, color: 'bg-blue-500' },
    { title: 'Articles disponibles', value: stats?.availableItems || 0, icon: <Shirt />, color: 'bg-green-500' },
    { title: 'Articles loués', value: stats?.rentedItems || 0, icon: <CheckCircle />, color: 'bg-orange-500' },
    { title: 'Revenu du Jour', value: `${stats?.dailyRevenue || 0} DA`, icon: <TrendingUp />, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 font-luxury tracking-wider text-indigo-900 border-b-2 border-amber-500 w-fit pb-2">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm flex items-center">
            <div className={`${card.color} p-4 rounded-full text-white mr-4`}>
              {card.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm uppercase font-semibold">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 overflow-hidden">
        <div className="flex items-center mb-4 text-red-600">
          <AlertTriangle className="mr-2" />
          <h2 className="text-xl font-bold">Alertes Retards</h2>
        </div>
        {(!stats?.delayedRentals || stats.delayedRentals.length === 0) ? (
          <p className="text-gray-500">Aucun retard à signaler.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b text-gray-600">
                  <th className="py-2">Client</th>
                  <th className="py-2">Date retour prévue</th>
                  <th className="py-2">Téléphone</th>
                </tr>
              </thead>
              <tbody>
                {stats.delayedRentals.map(rental => (
                  <tr key={rental.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 font-medium">{rental.customer?.firstName} {rental.customer?.lastName}</td>
                    <td className="py-3">{rental.expectedReturn ? new Date(rental.expectedReturn).toLocaleDateString() : ''}</td>
                    <td className="py-3 font-mono">{rental.customer?.phone}</td>
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
