import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Plus, Search, Trash2, Edit2, ShoppingCart, 
  History, BarChart3, AlertTriangle, Check, X, ArrowRight,
  TrendingUp, Calendar, Info, QrCode, Tag, Printer
} from 'lucide-react';
import { format } from 'date-fns';

const Products = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Form states
  const [productForm, setProductForm] = useState({
    reference: '',
    name: '',
    type: '',
    size: '',
    color: '',
    purchasePrice: '',
    salePrice: '',
    quantity: 0
  });
  
  const [saleForm, setSaleForm] = useState({
    quantity: 1,
    customerName: '',
    customerPhone: '',
    discount: 0
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await api.get('/products');
      setProducts(pRes.data);
      
      if (user?.role === 'ADMIN') {
        const [sRes, stRes] = await Promise.all([
          api.get('/products/sales'),
          api.get('/products/stats')
        ]);
        setSales(sRes.data);
        setStats(stRes.data);
      }
    } catch (err) {
      console.error('Error fetching product data:', err);
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
        await api.put(`/products/${editingProduct.id}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({ reference: '', name: '', type: '', size: '', color: '', purchasePrice: '', salePrice: '', quantity: 0 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleSaleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products/sales', {
        productId: selectedProduct.id,
        quantity: parseInt(saleForm.quantity),
        customerName: saleForm.customerName,
        customerPhone: saleForm.customerPhone,
        discount: parseFloat(saleForm.discount) || 0
      });
      setIsSaleModalOpen(false);
      setSelectedProduct(null);
      setSaleForm({ quantity: 1, customerName: '', customerPhone: '', discount: 0 });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la vente');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    try {
      await api.delete(`/products/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      reference: product.reference,
      name: product.name,
      type: product.type,
      size: product.size,
      color: product.color,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      quantity: product.quantity
    });
    setIsProductModalOpen(true);
  };

  const openSaleModal = (product) => {
    setSelectedProduct(product);
    setSaleForm({ quantity: 1, customerName: '', customerPhone: '', discount: 0 });
    setIsSaleModalOpen(true);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <Package className="text-gold" size={32} />
            Boutique & Produits
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Vente d'articles (chemises, accessoires, etc.)</p>
        </div>
        
        <div className="flex bg-white dark:bg-zinc-900 p-1 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800">
          {[
            { id: 'inventory', label: 'Stock', icon: Package },
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
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-gold outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => { setEditingProduct(null); setProductForm({ reference: '', name: '', type: '', size: '', color: '', purchasePrice: '', salePrice: '', quantity: 0 }); setIsProductModalOpen(true); }}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gold text-white rounded-xl shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
              >
                <Plus size={20} /> Nouveau Produit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 border transition-all hover:shadow-xl ${
                  product.quantity <= 0 
                    ? 'border-red-200 dark:border-red-900/30 opacity-75' 
                    : product.quantity <= 5 
                      ? 'border-amber-200 dark:border-amber-900/30 ring-1 ring-amber-500/20' 
                      : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-gold font-bold">{product.reference}</span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{product.name}</h3>
                    <p className="text-xs text-zinc-500 uppercase">{product.type} | {product.size} | {product.color}</p>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === 'ADMIN' && (
                      <>
                        <button onClick={() => openEditModal(product)} className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-zinc-500">Stock</span>
                      <span className={`font-bold ${product.quantity <= 5 ? 'text-amber-500' : 'text-zinc-900 dark:text-white'}`}>
                        {product.quantity} unités
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          product.quantity <= 0 ? 'bg-red-500' : 
                          product.quantity <= 5 ? 'bg-amber-500' : 'bg-gold'
                        }`}
                        style={{ width: `${Math.min(100, (product.quantity / 20) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Prix Vente</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{product.salePrice.toLocaleString()} <span className="text-xs text-zinc-400">DA</span></p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-right">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Bénéfice</p>
                      <p className="text-lg font-bold text-green-500">+{(product.salePrice - product.purchasePrice).toLocaleString()} <span className="text-xs">DA</span></p>
                    </div>
                  </div>

                  <button
                    disabled={product.quantity <= 0}
                    onClick={() => openSaleModal(product)}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      product.quantity <= 0 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white hover:bg-gold dark:hover:bg-gold dark:hover:text-white shadow-lg'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    {product.quantity <= 0 ? 'Rupture' : 'Vendre Produit'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && user?.role === 'ADMIN' && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold">Historique des Ventes Boutique</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold">Produit</th>
                  <th className="px-6 py-4 font-bold text-center">Qté</th>
                  <th className="px-6 py-4 font-bold text-right">Total</th>
                  <th className="px-6 py-4 font-bold text-right">Bénéfice</th>
                  <th className="px-6 py-4 font-bold">Client</th>
                  <th className="px-6 py-4 font-bold">Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {format(new Date(sale.date), 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 dark:text-white">{sale.product.reference}</div>
                      <div className="text-xs text-zinc-500">{sale.product.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium">x{sale.quantity}</td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-white">{sale.totalAmount.toLocaleString()} DA</td>
                    <td className="px-6 py-4 text-right font-bold text-green-500">+{sale.profit.toLocaleString()} DA</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{sale.customerName || '-'}</div>
                      <div className="text-[10px] text-zinc-400">{sale.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{sale.performedBy}</td>
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
            <p className="text-sm text-zinc-500">Ventes Boutique</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalRevenue.toLocaleString()} DA</h3>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 bg-green-500/10 text-green-500 rounded-2xl w-fit mb-4">
              <ArrowRight size={24} className="-rotate-45" />
            </div>
            <p className="text-sm text-zinc-500">Bénéfice Boutique</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalProfit.toLocaleString()} DA</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl w-fit mb-4">
              <Package size={24} />
            </div>
            <p className="text-sm text-zinc-500">Unités Vendues</p>
            <h3 className="text-3xl font-bold mt-1">{stats.totalSold.toLocaleString()}</h3>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div className={`p-3 rounded-2xl w-fit mb-4 ${stats.lowStockCount > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm text-zinc-500">Articles en Alerte</p>
            <h3 className="text-3xl font-bold mt-1">{stats.lowStockCount + stats.outOfStockCount}</h3>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-800/30">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {editingProduct ? 'Modifier Produit' : 'Nouveau Produit'}
              </h2>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Référence</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: CH-001"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.reference}
                    onChange={(e) => setProductForm({ ...productForm, reference: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Nom du Produit</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Chemise Slim"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Type</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Chemise"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.type}
                    onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Taille</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: XL"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.size}
                    onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Couleur</label>
                  <input
                    required
                    type="text"
                    placeholder="ex: Blanc"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.color}
                    onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Prix Achat (DA)</label>
                  <input
                    required
                    type="number"
                    placeholder="ex: 1500"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                    value={productForm.purchasePrice}
                    onChange={(e) => setProductForm({ ...productForm, purchasePrice: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Prix Vente (DA)</label>
                  <input
                    required
                    type="number"
                    placeholder="ex: 2500"
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none font-bold text-gold"
                    value={productForm.salePrice}
                    onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Quantité en Stock</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                  value={productForm.quantity}
                  onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                />
              </div>

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
              <h2 className="text-2xl font-bold">Vente Boutique</h2>
              <p className="opacity-80 text-sm">{selectedProduct.reference} - {selectedProduct.name}</p>
            </div>
            
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Disponible</p>
                  <p className="text-xl font-bold">{selectedProduct.quantity} unités</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Prix Unitaire</p>
                  <p className="text-xl font-bold text-gold">{selectedProduct.salePrice.toLocaleString()} DA</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase px-1">Quantité</label>
                  <input
                    required
                    type="number"
                    min="1"
                    max={selectedProduct.quantity}
                    className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none font-bold"
                    value={saleForm.quantity}
                    onChange={(e) => setSaleForm({ ...saleForm, quantity: e.target.value })}
                  />
                </div>
              <div className="space-y-4">
                <div className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Remise (DA)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-transparent border-none outline-none font-black text-red-500 text-lg text-right p-0"
                    value={saleForm.discount}
                    onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })}
                  />
                </div>

                <div className="p-4 bg-zinc-900 dark:bg-gold/10 text-white dark:text-gold rounded-2xl flex flex-col justify-center shadow-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total à Payer</span>
                    {user?.role === 'ADMIN' && <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Profit</span>}
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black">{(saleForm.quantity * selectedProduct.salePrice - (parseFloat(saleForm.discount) || 0)).toLocaleString()} DA</span>
                    {user?.role === 'ADMIN' && <span className="text-lg font-bold text-green-400">+{(saleForm.quantity * (selectedProduct.salePrice - selectedProduct.purchasePrice) - (parseFloat(saleForm.discount) || 0)).toLocaleString()} DA</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Nom du Client (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Ahmed"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                  value={saleForm.customerName}
                  onChange={(e) => setSaleForm({ ...saleForm, customerName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Téléphone</label>
                <input
                  type="text"
                  placeholder="ex: 0550..."
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none"
                  value={saleForm.customerPhone}
                  onChange={(e) => setSaleForm({ ...saleForm, customerPhone: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={!saleForm.quantity || saleForm.quantity > selectedProduct.quantity}
                className={`w-full py-4 rounded-2xl font-bold text-xl shadow-xl transition-all mt-4 ${
                  !saleForm.quantity || saleForm.quantity > selectedProduct.quantity
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
                    : 'bg-gold text-white hover:scale-[1.02] shadow-gold/20'
                }`}
              >
                Confirmer la Vente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
