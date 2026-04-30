import React, { useEffect, useState } from 'react';
import api from '../api';
import { DollarSign, ArrowDownCircle, ArrowUpCircle, Plus, Receipt, Calculator, Calendar, X, User, ShoppingBag, Info, Search, Filter, Download, Printer, LogOut, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const Cash = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [dailyCash, setDailyCash] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [history, setHistory] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  // Modal states
  const [isInitialCashModalOpen, setIsInitialCashModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState(null); // { date, payments, expenses, totals }
  const [globalSummary, setGlobalSummary] = useState(null);
  
  const [initialAmount, setInitialAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalDescription, setWithdrawalDescription] = useState('');
  const [newExpense, setNewExpense] = useState({ amount: '', description: '', slipNumber: '', category: 'AUTRE' });

  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const calls = [
        api.get('/cash/status'),
        api.get(`/cash/expenses?date=${today}`)
      ];

      if (isAdmin) {
        calls.push(api.get('/cash/history'));
        calls.push(api.get('/cash/summary')); 
        calls.push(api.get('/cash/withdrawals')); 
      }

      const results = await Promise.all(calls);
      
      setDailyCash(results[0].data);
      setExpenses(results[1].data);
      if (isAdmin && results[2]) {
        setHistory(results[2].data);
      }
      if (isAdmin && results[3]) {
        setGlobalSummary(results[3].data);
      }
      if (isAdmin && results[4]) {
        setWithdrawals(results[4].data);
      }
    } catch {
      console.error('Erreur chargement caisse');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSetInitialCash = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cash/initial', { amount: parseFloat(initialAmount) });
      setIsInitialCashModalOpen(false);
      setInitialAmount('');
      fetchData();
    } catch {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await api.put(`/cash/expense/${editingExpense.id}`, newExpense);
      } else {
        const payload = { 
          ...newExpense, 
          description: `[${newExpense.category}] ${newExpense.description}` 
        };
        await api.post('/cash/expense', payload);
      }
      setIsExpenseModalOpen(false);
      setEditingExpense(null);
      setNewExpense({ amount: '', description: '', slipNumber: '', category: 'AUTRE' });
      fetchData();
      if (detailModal) {
        const res = await api.get(`/cash/details/${detailModal.date}`);
        setDetailModal(res.data);
      }
    } catch {
      alert('Erreur lors de l\'enregistrement');
    }
  };
