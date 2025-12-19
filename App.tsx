import React, { useState, useEffect } from 'react';
import { Activity, Plus, Search, LogOut, ChevronRight, User, FileText, Calendar, Users, X, Settings, Save } from 'lucide-react';
import { api } from './services/api';
import { AuthScreen } from './components/AuthScreen';
import { PatientDashboard } from './components/PatientDashboard';
import { AgendaView } from './components/AgendaView';
import { Patient, User as UserType, LoginResponse } from './types';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentTab, setCurrentTab] = useState<'patients' | 'agenda'>('patients');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Verificar Login
  useEffect(() => {
    const stored = localStorage.getItem('fisio_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  // 2. Load Patients
  useEffect(() => {
    if (user && !selectedPatient) {
        api.getPatients().then(setPatients).catch(console.error);
    }
  }, [user, selectedPatient, showAdd, currentTab]);

  const handleLogin = (data: LoginResponse) => {
    localStorage.setItem('fisio_token', data.token);
    localStorage.setItem('fisio_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;
    const crefito = fd.get('crefito') as string;

    const updatedUser = { ...user, name, email, crefito };
    setUser(updatedUser);
    localStorage.setItem('fisio_user', JSON.stringify(updatedUser));
    setShowProfile(false);
    alert('Dados atualizados com sucesso!');
  };

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(fd.entries());

    try {
        await api.createPatient(data);
        setShowAdd(false);
        const updated = await api.getPatients();
        setPatients(updated);
        alert('Paciente cadastrado com sucesso!');
    } catch(err: any) {
        alert("Erro ao criar paciente: " + err.message);
    }
  };

  const handleUpdatePatient = (updated: Patient) => {
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    if (selectedPatient?.id === updated.id) setSelectedPatient(updated);
  };

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  if (selectedPatient) return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 app-container">
        <PatientDashboard
            patient={selectedPatient}
            user={user}
            onBack={() => setSelectedPatient(null)}
            onUpdate={handleUpdatePatient}
        />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 app-container">
      {/* Header Dashboard */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="bg-teal-600 text-white p-1.5 rounded-lg shadow">
                  <Activity size={20} />
               </div>
               <span className="font-bold text-gray-800 text-lg hidden sm:inline">FisioManager</span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setCurrentTab('patients')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currentTab === 'patients' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Pacientes
                </button>
                <button
                  onClick={() => setCurrentTab('agenda')}
                  className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${currentTab === 'agenda' ? 'bg-white text-teal-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Agenda
                </button>
            </div>

            <div className="flex items-center gap-4">
               <div className="text-right hidden sm:block">
                   <p className="text-sm font-bold text-gray-700">{user.name}</p>
                   <p className="text-xs text-gray-500">Administrador</p>
               </div>
               <div className="h-8 w-px bg-gray-200 mx-2"></div>
               
               <button onClick={() => setShowProfile(true)} className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded transition-colors" title="Editar Perfil">
                  <Settings size={18}/>
               </button>

               <button onClick={handleLogout} className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors" title="Sair">
                  <LogOut size={18}/>
               </button>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
         {currentTab === 'patients' && (
           <div className="animate-in">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Meus Pacientes</h1>
                    <p className="text-gray-500">Gerencie seus atendimentos de forma simples.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg shadow-lg shadow-teal-100 hover:bg-teal-800 active:scale-95 transition-all"><Plus size={18}/> Novo Paciente</button>
             </div>

             <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    className="w-full pl-12 pr-4 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                    placeholder="Buscar por nome, CPF ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>

             {patients.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-xl border-2 border-dashed border-gray-200">
                   <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Users size={40} className="text-gray-300" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-700">Sua lista está vazia</h3>
                   <p className="text-gray-500 mb-6">Comece cadastrando seu primeiro paciente no botão acima.</p>
                </div>
             ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                   {patients.filter(p =>
                      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (p.cpf && p.cpf.includes(searchTerm)) ||
                      (p.phone && p.phone.includes(searchTerm))
                   ).map(p => {
                      const status = p.status || 'active';
                      return (
                      <div key={p.id} onClick={() => setSelectedPatient(p)} className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden ${status === 'archived' ? 'border-red-200 bg-red-50 opacity-90' : 'border-gray-200 hover:border-teal-300'}`}>
                          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <ChevronRight className="text-teal-600" />
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl transition-colors ${status === 'archived' ? 'bg-red-200 text-red-700' : 'bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white'}`}>
                                {p.name.charAt(0)}
                             </div>
                             <div>
                                <h3 className="font-bold text-gray-800 text-lg group-hover:text-teal-700 transition-colors flex items-center gap-2">
                                  {p.name}
                                  {status === 'archived' && <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded uppercase font-bold">Alta</span>}
                                </h3>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Paciente</p>
                             </div>
                          </div>
                          <div className="space-y-2 text-sm text-gray-600 pt-4 border-t border-gray-50">
                             <div className="flex items-center gap-2"><User size={14} className="text-gray-400"/> {p.phone}</div>
                             {p.cpf && <div className="flex items-center gap-2"><FileText size={14} className="text-gray-400"/> {p.cpf}</div>}
                             <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {p.birthDate ? new Date(p.birthDate).toLocaleDateString() : '-'}</div>
                          </div>
                      </div>
                   )})}
                </div>
             )}
           </div>
         )}

         {currentTab === 'agenda' && (
           <AgendaView patients={patients} />
         )}
      </main>

      {/* MODAL NOVO PACIENTE */}
      {showAdd && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Novo Paciente</h2>
                   <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
               </div>
               <form onSubmit={handleAddPatient}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Completo</label>
                    <input name="name" required autoFocus placeholder="Ex: Ana Maria" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">CPF</label>
                    <input name="cpf" placeholder="000.000.000-00" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                    <input name="phone" placeholder="(00) 00000-0000" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Data de Nascimento</label>
                    <input name="birthDate" type="date" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                      <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800">Salvar Cadastro</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* MODAL PERFIL */}
      {showProfile && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-800">Editar Perfil</h2>
                   <button onClick={() => setShowProfile(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
               </div>
               <p className="text-sm text-gray-500 mb-6">Estes dados aparecerão nos documentos impressos.</p>
               <form onSubmit={handleUpdateProfile}>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome Profissional</label>
                    <input name="name" defaultValue={user.name} required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">CREFITO</label>
                    <input name="crefito" defaultValue={user.crefito} placeholder="Ex: 123456-F" className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                    <input name="email" defaultValue={user.email} type="email" required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                      <button type="button" onClick={() => setShowProfile(false)} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                      <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"><Save size={16}/> Salvar Alterações</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}