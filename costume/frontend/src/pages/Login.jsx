import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api';
import logoLight from '../assets/logo.png';
import logoDark from '../assets/logo-blanc.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data);
      navigate('/');
    } catch {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-rich-black transition-colors duration-300">
      <div className="w-full max-w-md p-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gold/20">
        <div className="mb-10 flex justify-center items-center gap-4">
          <img 
            src={theme === 'dark' ? logoDark : logoLight} 
            alt="Chic Man Logo" 
            className="h-16 w-auto object-contain"
          />
          <div className="flex flex-col">
            <span className="text-4xl font-normal text-zinc-900 dark:text-white font-nathalyn leading-none">Chic</span>
            <div className="h-px w-20 bg-gold my-1"></div>
            <span className="text-sm font-light tracking-[0.6em] text-gold font-elegant italic leading-none">MAN</span>
          </div>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">Nom d'utilisateur</label>
            <input
              type="text"
              className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">Mot de passe</label>
            <input
              type="password"
              className="w-full p-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-900 dark:text-white focus:ring-gold focus:border-gold"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-rich-black bg-gold rounded hover:bg-light-gold transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
