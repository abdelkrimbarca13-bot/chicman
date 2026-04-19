import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Shirt, ClipboardList, CheckCircle, AlertTriangle, TrendingUp, Scissors, Droplets, Printer } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('repairs'); // 'repairs' ou 'delays'

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
    { title: 'Locations en cours', value: stats?.activeRentals || 0, icon: <ClipboardList />, color: 'bg-blue-600', type: 'delays' },
    { title: 'Articles disponibles', value: stats?.availableItems || 0, icon: <Shirt />, color: 'bg-green-600', path: '/items' },
    { title: 'Articles loués', value: stats?.rentedItems || 0, icon: <CheckCircle />, color: 'bg-orange-600', type: 'rented' },
    { title: 'Réparations Demain', value: stats?.tomorrowRepairs?.length || 0, icon: <Scissors />, color: 'bg-red-600', type: 'repairs' },
    { title: 'En Nettoyage', value: stats?.cleaningItems || 0, icon: <Droplets />, color: 'bg-cyan-600', type: 'cleaning' },
  ];

  if (user?.role === 'ADMIN') {
    cards.push({ title: 'Revenu du Jour', value: `${stats?.dailyRevenue || 0} DA`, icon: <TrendingUp />, color: 'bg-gold', path: '/cash' });
  }

  const handleCardClick = (card) => {
    if (card.type) {
      setActiveTab(card.type);
      document.getElementById('alerts-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (card.path) {
      navigate(card.path);
    }
  };

  const handlePrintRepairs = () => {
    const printWindow = window.open('', '_blank');
    const content = `
      <html>
        <head>
          <title>Fiche Réparations - ${new Date().toLocaleDateString()}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100% !important; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 14px; }
            th { background-color: #f2f2f2; font-weight: bold; text-transform: uppercase; }
            h1 { color: #d4af37; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
            .header-info { margin-bottom: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>FICHE COUTURIÈRE : RÉPARATIONS POUR DEMAIN</h1>
          <div class="header-info">Date d'impression: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Article (Référence)</th>
                <th>Type de Réparation / Modification</th>
                <th>Notes / Remarques</th>
                <th>Client</th>
              </tr>
            </thead>
            <tbody>
              ${stats.tomorrowRepairs.map(ri => `
                <tr>
                  <td><strong>${ri.item.name}</strong><br/><small>REF: ${ri.item.reference}</small></td>
                  <td>${ri.tailorModification || '<em style="color:#999">Aucune modif spécifiée</em>'}</td>
                  <td>${ri.remarks || '-'}</td>
                  <td>${ri.rental.customer.firstName} ${ri.rental.customer.lastName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 50px; border-top: 1px dashed #ccc; padding-top: 20px; font-style: italic; font-size: 12px; text-align: center;">
            Merci de valider chaque réparation une fois terminée.
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  const isPast11AM = new Date().getHours() >= 11;

  return (
    <div>
      <h1 className="text-3xl font-black mb-8 font-luxury tracking-wider text-gold border-b-2 border-gold/50 w-fit pb-2 uppercase">Tableau de Bord</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {cards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => handleCardClick(card)}
            className={`bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-xl flex flex-col items-center border cursor-pointer transition-all active:scale-95 ${
              (card.type === activeTab) 
                ? 'border-gold bg-zinc-50 dark:bg-zinc-800 ring-2 ring-gold/20' 
                : 'border-gold/10 hover:border-gold/30 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
            }`}
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

      <div id="alerts-section" className="mt-8">
        {activeTab === 'delays' && (
          /* Alerte Retards */
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 overflow-hidden border border-gold/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-red-500 dark:text-red-400">
                <AlertTriangle className="mr-2" />
                <h2 className="text-xl font-bold font-poppins uppercase tracking-wider">Alertes Retards</h2>
              </div>
              {isPast11AM && stats?.delayedRentals?.length > 0 && (
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-[10px] font-black uppercase animate-pulse border border-red-200 dark:border-red-800">
                  ⚠️ Rappel de 11h actif
                </div>
              )}
            </div>
            {(!stats?.delayedRentals || stats.delayedRentals.length === 0) ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">Aucun retard à signaler.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] uppercase font-black">
                      <th className="py-3 px-2 whitespace-nowrap">Client / Contact</th>
                      <th className="py-3 px-2 whitespace-nowrap">Articles</th>
                      <th className="py-3 px-2 whitespace-nowrap text-center">Date retour</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-800 dark:text-zinc-200">
                    {stats.delayedRentals.map(rental => (
                      <tr 
                        key={rental.id} 
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-2 font-medium group-hover:text-gold text-sm truncate max-w-[120px]">
                            <div onClick={() => navigate(`/rentals?rentalId=${rental.id}`)}>{rental.customer?.firstName} {rental.customer?.lastName}</div>
                            <a href={`tel:${rental.customer?.phone}`} className="text-[10px] font-mono font-bold text-gold hover:underline flex items-center gap-1 mt-1">
                                {rental.customer?.phone}
                            </a>
                        </td>
                        <td className="py-4 px-2">
                            <div className="flex flex-wrap gap-1">
                                {rental.items?.map((ri, idx) => (
                                    <span key={idx} className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700">{ri.item.name}</span>
                                ))}
                            </div>
                        </td>
                        <td className="py-4 px-2 text-center text-red-500 dark:text-red-400 font-bold text-xs">{rental.expectedReturn ? new Date(rental.expectedReturn).toLocaleDateString() : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'repairs' && (
          /* Réparations pour Demain */
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 overflow-hidden border border-gold/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center text-gold">
                <Scissors className="mr-2" />
                <h2 className="text-xl font-bold font-poppins uppercase tracking-wider">Réparations Demain</h2>
              </div>
              {stats?.tomorrowRepairs?.length > 0 && (
                <button 
                  onClick={handlePrintRepairs}
                  className="flex items-center bg-gold hover:bg-gold/90 text-black px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg"
                >
                  <Printer size={14} className="mr-1.5" />
                  Imprimer Fiche
                </button>
              )}
            </div>
            {(!stats?.tomorrowRepairs || stats.tomorrowRepairs.length === 0) ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic">Aucune réparation prévue pour demain.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] uppercase font-black">
                      <th className="py-3 px-2 whitespace-nowrap">Article</th>
                      <th className="py-3 px-2 whitespace-nowrap">Modif / Note</th>
                      <th className="py-3 px-2 whitespace-nowrap">Client</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-800 dark:text-zinc-200">
                    {stats.tomorrowRepairs.map((ri, idx) => (
                      <tr 
                        key={idx} 
                        onClick={() => navigate(`/rentals?rentalId=${ri.rentalId}`)}
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-2">
                          <p className="font-bold text-sm text-gold">{ri.item.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">REF: {ri.item.reference}</p>
                        </td>
                        <td className="py-4 px-2">
                          {ri.tailorModification && (
                            <div className="text-[11px] font-black bg-black text-white px-2 py-0.5 rounded mb-1 inline-block uppercase">
                              MOD: {ri.tailorModification}
                            </div>
                          )}
                          {ri.remarks && (
                            <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-300 italic">
                              Note: {ri.remarks}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-2">
                          <p className="text-xs font-bold uppercase">{ri.rental.customer.firstName} {ri.rental.customer.lastName}</p>
                          <p className="text-[10px] font-mono">{ri.rental.customer.phone}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'cleaning' || activeTab === 'rented') && (
          /* Articles en Nettoyage ou Loués */
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-6 overflow-hidden border border-gold/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`flex items-center mb-6 ${activeTab === 'cleaning' ? 'text-cyan-500' : 'text-orange-500'}`}>
              {activeTab === 'cleaning' ? <Droplets className="mr-2" /> : <CheckCircle className="mr-2" />}
              <h2 className="text-xl font-bold font-poppins uppercase tracking-wider">
                {activeTab === 'cleaning' ? 'Articles en Nettoyage' : 'Articles Loués'}
              </h2>
            </div>
            {((activeTab === 'cleaning' ? stats?.cleaningItemsList : stats?.rentedItemsList)?.length === 0) ? (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm italic text-center py-4">
                Aucun article dans cette catégorie.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] uppercase font-black">
                      <th className="py-3 px-2 whitespace-nowrap">Référence</th>
                      <th className="py-3 px-2 whitespace-nowrap">Article</th>
                      <th className="py-3 px-2 whitespace-nowrap">Détails</th>
                      <th className="py-3 px-2 whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-800 dark:text-zinc-200">
                    {(activeTab === 'cleaning' ? (stats?.cleaningItemsList || []) : (stats?.rentedItemsList || [])).map((item) => (
                      <tr 
                        key={item.id} 
                        className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
                      >
                        <td className="py-4 px-2 font-mono text-xs font-bold text-gold">{item.reference}</td>
                        <td className="py-4 px-2">
                          <p className="font-bold text-sm uppercase">{item.name}</p>
                          <p className="text-[10px] text-zinc-500 uppercase">{item.type} - {item.color}</p>
                        </td>
                        <td className="py-4 px-2">
                          <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] border border-zinc-200 dark:border-zinc-700 uppercase font-bold">
                            Taille: {item.size}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button 
                            onClick={() => navigate('/items')}
                            className="text-[10px] font-black uppercase text-zinc-400 hover:text-gold transition-colors"
                          >
                            Voir détails
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
