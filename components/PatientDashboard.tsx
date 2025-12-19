import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, FileText, Calendar, ClipboardList, Plus, ChevronRight, Save, Clock, Activity, Printer, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Assessment, Evolution, Patient, User as UserType } from '../types';
import { DocumentPreview } from './DocumentPreview';

interface PatientDashboardProps {
  patient: Patient;
  user: UserType;
  onBack: () => void;
  onUpdate: (p: Patient) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient, user, onBack, onUpdate }) => {
  const [view, setView] = useState<'menu' | 'form_assessment' | 'form_evolution'>('menu');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const [previewData, setPreviewData] = useState<{type: 'assessment'|'evolutions', data: any} | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  const isArchived = patient.status === 'archived';

  useEffect(() => {
    const loadData = async () => {
        setLoading(true);
        try {
            const assessData = await api.getAssessment(patient.id);
            setAssessment(assessData);
            const evoData = await api.getEvolutions(patient.id);
            setEvolutions(evoData);
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoading(false);
        }
    };
    if (patient.id) {
        loadData();
    }
  }, [patient]);

  const handleSaveAssessment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(fd.entries());

    // Garantir tipos corretos para o backend
    if (data.painLevel && data.painLevel.trim() !== "") {
        data.painLevel = parseInt(data.painLevel, 10);
    } else {
        delete data.painLevel;
    }

    try {
        const saved = await api.saveAssessment(patient.id, data);
        setAssessment(saved);
        setView('menu');
        alert('Avaliação salva com sucesso!');
    } catch(err: any) {
        console.error(err);
        alert("Erro ao salvar: " + err.message);
    }
  };

  const handleSaveEvolution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: any = Object.fromEntries(fd.entries());
    data.date = new Date().toISOString();

    try {
        const newEvo = await api.createEvolution(patient.id, data);
        setEvolutions([newEvo, ...evolutions]);
        setView('menu');
        alert('Evolução registrada com sucesso!');
    } catch(err: any) {
        alert("Erro ao salvar evolução: " + err.message);
    }
  };

  const handleToggleStatus = async () => {
    if (!patient || !patient.id) {
        alert("Erro: ID do paciente inválido.");
        return;
    }

    const newStatus = isArchived ? 'active' : 'archived';
    setStatusLoading(true);

    try {
        const response = await api.updatePatient(patient.id, { status: newStatus });
        onUpdate(response); // Atualiza o estado no componente pai
        alert(`Status alterado para: ${newStatus === 'active' ? 'Ativo' : 'Arquivado'}`);
    } catch (error: any) {
        console.error("Erro detalhado:", error);
        alert("Erro ao atualizar status: " + error.message);
    } finally {
        setStatusLoading(false);
    }
  };

  if (previewData) return <DocumentPreview type={previewData.type} data={previewData.data} patient={patient} userName={user.name} userCrefito={user.crefito} onClose={() => setPreviewData(null)} />;

  if (view === 'form_assessment') return (
    <div className="max-w-4xl mx-auto pb-20 animate-in">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => setView('menu')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><ArrowLeft size={16}/> Voltar</button>
        <h2 className="text-xl font-bold text-teal-800">Ficha de Avaliação</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSaveAssessment}>
          <div className="grid md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 border-b pb-1">Anamnese</h3>
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Queixa Principal (QP)</label>
                <textarea name="complaint" defaultValue={assessment?.complaint} required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 min-h-[80px]" />
             </div>
             <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">História da Doença Atual (HDA)</label>
                <textarea name="hda" defaultValue={assessment?.hda} rows={3} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">História Patológica Pregressa (HPP)</label>
                <textarea name="hpp" defaultValue={assessment?.hpp} rows={3} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>

             <div className="md:col-span-2">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 border-b pb-1 mt-4">Exame Físico</h3>
             </div>
             <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Escala de Dor (0-10)</label>
                <input 
                  name="painLevel" 
                  type="number" 
                  min="0" 
                  max="10" 
                  onInput={(e) => {
                    const val = parseInt(e.currentTarget.value);
                    if (val > 10) e.currentTarget.value = "10";
                    if (val < 0) e.currentTarget.value = "0";
                  }}
                  defaultValue={assessment?.painLevel} 
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" 
                />
             </div>
             <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Sinais Vitais</label>
                <input name="vitals" defaultValue={assessment?.vitals} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             
             {/* Novos Campos */}
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Avaliação Respiratória</label>
                <textarea name="respiratory" defaultValue={assessment?.respiratory} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>

             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Inspeção e Palpação</label>
                <textarea name="inspection" defaultValue={assessment?.inspection} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Amplitude de Movimento (ADM) e Força</label>
                <textarea name="rom" defaultValue={assessment?.rom} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>

             {/* Mais Novos Campos */}
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Exame Neurológico</label>
                <textarea name="neurological" defaultValue={assessment?.neurological} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Testes Funcionais</label>
                <textarea name="functionalTests" defaultValue={assessment?.functionalTests} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>

             <div className="md:col-span-2">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 border-b pb-1 mt-4">Conclusão</h3>
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Diagnóstico Cinesiológico Funcional</label>
                <input name="diagnosis" defaultValue={assessment?.diagnosis} required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>

             <div className="md:col-span-2">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 border-b pb-1 mt-4">Observação</h3>
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Deambulação</label>
                <div className="flex flex-wrap gap-4">
                  {['Livre', 'Bengala', 'Andador', 'Cadeira de rodas', 'Leito'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="ambulation" value={option} defaultChecked={assessment?.ambulation === option} className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300" />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
             </div>

             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">Tônus</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-4">
                    {['Normotonia', 'Hipotonia', 'Hipertonia'].map((option) => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tonus" value={option} defaultChecked={assessment?.tonus === option} className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300" />
                        <span className="text-sm text-gray-700">{option}</span>
                        </label>
                    ))}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tonus" value="Outros" defaultChecked={assessment?.tonus === 'Outros'} className="w-4 h-4 text-teal-600 focus:ring-teal-500 border-gray-300" />
                        <span className="text-sm text-gray-700">Outros</span>
                    </label>
                  </div>
                  <input name="tonusOther" placeholder="Especifique se outros..." defaultValue={assessment?.tonusOther} className="w-full mt-2 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 text-sm" />
                </div>
             </div>

             <div className="md:col-span-2 mt-4">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-3 border-b pb-1">Tratamento Proposto</h3>
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Objetivo</label>
                <textarea name="treatmentGoal" defaultValue={assessment?.treatmentGoal} rows={2} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
             <div className="md:col-span-2 mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-1">Conduta</label>
                <textarea name="treatmentConduct" defaultValue={assessment?.treatmentConduct} rows={3} className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" />
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
              <button type="button" onClick={() => setView('menu')} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg hover:bg-teal-800"><Save size={16}/> Salvar Ficha</button>
          </div>
        </form>
      </div>
    </div>
  );

  if (view === 'form_evolution') return (
    <div className="max-w-3xl mx-auto pb-20 animate-in">
      <div className="flex items-center gap-4 mb-6">
        <button type="button" onClick={() => setView('menu')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"><ArrowLeft size={16}/> Voltar</button>
        <h2 className="text-xl font-bold text-blue-800">Nova Evolução (Sessão)</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg mb-6 flex items-start gap-2">
            <ClipboardList size={18} className="mt-0.5" />
            <div><strong>Método SOAP:</strong> Preencha os campos abaixo para registrar o atendimento de hoje.</div>
        </div>
        <form onSubmit={handleSaveEvolution}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">S - Subjetivo</label>
            <textarea name="subjective" placeholder="Relato do paciente..." required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">O - Objetivo</label>
            <textarea name="objective" placeholder="O que você observou/mediu..." className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">A - Avaliação/Procedimentos</label>
            <textarea name="assessment" placeholder="O que foi feito na sessão..." required className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">P - Plano</label>
            <textarea name="plan" placeholder="Orientações para casa ou próxima sessão..." className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setView('menu')} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
              <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"><Save size={16}/> Salvar Evolução</button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className={`pb-20 animate-in min-h-screen ${isArchived ? 'bg-red-50/50' : ''}`}>
       <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 p-6 rounded-xl border shadow-sm transition-colors ${isArchived ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="h-12 w-12 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><ArrowLeft size={20}/></button>
             <div>
                <h1 className={`text-3xl font-bold ${isArchived ? 'text-red-900' : 'text-gray-900'}`}>{patient.name}</h1>
                <div className={`flex gap-4 text-sm mt-1 ${isArchived ? 'text-red-700' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1"><User size={14}/> {patient.phone}</span>
                    {patient.cpf && <span className="flex items-center gap-1"><FileText size={14}/> {patient.cpf}</span>}
                    <span className="flex items-center gap-1"><Calendar size={14}/> {patient.birthDate}</span>
                </div>
             </div>
          </div>
          <div className="flex flex-col items-end gap-2">
             {isArchived ? (
                <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 border border-red-300">
                    <AlertCircle size={12}/> Alta / Inativo
                </span>
             ) : (
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                    <Activity size={12}/> Em Tratamento
                </span>
             )}
          </div>
       </div>

       <div className="grid md:grid-cols-3 gap-8">
          <div className="space-y-6">
             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Prontuário</h3>
                <div className="space-y-3">
                    <button onClick={() => setView('form_assessment')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-teal-100 p-2 rounded text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors"><ClipboardList size={20}/></div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-700 group-hover:text-teal-800">Avaliação</span>
                                <span className="block text-xs text-gray-400">{assessment ? 'Editar Ficha' : 'Criar Nova'}</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300"/>
                    </button>

                    <button onClick={() => setView('form_evolution')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Plus size={20}/></div>
                            <div className="text-left">
                                <span className="block font-bold text-gray-700 group-hover:text-blue-800">Nova Evolução</span>
                                <span className="block text-xs text-gray-400">Registrar Sessão</span>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300"/>
                    </button>
                </div>
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Relatórios PDF</h3>
                <div className="space-y-2">
                    <button className="w-full flex justify-between items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50" onClick={() => assessment ? setPreviewData({type:'assessment', data:assessment}) : alert('Preencha a avaliação primeiro')}>
                        <span>Ficha de Avaliação</span> <Printer size={14}/>
                    </button>
                    <button className="w-full flex justify-between items-center px-4 py-2 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50" onClick={() => evolutions.length ? setPreviewData({type:'evolutions', data:evolutions}) : alert('Sem evoluções registradas')}>
                        <span>Histórico de Evoluções</span> <Printer size={14}/>
                    </button>
                </div>
             </div>

             <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-400 text-xs uppercase mb-4 tracking-wider">Administrativo</h3>
                <button
                    onClick={handleToggleStatus}
                    disabled={statusLoading}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all group ${isArchived ? 'border-green-200 hover:bg-green-50' : 'border-red-200 hover:bg-red-50'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded transition-colors ${isArchived ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            <User size={20}/>
                        </div>
                        <div className="text-left">
                            <span className={`block font-bold ${isArchived ? 'text-green-800' : 'text-red-800'}`}>
                                {isArchived ? 'Reativar Paciente' : 'Dar Alta'}
                            </span>
                            <span className="block text-xs text-gray-400">
                                {isArchived ? 'Tornar paciente ativo novamente' : 'Arquivar paciente'}
                            </span>
                        </div>
                    </div>
                    {statusLoading ? <div className="animate-spin text-gray-400">...</div> : <ChevronRight size={16} className="text-gray-300"/>}
                </button>
             </div>
          </div>

          <div className="md:col-span-2 space-y-6">
             {/* RESUMO CLÍNICO - DESIGN ATUALIZADO PARA MAIOR VISIBILIDADE */}
             <div className="bg-teal-50 rounded-xl shadow-sm border border-teal-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-teal-900"><ClipboardList size={100}/></div>
                <h3 className="font-bold text-lg text-teal-900 mb-4 flex items-center gap-2 relative z-10">
                    <Activity className="text-teal-700" size={20}/> Resumo Clínico
                </h3>
                {assessment ? (
                    <div className="grid gap-4 text-sm relative z-10">
                        <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm">
                            <span className="block text-xs font-bold text-teal-600 uppercase mb-1">Queixa Principal</span>
                            <p className="font-medium text-gray-900 text-base">{assessment.complaint}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm">
                            <span className="block text-xs font-bold text-teal-600 uppercase mb-1">Diagnóstico</span>
                            <p className="font-medium text-gray-900">{assessment.diagnosis}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-teal-600 border-2 border-dashed border-teal-200 rounded-lg bg-white/50">
                        <p>Nenhuma avaliação registrada.</p>
                    </div>
                )}
             </div>

             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-6 flex items-center gap-2">
                    <Clock className="text-blue-600" size={20}/> Histórico de Sessões
                </h3>
                <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-0 before:w-0.5 before:bg-gray-100">
                    {evolutions.length === 0 ? (
                        <p className="text-gray-400 text-center py-4 text-sm pl-8">Nenhuma sessão realizada.</p>
                    ) : (
                        evolutions.map((evo, i) => (
                            <div key={i} className="relative pl-10">
                                <div className="absolute left-0 top-1 w-10 h-10 bg-white border-4 border-blue-50 rounded-full flex items-center justify-center z-10">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                                        {evo.date ? new Date(evo.date).toLocaleDateString() : 'Data inválida'}
                                    </span>
                                    <div className="bg-gray-50 p-3 rounded-lg mt-1 border border-gray-100">
                                        <p className="text-sm font-medium text-gray-800 mb-1">{evo.assessment}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">{evo.subjective}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};