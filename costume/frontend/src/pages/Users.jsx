import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Shield, Trash2, X, Lock, Edit2, Power, CheckCircle2, UserCheck } from 'lucide-react';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'EMPLOYEE' });
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs:', err);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', newUser);
      setIsModalOpen(false);
      setNewUser({ username: '', password: '', role: 'EMPLOYEE' });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Supprimer ce compte ?')) {
      try {
        await api.delete(`/auth/users/${id}`);
        fetchUsers();
      } catch (err) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { id, ...data } = selectedUser;
      if (!data.password) delete data.password;
      await api.put(`/auth/users/${id}`, data);
      setIsEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/auth/users/${user.id}`, { isActive: !user.isActive });
      fetchUsers();
    } catch (err) {
      alert('Erreur lors du changement de statut');
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return <div className="p-8 text-center text-red-500 font-bold">Accès réservé aux administrateurs.</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8 border-b-2 border-gold/30 pb-4">
        <h1 className="text-3xl font-black font-luxury tracking-widest text-gold uppercase">Gestion des Comptes</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gold text-rich-black px-6 py-2 rounded-lg flex items-center hover:bg-light-gold shadow-lg shadow-gold/10 font-bold transition-all active:scale-95"
        >
          <UserPlus size={20} className="mr-2" /> Créer un Profil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(u => (
          <div key={u.id} className={`bg-white dark:bg-zinc-900 p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${u.isActive ? 'border-gold/10 hover:border-gold/30' : 'border-red-500/20 grayscale opacity-75'}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className={`p-4 rounded-xl mr-4 border shadow-inner ${u.role === 'ADMIN' ? 'bg-gold/10 text-gold border-gold/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                  {u.role === 'ADMIN' ? <Shield size={28} /> : <User size={28} />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tighter">{u.username}</h3>
                    {parseInt(u.id) === parseInt(currentUser.userId) && (
                      <span className="bg-green-500/10 text-green-500 text-[8px] font-black px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1">
                        <UserCheck size={10} /> MOI
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${u.role === 'ADMIN' ? 'bg-gold text-rich-black' : 'bg-blue-900/30 text-blue-400'}`}>
                      {u.role}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${u.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {u.isActive ? 'ACTIF' : 'DÉSACTIVÉ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-800 mt-4">
              <p className="text-[9px] font-bold text-zinc-500 uppercase">Créé le {new Date(u.createdAt).toLocaleDateString()}</p>
              <div className="flex items-center gap-3">
                {parseInt(u.id) !== parseInt(currentUser.userId) && (
                  <>
                    <button 
                      onClick={() => handleToggleActive(u)} 
                      title={u.isActive ? "Désactiver" : "Activer"}
                      className={`p-2 rounded-lg transition-all ${u.isActive ? 'text-zinc-500 hover:text-red-500 hover:bg-red-500/10' : 'text-red-500 hover:text-green-500 hover:bg-green-500/10'}`}
                    >
                      <Power size={18} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => { setSelectedUser(u); setIsEditModalOpen(true); }}
                  className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
                  title="Modifier"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-gold/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-gold font-luxury tracking-widest uppercase">Nouveau Profil</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Identifiant</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input type="text" placeholder="Nom d'utilisateur" className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Mot de passe</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Rôle</label>
                <select className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none font-bold" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="EMPLOYEE">Employé</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-400 font-semibold hover:text-zinc-900 dark:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-gold text-rich-black rounded font-bold hover:bg-light-gold shadow-lg shadow-gold/10 transition-all active:scale-95">Créer le compte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-gold/20 shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
              <h2 className="text-2xl font-bold text-gold font-luxury tracking-widest uppercase">Modifier Profil</h2>
              <button onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }} className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Identifiant</label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input type="text" className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none" value={selectedUser.username} onChange={e => setSelectedUser({...selectedUser, username: e.target.value})} required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none" value={selectedUser.password || ''} onChange={e => setSelectedUser({...selectedUser, password: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-1 tracking-widest">Rôle</label>
                <select className="w-full p-2.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:ring-2 focus:ring-gold outline-none font-bold" value={selectedUser.role} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}>
                  <option value="EMPLOYEE">Employé</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="isActiveEdit" checked={selectedUser.isActive} onChange={e => setSelectedUser({...selectedUser, isActive: e.target.checked})} className="w-4 h-4 accent-gold" />
                <label htmlFor="isActiveEdit" className="text-xs font-bold text-zinc-300 uppercase cursor-pointer">Compte Actif</label>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-zinc-800">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSelectedUser(null); }} className="px-4 py-2 text-zinc-400 font-semibold hover:text-zinc-900 dark:text-white transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 bg-gold text-rich-black rounded font-bold hover:bg-light-gold shadow-lg shadow-gold/10 transition-all active:scale-95">Sauvegarder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
