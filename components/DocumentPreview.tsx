import React from 'react';
import { X, Printer } from 'lucide-react';
import { Patient, Assessment, Evolution } from '../types';

interface DocumentPreviewProps {
    type: 'assessment' | 'evolutions';
    data: any;
    patient: Patient;
    onClose: () => void;
    userName: string;
    userCrefito?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({ type, data, patient, onClose, userName, userCrefito }) => {
  const currentStatus = patient.status === 'archived' ? 'ALTA / INATIVO' : 'ATIVO';

  return (
    <div className="fixed inset-0 bg-gray-900/90 z-50 overflow-y-auto flex flex-col items-center p-4 md:p-8 backdrop-blur-sm animate-in print-preview-container">
      <div className="w-full max-w-[210mm] flex justify-between items-center mb-4 no-print text-white">
         <h2 className="font-bold text-lg">Visualização de Impressão</h2>
         <div className="flex gap-2">
           <button onClick={onClose} className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded hover:bg-gray-100"><X size={16}/> Fechar</button>
           <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"><Printer size={16}/> Imprimir / Salvar PDF</button>
         </div>
      </div>

      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] shadow-2xl text-black relative print-content mx-auto flex flex-col">
        {/* Header A4 */}
        <div className="border-b-2 border-teal-800 pb-4 mb-6 flex justify-between items-end">
            <div>
                <h1 className="text-2xl font-bold uppercase text-gray-800 tracking-wide">FisioManager</h1>
                <p className="text-sm text-gray-500 uppercase tracking-widest">Sistema de Prontuário Eletrônico</p>
            </div>
            <div className="text-right text-xs">
                <p>Gerado em: {new Date().toLocaleDateString()}</p>
            </div>
        </div>

        {/* Patient Header */}
        <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-8 text-sm grid grid-cols-2 gap-4">
           <div><span className="font-bold text-gray-600">PACIENTE:</span> <span className="uppercase">{patient.name}</span></div>
           <div><span className="font-bold text-gray-600">CPF:</span> {patient.cpf || '-'}</div>
           <div><span className="font-bold text-gray-600">TELEFONE:</span> {patient.phone}</div>
           <div><span className="font-bold text-gray-600">DATA NASC.:</span> {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
           <div className={currentStatus === 'ALTA / INATIVO' ? "text-red-600 font-bold" : "text-green-700 font-bold"}>
             <span className="text-gray-600 font-bold">STATUS:</span> {currentStatus}
           </div>
        </div>

        <div className="flex-1">
            {type === 'assessment' && (
            <div className="space-y-8 text-sm">
                <div className="bg-teal-700 text-white p-2 font-bold uppercase text-center rounded-sm tracking-widest">Ficha de Avaliação</div>

                <section>
                    <h3 className="font-bold border-b border-gray-300 mb-3 text-teal-800 uppercase text-xs">1. Anamnese</h3>
                    <div className="space-y-3">
                    <p><strong className="text-gray-700">Queixa Principal (QP):</strong><br/> {(data as Assessment).complaint || "Não informado"}</p>
                    <p><strong className="text-gray-700">História da Doença Atual (HDA):</strong><br/> {(data as Assessment).hda || "---"}</p>
                    <p><strong className="text-gray-700">História Patológica Pregressa (HPP):</strong><br/> {(data as Assessment).hpp || "---"}</p>
                    </div>
                </section>

                <section>
                    <h3 className="font-bold border-b border-gray-300 mb-3 text-teal-800 uppercase text-xs">2. Exame Físico</h3>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="border p-2 rounded text-center">
                        <strong className="block text-gray-500 text-xs">EVA (Dor)</strong>
                        <span className="text-2xl font-bold text-teal-700">{(data as Assessment).painLevel || 0}<span className="text-sm text-gray-400">/10</span></span>
                        </div>
                        <div className="border p-2 rounded">
                        <strong className="block text-gray-500 text-xs mb-1">Sinais Vitais</strong>
                        {(data as Assessment).vitals || "Normais"}
                        </div>
                    </div>
                    {/* Novos Campos */}
                    {(data as Assessment).respiratory && <p className="mb-2"><strong className="text-gray-700">Avaliação Respiratória:</strong><br/> {(data as Assessment).respiratory}</p>}
                    
                    <p><strong className="text-gray-700">Inspeção/Palpação:</strong><br/> {(data as Assessment).inspection || "---"}</p>
                    <p className="mt-2"><strong className="text-gray-700">ADM / Força:</strong><br/> {(data as Assessment).rom || "---"}</p>

                    {/* Mais Novos Campos */}
                    {(data as Assessment).neurological && <p className="mt-2"><strong className="text-gray-700">Exame Neurológico:</strong><br/> {(data as Assessment).neurological}</p>}
                    {(data as Assessment).functionalTests && <p className="mt-2"><strong className="text-gray-700">Testes Funcionais:</strong><br/> {(data as Assessment).functionalTests}</p>}

                </section>

                <section>
                    <h3 className="font-bold border-b border-gray-300 mb-3 text-teal-800 uppercase text-xs">3. Diagnóstico Cinesiológico</h3>
                    <p className="mb-2"><strong className="text-gray-700">Diagnóstico Cinesiológico:</strong><br/> {(data as Assessment).diagnosis || "---"}</p>
                </section>

                <section>
                    <h3 className="font-bold border-b border-gray-300 mb-3 text-teal-800 uppercase text-xs">4. Observação</h3>
                    <p className="mb-2"><strong className="text-gray-700">Deambulação:</strong> {(data as Assessment).ambulation || "---"}</p>
                    <p><strong className="text-gray-700">Tônus:</strong> {(data as Assessment).tonus === 'Outros' ? ((data as Assessment).tonusOther || 'Outros') : ((data as Assessment).tonus || "---")}</p>
                </section>

                <section>
                    <h3 className="font-bold border-b border-gray-300 mb-3 text-teal-800 uppercase text-xs">5. Tratamento Fisioterapêutico Proposto</h3>
                    <p className="mb-2"><strong className="text-gray-700">Objetivo:</strong><br/> {(data as Assessment).treatmentGoal || "---"}</p>
                    <p className="mb-2"><strong className="text-gray-700">Conduta:</strong><br/> {(data as Assessment).treatmentConduct || "---"}</p>
                </section>
            </div>
            )}

            {type === 'evolutions' && (
            <div className="space-y-4 text-sm">
                <div className="bg-teal-700 text-white p-2 font-bold uppercase text-center rounded-sm tracking-widest">Relatório de Evolução (SOAP)</div>
                <table className="w-full border-collapse border border-gray-300 mt-4">
                <thead>
                    <tr className="bg-gray-100 text-gray-600 text-xs uppercase">
                    <th className="border p-2 w-32 text-left">Data / Hora</th>
                    <th className="border p-2 text-left">Descrição do Atendimento</th>
                    </tr>
                </thead>
                <tbody>
                    {(data as Evolution[]).map((evo, i) => (
                    <tr key={i} className="break-inside-avoid hover:bg-gray-50">
                        <td className="border p-3 align-top font-bold text-gray-700">
                            {evo.date ? new Date(evo.date).toLocaleDateString('pt-BR') : 'Hoje'} <br/>
                            <span className="text-xs font-normal text-gray-500">{evo.date ? new Date(evo.date).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : ''}</span>
                        </td>
                        <td className="border p-3">
                        <div className="grid gap-2">
                            <div className="flex gap-2"><strong className="text-teal-700 w-4">S:</strong> <span>{evo.subjective}</span></div>
                            <div className="flex gap-2"><strong className="text-teal-700 w-4">O:</strong> <span>{evo.objective}</span></div>
                            <div className="flex gap-2"><strong className="text-teal-700 w-4">A:</strong> <span>{evo.assessment}</span></div>
                            <div className="flex gap-2"><strong className="text-teal-700 w-4">P:</strong> <span>{evo.plan}</span></div>
                        </div>
                        </td>
                    </tr>
                    ))}
                    {(data as Evolution[]).length === 0 && <tr><td colSpan={2} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>}
                </tbody>
                </table>
            </div>
            )}
        </div>

        {/* Footer A4 */}
        <div className="mt-auto pt-[20mm] text-center">
             <div className="border-t border-black w-64 mx-auto pt-2 mb-1"></div>
             <p className="font-bold text-lg">{userName}</p>
             {userCrefito && <p className="text-sm text-gray-700">CREFITO: {userCrefito}</p>}
             <p className="text-xs text-gray-500 uppercase tracking-widest">Fisioterapeuta Responsável</p>
        </div>
      </div>
    </div>
  );
};