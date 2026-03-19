import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login', { username, password });
      login(response.data);
      navigate('/');
    } catch (err) {
      setError('Identifiants invalides');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-900">
      <div className="w-full max-w-md p-10 bg-white rounded-2xl shadow-2xl border border-gray-100">
        <div className="mb-10 flex flex-col items-center">
            <span className="text-7xl font-normal text-indigo-900 font-nathalyn">Chic</span>
            <div className="h-px w-32 bg-amber-500 my-1"></div>
            <span className="text-xl font-light tracking-[0.7em] text-amber-600 font-elegant italic">MEN</span>
        </div>
        {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">Nom d'utilisateur</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              className="w-full p-2 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
