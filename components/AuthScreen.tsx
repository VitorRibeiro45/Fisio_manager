import React, { useState } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { LoginResponse } from '../types';

interface AuthScreenProps {
  onLogin: (data: LoginResponse) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!identifier || !password) {
        setError("Preencha todos os campos.");
        setLoading(false);
        return;
    }

    try {
      const userData = await api.login(identifier, password);
      onLogin(userData);
    } catch (err: any) {
      setError(err.message || 'Erro ao logar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <div className="bg-teal-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-teal-200">
              <Activity size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">FisioManager SaaS</h1>
            <p className="text-sm text-gray-500">Gestão Inteligente de Fisioterapia</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 border border-red-100"><AlertCircle size={16}/> {error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Email ou Usuário</label>
            <input
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="seu@email.com ou usuario"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              type="text"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Senha</label>
            <input
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full h-12 text-lg bg-teal-700 text-white hover:bg-teal-800 shadow-sm rounded-lg font-bold transition-all disabled:opacity-50">
            {loading ? 'Conectando...' : 'Acessar Sistema'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-8">
           © 2024 FisioManager SaaS. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};