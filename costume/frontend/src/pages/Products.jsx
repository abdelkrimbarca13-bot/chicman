import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Package, Plus, Search, Trash2, Edit2, ShoppingCart, 
  History, BarChart3, AlertTriangle, Check, X, ArrowRight,
  TrendingUp, Calendar, Info, QrCode, Tag, Printer,
  Download, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import SaleReceipt from '../components/SaleReceipt';
import ProductLabel from '../components/ProductLabel';

const Products = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [receiptToShow, setReceiptToShow] = useState(null);
  const [labelToShow, setLabelToShow] = useState(null);
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
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

  const [cart, setCart] = useState([]);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({
    customerName: '',
    customerPhone: '',
    discount: 0
  });

  const [editingSale, setEditingSale] = useState(null);
  const [editAmount, setEditAmount] = useState('');

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
    if (cart.length === 0) return;
    try {
      const res = await api.post('/products/sales', {
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity
        })),
        customerName: saleForm.customerName,
        customerPhone: saleForm.customerPhone,
        discount: parseFloat(saleForm.discount) || 0
      });
      setIsSaleModalOpen(false);
      setCart([]);
      setSaleForm({ customerName: '', customerPhone: '', discount: 0 });
      fetchData();
      
      // Prepare receipt data
      const firstSale = res.data.sales[0];
      const receiptData = {
        id: firstSale.id,
        customerName: firstSale.customerName || 'Client Comptant',
        customerPhone: firstSale.customerPhone || '-',
        totalAmount: res.data.sales.reduce((sum, s) => sum + s.totalAmount, 0),
        createdAt: firstSale.date,
        items: res.data.sales.map(s => ({
          itemName: s.product.name,
          itemRef: s.product.reference,
          itemType: s.product.type,
          itemColor: s.product.color,
          itemSize: s.product.size,
          price: s.unitPrice,
          quantity: s.quantity
        }))
      };
      setReceiptToShow(receiptData);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la vente');
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          alert('Stock insuffisant');
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId, newQty) => {
    const product = products.find(p => p.id === productId);
    const qty = Math.max(1, Math.min(product?.quantity || 1, parseInt(newQty) || 1));
    setCart(prev => prev.map(item => item.id === productId ? { ...item, quantity: qty } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.salePrice * item.quantity), 0);

  const handleDeleteSale = async (id) => {
    if (user?.role !== 'ADMIN') return;
    if (confirm('Supprimer cette vente ? Le stock sera restauré.')) {
      try {
        await api.delete(`/products/sales/${id}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleUpdateSale = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/products/sales/${editingSale.id}`, { totalAmount: parseFloat(editAmount) });
      setEditingSale(null);
      setEditAmount('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
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

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get('/products/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_boutique.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Erreur lors du téléchargement du template');
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Importation réussie: ${res.data.success} succès, ${res.data.errors} erreurs.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'importation');
    } finally {
      setLoading(false);
      e.target.value = '';
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

  const openSaleModal = () => {
    setSaleForm({ customerName: '', customerPhone: '', discount: 0 });
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
        
        <div className="flex items-center gap-4">
          {cart.length > 0 && (
            <button
              onClick={openSaleModal}
              className="flex items-center gap-2 px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl shadow-lg hover:bg-gold transition-colors font-bold"
            >
              <ShoppingCart size={18} />
              Panier ({cart.length}) - {cartTotal.toLocaleString()} DA
            </button>
          )}

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
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  title="Télécharger Template Excel"
                >
                  <Download size={18} />
                </button>
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-xl cursor-pointer hover:bg-green-500/20 transition-colors" title="Importer Excel">
                  <Upload size={18} />
                  <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImportExcel} />
                </label>
                <button
                  onClick={() => { setEditingProduct(null); setProductForm({ reference: '', name: '', type: '', size: '', color: '', purchasePrice: '', salePrice: '', quantity: 0 }); setIsProductModalOpen(true); }}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-gold text-white rounded-xl shadow-lg shadow-gold/20 hover:scale-105 transition-transform"
                >
                  <Plus size={20} /> Nouveau Produit
                </button>
              </div>
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
                    <button onClick={() => setLabelToShow(product)} className="p-2 text-zinc-400 hover:text-gold transition-colors" title="Imprimer Étiquette"><Tag size={16} /></button>
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

                  <div className={`grid ${user?.role === 'ADMIN' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 pt-2`}>
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Prix Vente</p>
                      <p className="text-lg font-bold text-zinc-900 dark:text-white">{product.salePrice.toLocaleString()} <span className="text-xs text-zinc-400">DA</span></p>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-right">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Bénéfice</p>
                        <p className="text-lg font-bold text-green-500">+{(product.salePrice - product.purchasePrice).toLocaleString()} <span className="text-xs">DA</span></p>
                      </div>
                    )}
                  </div>

                  <button
                    disabled={product.quantity <= 0}
                    onClick={() => addToCart(product)}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      product.quantity <= 0 
                        ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        : cart.some(item => item.id === product.id)
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-zinc-900 dark:bg-white dark:text-zinc-900 text-white hover:bg-gold dark:hover:bg-gold dark:hover:text-white shadow-lg'
                    }`}
                  >
                    {cart.some(item => item.id === product.id) ? (
                      <><Check size={18} /> Ajouté au panier</>
                    ) : (
                      <><ShoppingCart size={18} /> {product.quantity <= 0 ? 'Rupture' : 'Ajouter au panier'}</>
                    )}
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
                  <th className="px-6 py-4 font-bold text-center">Actions</th>
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
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => {
                            const receiptData = {
                              id: sale.id,
                              customerName: sale.customerName || 'Client Comptant',
                              customerPhone: sale.customerPhone || '-',
                              totalAmount: sale.totalAmount,
                              createdAt: sale.date,
                              items: [{
                                itemName: sale.product.name,
                                itemRef: sale.product.reference,
                                itemType: sale.product.type,
                                itemColor: sale.product.color,
                                itemSize: sale.product.size,
                                price: sale.unitPrice,
                                quantity: sale.quantity
                              }]
                            };
                            setReceiptToShow(receiptData);
                          }} 
                          className="p-2 text-zinc-400 hover:text-gold rounded-lg transition-colors" 
                          title="Imprimer le bon"
                        >
                          <Printer size={16} />
                        </button>
                        <button onClick={() => { setEditingSale(sale); setEditAmount(sale.totalAmount); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteSale(sale.id)} className="p-2 text-red-500 hover:bg-red-50/50 rounded-lg transition-colors"><Trash2 size={16} /></button>
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
      {isSaleModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-gold text-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold">Valider la Vente</h2>
                <p className="opacity-80 text-sm">{cart.length} articles dans le panier</p>
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSaleSubmit} className="p-6 space-y-6">
              {/* Cart Items Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest px-1">Articles sélectionnés</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <div className="flex-1">
                        <div className="font-bold">{item.name}</div>
                        <div className="text-[10px] text-zinc-500 uppercase">{item.reference} | {item.size}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                          <button 
                            type="button" 
                            onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                            className="p-1 px-3 hover:text-gold font-bold text-lg"
                          >-</button>
                          <span className="px-2 font-bold min-w-[30px] text-center">{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-3 hover:text-gold font-bold text-lg"
                          >+</button>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <div className="font-bold text-gold">{(item.salePrice * item.quantity).toLocaleString()} DA</div>
                          <div className="text-[10px] text-zinc-400">{item.salePrice.toLocaleString()} / u</div>
                        </div>
                        <button type="button" onClick={() => removeFromCart(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-4">
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
                </div>

                <div className="space-y-4">
                  <div className="w-full bg-zinc-100 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex flex-col justify-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Remise Totale (DA)</label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full bg-transparent border-none outline-none font-black text-red-500 text-2xl text-right p-0"
                      value={saleForm.discount}
                      onChange={(e) => setSaleForm({ ...saleForm, discount: e.target.value })}
                    />
                  </div>

                  <div className="p-4 bg-zinc-900 dark:bg-gold/10 text-white dark:text-gold rounded-2xl flex flex-col justify-center shadow-lg border border-gold/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Final</span>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Sous-total: {cartTotal.toLocaleString()} DA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-black">{(cartTotal - (parseFloat(saleForm.discount) || 0)).toLocaleString()} DA</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaleModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-200 transition-colors"
                >
                  Continuer les achats
                </button>
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className={`flex-[2] py-4 rounded-2xl font-bold text-xl shadow-xl transition-all ${
                    cart.length === 0
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed shadow-none'
                      : 'bg-gold text-white hover:scale-[1.02] shadow-gold/20'
                  }`}
                >
                  Confirmer la Vente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Modifier Vente</h2>
              <button onClick={() => setEditingSale(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateSale} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Montant Total (DA)</label>
                <input
                  required
                  type="number"
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-gold outline-none font-bold text-xl"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-gold text-white font-bold rounded-2xl shadow-xl shadow-gold/20 hover:scale-105 transition-transform">
                Sauvegarder
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Receipt Modal */}
      {receiptToShow && (
        <SaleReceipt sale={receiptToShow} onClose={() => setReceiptToShow(null)} />
      )}
      {/* Label Modal */}
      {labelToShow && (
        <ProductLabel product={labelToShow} onClose={() => setLabelToShow(null)} />
      )}
    </div>
  );
};

export default Products;
