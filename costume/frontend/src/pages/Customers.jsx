import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, User, Edit2, Trash2, X, ShieldAlert, ShieldCheck, AlertCircle, History, ShoppingCart } from 'lucide-react';

const Customers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyModal, setHistoryModal] = useState(null);
  const [currentCustomer, setCurrentCustomer] = useState({ firstName: '', lastName: '', phone: '', address: '', idNumber: '', isBlacklisted: false });
  const [editingId, setEditingId] = useState(null);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Erreur chargement clients:', err);
    }
  };

  const handleNewRental = (customer) => {
    const params = new URLSearchParams({
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone
    });
    navigate(`/rentals?new=true&${params.toString()}`);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, currentCustomer);
      } else {
        await api.post('/customers', currentCustomer);
      }
      setIsModalOpen(false);
      setCurrentCustomer({ firstName: '', lastName: '', phone: '', address: '', idNumber: '' });
      setEditingId(null);
      await fetchCustomers();
    } catch (err) {
      alert('Erreur: Vérifiez si le numéro de pièce d\'identité est unique');
    }
  };

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setEditingId(customer.id);
    setIsModalOpen(true);
  };

  const handleToggleBlacklist = async (id, currentState) => {
    if (confirm(`Voulez-vous ${!currentState ? 'ajouter' : 'retirer'} ce client de la liste noire ?`)) {
        try {
            await api.put(`/customers/${id}/blacklist`, { isBlacklisted: !currentState });
            await fetchCustomers();
        } catch (err) {
            alert('Erreur lors de la modification de la liste noire');
        }
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await api.delete(`/customers/${id}`);
        await fetchCustomers();
      } catch (err) {
        console.error('Erreur lors de la suppression:', err);
        const message = err.response?.data?.message || 'Erreur lors de la suppression. Veuillez réessayer.';
        alert(message);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-luxury tracking-widest text-gold uppercase border-b-2 border-gold/30 pb-2">Fiches Clients</h1>
        <button 
          onClick={() => {
            setCurrentCustomer({ firstName: '', lastName: '', phone: '', address: '', idNumber: '' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-gold text-rich-black px-6 py-2 rounded-lg flex items-center justify-center hover:bg-light-gold shadow-lg shadow-gold/10 text-sm font-bold transition-all active:scale-95"
        >
          <Plus size={20} className="mr-2" /> Nouveau Client
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou ID..."
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.filter(c => 
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm) ||
            c.idNumber.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(customer => (
          <div key={customer.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xl border ${customer.isBlacklisted ? 'border-red-500/50 bg-red-950/5' : 'border-gold/10'} hover:border-gold/30 transition-all group`}>
            <div className="flex items-center mb-6 justify-between">
              <div className="flex items-center">
                <div className={`${customer.isBlacklisted ? 'bg-red-500/10 text-red-500' : 'bg-gold/10 text-gold'} p-3 rounded-full mr-4 border border-current group-hover:bg-gold group-hover:text-rich-black transition-colors`}>
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white font-poppins flex items-center gap-2">
                    {customer.firstName} {customer.lastName}
                    {customer.isBlacklisted && <ShieldAlert size={16} className="text-red-500" title="Client Blacklisté" />}
                  </h3>
                  <p className="text-xs text-gold font-mono tracking-widest uppercase">ID: {customer.idNumber}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {user?.role === 'ADMIN' && (
                  <button onClick={() => handleToggleBlacklist(customer.id, customer.isBlacklisted)} className={`${customer.isBlacklisted ? 'text-green-500 hover:text-green-400' : 'text-red-500 hover:text-red-400'} transition-colors`} title={customer.isBlacklisted ? 'Retirer de la liste noire' : 'Ajouter à la liste noire'}>
                    {customer.isBlacklisted ? <ShieldCheck size={18}/> : <ShieldAlert size={18}/>}
                  </button>
                )}
                <button onClick={() => handleEdit(customer)} className="text-zinc-400 hover:text-gold transition-colors" title="Modifier"><Edit2 size={18} /></button>
                {user?.role === 'ADMIN' && (
                  <button onClick={() => handleDelete(customer.id)} className="text-zinc-400 hover:text-red-400 transition-colors" title="Supprimer"><Trash2 size={18} /></button>
                )}
              </div>
            </div>
            {customer.isBlacklisted && (
                <div className="mb-4 p-2 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> Attention: Client sur liste noire
                </div>
            )}
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-center justify-between p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Téléphone</span>
                <span className="font-bold text-gold">{customer.phone}</span>
              </div>
              <div className="flex flex-col p-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider mb-1">Adresse</span>
                <span className="text-xs">{customer.address}</span>
              </div>
              <div className="flex justify-between items-center pt-2 gap-2">
                <button 
                  onClick={() => setHistoryModal(customer)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
                >
                  <History size={14} /> Historique
                </button>
                {!customer.isBlacklisted && (
                  <button 
                    onClick={() => handleNewRental(customer)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gold/10 text-gold rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gold hover:text-rich-black transition-all border border-gold/20"
                  >
                    <ShoppingCart size={14} /> Louer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-gold/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-gold font-luxury tracking-widest uppercase">{editingId ? 'Modifier' : 'Nouveau'} Client</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Prénom" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold" value={currentCustomer.firstName} onChange={e => setCurrentCustomer({...currentCustomer, firstName: e.target.value})} required />
                <input type="text" placeholder="Nom" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold" value={currentCustomer.lastName} onChange={e => setCurrentCustomer({...currentCustomer, lastName: e.target.value})} required />
              </div>
              <input type="text" placeholder="Téléphone" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold" value={currentCustomer.phone} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})} required />
              <input type="text" placeholder="N° Pièce d'identité" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold" value={currentCustomer.idNumber} onChange={e => setCurrentCustomer({...currentCustomer, idNumber: e.target.value})} required disabled={editingId ? true : false} />
              <textarea placeholder="Adresse" className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold min-h-[100px]" value={currentCustomer.address} onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})} required />
              <div className="flex justify-end space-x-4 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-zinc-400 font-semibold hover:text-zinc-900 dark:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-gold text-rich-black rounded font-bold hover:bg-light-gold shadow-lg shadow-gold/10 transition-all active:scale-95">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {historyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-gold/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gold font-luxury tracking-widest uppercase">Historique Locations</h2>
                <p className="text-xs text-zinc-500 uppercase font-black">{historyModal.firstName} {historyModal.lastName}</p>
              </div>
              <button onClick={() => setHistoryModal(null)} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-900 dark:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              {historyModal.rentals && historyModal.rentals.length > 0 ? (
                historyModal.rentals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(rental => (
                  <div key={rental.id} className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-700 flex justify-between items-center group hover:border-gold/30 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-zinc-900 dark:text-white">Bon #{rental.id.toString().padStart(5, '0')}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${rental.status === 'ONGOING' ? 'bg-blue-900/20 text-blue-400 border-blue-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50'}`}>
                          {rental.status === 'ONGOING' ? 'En cours' : 'Retourné'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">
                        Du {new Date(rental.startDate).toLocaleDateString()} au {new Date(rental.expectedReturn).toLocaleDateString()}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rental.items.map((ri, i) => (
                          <span key={i} className="text-[9px] bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-600 dark:text-zinc-300 font-medium border border-zinc-300 dark:border-zinc-600">
                            {ri.item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-gold text-sm">{rental.totalAmount} DA</div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Payé: {rental.paidAmount} DA</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-zinc-500 font-bold uppercase tracking-widest border-2 border-dashed border-zinc-800 rounded-xl">
                  Aucune location enregistrée
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
