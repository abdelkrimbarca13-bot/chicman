import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, Search, User, Edit2, Trash2, X } from 'lucide-react';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState({ firstName: '', lastName: '', phone: '', address: '', idNumber: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchCustomers = () => {
    api.get('/customers').then(res => setCustomers(res.data));
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
      fetchCustomers();
    } catch (err) {
      alert('Erreur: Vérifiez si le numéro de pièce d\'identité est unique');
    }
  };

  const handleEdit = (customer) => {
    setCurrentCustomer(customer);
    setEditingId(customer.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await api.delete(`/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Fiches Clients</h1>
        <button 
          onClick={() => {
            setCurrentCustomer({ firstName: '', lastName: '', phone: '', address: '', idNumber: '' });
            setEditingId(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-indigo-700 shadow-lg text-sm"
        >
          <Plus size={20} className="mr-2" /> Nouveau Client
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom ou ID..."
          className="w-full pl-10 pr-4 py-2 border rounded-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => (
          <div key={customer.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center mb-4 justify-between">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mr-4">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{customer.firstName} {customer.lastName}</h3>
                  <p className="text-sm text-gray-500">ID: {customer.idNumber}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(customer)} className="text-indigo-600 hover:text-indigo-900"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Tel:</strong> {customer.phone}</p>
              <p><strong>Adresse:</strong> {customer.address}</p>
              <p><strong>Locations:</strong> {customer.rentals?.length || 0} effectuée(s)</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{editingId ? 'Modifier' : 'Nouveau'} Client</h2>
              <button onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4">
                <input type="text" placeholder="Prénom" className="w-full p-2 border rounded" value={currentCustomer.firstName} onChange={e => setCurrentCustomer({...currentCustomer, firstName: e.target.value})} required />
                <input type="text" placeholder="Nom" className="w-full p-2 border rounded" value={currentCustomer.lastName} onChange={e => setCurrentCustomer({...currentCustomer, lastName: e.target.value})} required />
              </div>
              <input type="text" placeholder="Téléphone" className="w-full p-2 border rounded" value={currentCustomer.phone} onChange={e => setCurrentCustomer({...currentCustomer, phone: e.target.value})} required />
              <input type="text" placeholder="N° Pièce d'identité" className="w-full p-2 border rounded" value={currentCustomer.idNumber} onChange={e => setCurrentCustomer({...currentCustomer, idNumber: e.target.value})} required disabled={editingId ? true : false} />
              <textarea placeholder="Adresse" className="w-full p-2 border rounded" value={currentCustomer.address} onChange={e => setCurrentCustomer({...currentCustomer, address: e.target.value})} required />
              <div className="flex justify-end space-x-4 mt-6">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingId(null); }} className="px-4 py-2 text-gray-600">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
