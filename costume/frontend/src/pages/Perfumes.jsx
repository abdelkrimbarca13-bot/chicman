import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Droplet, Plus, Search, Trash2, Edit2, ShoppingCart, 
  History, BarChart3, AlertTriangle, Check, X, ArrowRight,
  TrendingUp, Package, Calendar, Info, QrCode, Tag, Printer
} from 'lucide-react';
import { format } from 'date-fns';
import PerfumeReceipt from '../components/PerfumeReceipt';
import PerfumeLabel from '../components/PerfumeLabel';

const Perfumes = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [perfumes, setPerfumes] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [labelToShow, setLabelToShow] = useState(null);
  const [scanValue, setScanValue] = useState('');
  
  // Form states
  const [productForm, setProductForm] = useState({
    brand: '',
    name: '',
    totalCapacityMl: '',
    totalPurchasePrice: '',
    salePriceMl: '',
    alertThresholdMl: 30
  });
  
  const [saleForm, setSaleForm] = useState({
    quantityMl: 1
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/perfumes');
      setPerfumes(pRes.data);
      
      if (user?.role === 'ADMIN') {
        const [sRes, stRes] = await Promise.all([
          api.get('/perfumes/sales'),
          api.get('/perfumes/stats')
        ]);
        setSales(sRes.data);
        setStats(stRes.data);
      }
    } catch (err) {
      console.error('Error fetching perfume data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/perfumes/${editingProduct.id}`, productForm);
      } else {
        await api.post('/perfumes', productForm);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ brand: '', name: '', totalCapacityMl: '', totalPurchasePrice: '', salePriceMl: '', alertThresholdMl: 30 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/perfumes/sales', {
        perfumeId: selectedProduct.id,
        quantityMl: parseFloat(saleForm.quantityMl)
      });
      setIsSaleModalOpen(false);
      setSelectedProduct(null);
      setSaleForm({ quantityMl: 1 });
      setReceiptToShow(res.data);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la vente');
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(scanValue);
      if (data.type === 'PERFUME_REF' && data.id) {
        const product = perfumes.find(p => p.id === data.id);
        if (product) {
          openSaleModal(product);
          setScanValue('');
        }
      }
    } catch (err) {
      // Not a valid JSON or not a perfume QR
      console.log('Invalid scan');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce parfum ?')) return;
    try {
      await api.delete(`/perfumes/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      brand: product.brand,
      name: product.name,
      totalCapacityMl: product.totalCapacityMl,
      totalPurchasePrice: product.totalPurchasePrice,
      salePriceMl: product.salePriceMl,
      alertThresholdMl: product.alertThresholdMl
    });
    setIsProductModalOpen(true);
  };

  const openSaleModal = (product) => {
    setSelectedProduct(product);
    setSaleForm({ quantityMl: 1 });
    setIsSaleModalOpen(true);
  };

  const filteredPerfumes = perfumes.filter(p => 
    p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Droplet className="text-gold" size={32} />
            Gestion des Parfums
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Gestion du stock au ml et suivi des ventes</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'inventory', label: 'Inventaire', icon: Droplet },
            { id: 'history', label: 'Historique', icon: History, adminOnly: true },
            { id: 'stats', label: 'Stats', icon: BarChart3, adminOnly: true },
          ].filter(tab => !tab.adminOnly || user?.role === 'ADMIN').map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gold text-white shadow-md' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-2 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher une marque ou un nom..."
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-gold outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <form onSubmit={handleScan} className="relative w-48">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" size={18} />
                <input
                  type="text"
                  placeholder="Scanner..."
                  className="w-full pl-10 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none text-xs"
                  value={scanValue}
                  onChange={(e) => setScanValue(e.target.value)}
                />
              </form>
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => { setEditingProduct(null); setProductForm({ brand: '', name: '', totalCapacityMl: '', totalPurchasePrice: '', salePriceMl: '', alertThresholdMl: 30 }); setIsProductModalOpen(true); }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gold text-white rounded-xl shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
              >
                <Plus size={20} /> Nouveau Parfum
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredPerfumes.map((perfume) => (
              <div 
                key={perfume.id} 
                className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 border transition-all hover:shadow-xl ${
                  perfume.currentQuantityMl <= 0 
                    ? 'border-red-200 dark:border-red-900/30 opacity-75' 
                    : perfume.currentQuantityMl <= perfume.alertThresholdMl 
                      ? 'border-amber-200 dark:border-amber-900/30 ring-1 ring-amber-500/20' 
                      : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gold font-bold">{perfume.brand}</span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{perfume.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setLabelToShow(perfume)} className="p-2 text-zinc-400 hover:text-gold transition-colors" title="Imprimer Étiquette"><Tag size={16} /></button>
                    {user?.role === 'ADMIN' && (
                      <>
                        <button onClick={() => openEditModal(perfume)} className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(perfume.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Stock Level UI */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-zinc-500">Stock actuel</span>
                      <span className={`font-bold ${perfume.currentQuantityMl <= perfume.alertThresholdMl ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
                        {perfume.currentQuantityMl} / {perfume.totalCapacityMl} ml
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          perfume.currentQuantityMl <= 0 ? 'bg-red-500' : 
                          perfume.currentQuantityMl <= perfume.alertThresholdMl ? 'bg-amber-500' : 'bg-gold'
                        }`}
                        style={{ width: `${(perfume.currentQuantityMl / perfume.totalCapacityMl) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Prix Vente</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{perfume.salePriceMl} <span className="text-xs text-zinc-400">DA/ml</span></p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Bénéfice/ml</p>
                      <p className="text-lg font-bold text-green-500">{(perfume.salePriceMl - perfume.unitCostMl).toFixed(1)} <span className="text-xs">DA</span></p>
                    </div>
                  </div>

                  <button
                    disabled={perfume.currentQuantityMl <= 0}
                    onClick={() => openSaleModal(perfume)}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      perfume.currentQuantityMl <= 0 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white hover:bg-gold dark:hover:bg-gold dark:hover:text-white shadow-lg'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    {perfume.currentQuantityMl <= 0 ? 'Rupture de stock' : 'Vendre au ml'}
                  </button>
                  
                  {perfume.currentQuantityMl > 0 && perfume.currentQuantityMl <= perfume.alertThresholdMl && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-wider justify-center">
                      <AlertTriangle size={12} />
                      Stock Faible
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && user?.role === 'ADMIN' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <h2 className="text-xl font-bold">Historique des Ventes</h2>
            <div className="flex gap-2">
                <div className="text-xs text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <TrendingUp size={12} className="text-green-500" />
                    Bénéfice Total: <span className="font-bold text-zinc-900 dark:text-white">{sales.reduce((sum, s) => sum + s.profit, 0).toLocaleString()} DA</span>
                </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="px-6 py-4 font-bold">Date & Heure</th>
                  <th className="px-6 py-4 font-bold">Produit</th>
                  <th className="px-6 py-4 font-bold">Quantité</th>
                  <th className="px-6 py-4 font-bold text-right">Montant</th>
                  <th className="px-6 py-4 font-bold text-right">Bénéfice</th>
                  <th className="px-6 py-4 font-bold">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-white">{format(new Date(sale.date), 'dd/MM/yyyy')}</div>
                      <div className="text-[10px] text-zinc-400">{format(new Date(sale.date), 'HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 dark:text-white">{sale.perfume.brand}</div>
                      <div className="text-xs text-zinc-500">{sale.perfume.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{sale.quantityMl} ml</td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{sale.totalAmount.toLocaleString()} DA</td>
                    <td className="px-6 py-4 text-right font-bold text-green-500">+{sale.profit.toLocaleString()} DA</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      <div className="flex items-center gap-2">
                        {sale.performedBy}
                        <button onClick={() => setReceiptToShow(sale)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors" title="Réimprimer"><Printer size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'stats' && stats && user?.role === 'ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 bg-gold/10 text-gold rounded-2xl w-fit mb-4">
              <TrendingUp size={24} />
            </div>
            <p className="text-sm text-zinc-500">Chiffre d'Affaires</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalRevenue.toLocaleString()} DA</h3>
            <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-tighter">Total toutes périodes</p>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl w-fit mb-4">
              <ArrowRight size={24} className="-rotate-45" />
            </div>
            <p className="text-sm text-zinc-500">Bénéfice Net</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalProfit.toLocaleString()} DA</h3>
            <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-tighter">Basé sur le coût unitaire</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl w-fit mb-4">
              <Droplet size={24} />
            </div>
            <p className="text-sm text-zinc-500">Volume Vendu</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalMlSold.toLocaleString()} <span className="text-sm">ml</span></h3>
            <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-tighter">Quantité totale écoulée</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className={`p-3 rounded-2xl w-fit mb-4 ${stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm text-zinc-500">Alertes Stock</p>
            <h3 className="text-3xl font-bold mt-1">{stats.lowStockCount + stats.outOfStockCount}</h3>
            <p className="text-[10px] text-zinc-400 mt-2 uppercase tracking-tighter">{stats.outOfStockCount} en rupture</p>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? 'Modifier Parfum' : 'Nouveau Parfum'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Marque</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Dior"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Nom du Produit</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Sauvage"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Contenance (ml)</label>
                  <input
                    required
                    type="number"
                    placeholder="ex: 100"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.totalCapacityMl}
                    onChange={(e) => setProductForm({ ...productForm, totalCapacityMl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Prix d'Achat Total (DA)</label>
                  <input
                    required
                    type="number"
                    placeholder="ex: 21000"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.totalPurchasePrice}
                    onChange={(e) => setProductForm({ ...productForm, totalPurchasePrice: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Prix Vente / ml (DA)</label>
                  <input
                    required
                    type="number"
                    placeholder="ex: 250"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none font-bold text-gold"
                    value={productForm.salePriceMl}
                    onChange={(e) => setProductForm({ ...productForm, salePriceMl: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Seuil Alerte (ml)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.alertThresholdMl}
                    onChange={(e) => setProductForm({ ...productForm, alertThresholdMl: e.target.value })}
                  />
                </div>
              </div>
              
              {editingProduct && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1 text-amber-500">Stock Actuel Manuel (ml)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    value={productForm.currentQuantityMl || editingProduct.currentQuantityMl}
                    onChange={(e) => setProductForm({ ...productForm, currentQuantityMl: e.target.value })}
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-gold text-white font-bold rounded-2xl shadow-xl shadow-gold/20 hover:scale-105 transition-transform"
                >
                  {editingProduct ? 'Mettre à jour' : 'Ajouter au stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      {isSaleModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 bg-gold text-white">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-white/20 rounded-2xl">
                  <ShoppingCart size={24} />
                </div>
                <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <h2 className="text-2xl font-bold">Vente de Parfum</h2>
              <p className="opacity-80 text-sm">{selectedProduct.brand} - {selectedProduct.name}</p>
            </div>
            
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Disponible</p>
                  <p className="text-xl font-bold">{selectedProduct.currentQuantityMl} ml</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Prix / ml</p>
                  <p className="text-xl font-bold text-gold">{selectedProduct.salePriceMl} DA</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Quantité à vendre (ml)</label>
                <div className="flex items-center gap-4">
                    <input
                        required
                        type="number"
                        step="0.5"
                        min="0.5"
                        max={selectedProduct.currentQuantityMl}
                        className="flex-1 px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-none rounded-2xl focus:ring-2 focus:ring-gold outline-none text-2xl font-bold text-center"
                        value={saleForm.quantityMl}
                        onChange={(e) => setSaleForm({ ...saleForm, quantityMl: e.target.value })}
                    />
                    <div className="flex flex-col gap-1">
                        {[5, 10, 20].map(val => (
                            <button 
                                key={val}
                                type="button" 
                                onClick={() => setSaleForm({ ...saleForm, quantityMl: val })}
                                className="px-3 py-1 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-gold hover:text-white rounded-lg transition-colors"
                            >
                                {val}ml
                            </button>
                        ))}
                    </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-900 dark:bg-gold/10 text-white dark:text-gold rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-70">Montant Total</span>
                  <span className="text-xs opacity-70">Bénéfice estimé</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-3xl font-bold">{(saleForm.quantityMl * selectedProduct.salePriceMl).toLocaleString()} DA</span>
                  <span className="text-lg font-bold text-green-400">+{(saleForm.quantityMl * (selectedProduct.salePriceMl - selectedProduct.unitCostMl)).toFixed(0)} DA</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!saleForm.quantityMl || saleForm.quantityMl > selectedProduct.currentQuantityMl}
                className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl transition-all ${
                  !saleForm.quantityMl || saleForm.quantityMl > selectedProduct.currentQuantityMl
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
                    : 'bg-gold text-white hover:scale-[1.02] shadow-gold/20 active:scale-95'
                }`}
              >
                Confirmer la Vente
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Print Modals */}
      {receiptToShow && (
        <PerfumeReceipt sale={receiptToShow} onClose={() => setReceiptToShow(null)} />
      )}
      {labelToShow && (
        <PerfumeLabel perfume={labelToShow} onClose={() => setLabelToShow(null)} />
      )}
    </div>
  );
};

export default Perfumes;
