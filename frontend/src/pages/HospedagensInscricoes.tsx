import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Search, Filter, Edit, Trash2, FileText, Mail, Plus, X, 
  Loader2, ArrowLeft, Save, ClipboardList,
} from 'lucide-react';

interface Hospedagem {
  idhospedagens: string;
  hos_categoria: string;
  hos_nome: string;
  hos_nascimento: string;
  hos_cpfrg: string;
  hos_email: string;
  hos_telefone: string;
  hos_telefoneemergencia: string;
  hos_logradouro: string;
  hos_numero: string;
  hos_cep: string;
  hos_bairro: string;
  hos_cidade: string;
  hos_estado: string;
  hos_alergico: string;
  hos_especifiquealergia: string;
  hos_restricaoalimentar: string;
  hos_especifiquerestricao: string;
  hos_lavanderia: string;
  hos_estadiamotivo: string;
  hos_modulo: string;
  hos_previsaochegada: string;
  hos_previsaosaida: string;
  hos_recibo: string;
  hos_recnome: string;
  hos_reccpfcnpj: string;
  hos_reclogradouro: string;
  hos_recnumero: string;
  hos_reccep: string;
  hos_recbairro: string;
  hos_reccidade: string;
  hos_recestado: string;
  hos_termo: string;
  hos_status: string;
  hos_checkin: string;
  hos_checkout: string;
  hos_quarto: string;
  hos_inscricao: string;
}

interface MetaData {
  motivos: Array<{ idmainhospedagem: string; main_motivo: string }>;
  modulos: Array<{ idmodulos: string; mod_nome: string }>;
  status: Array<{ idstatushospedagem: string; sta_nome: string }>;
  quartos: Array<{ idhos_quartos: string; hos_qua_nome: string }>;
  lavanderias: Array<{ idlavanderia: string; lav_servico: string }>;
  colunasVisiveis: string[];
  colunasInvisiveis: string[];
}

export const HospedagensInscricoes: React.FC = () => {
  // List State
  const [inscricoes, setInscricoes] = useState<Hospedagem[]>([]);
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Selection
  const [selectedMotivos, setSelectedMotivos] = useState<string[]>([]);
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);

  // Column Customizer Modal
  const [colModalOpen, setColModalOpen] = useState(false);
  const [tempVisCols, setTempVisCols] = useState<string[]>([]);
  
  // Edit Mode Panel
  const [editMode, setEditMode] = useState(false);
  const [editItem, setEditItem] = useState<Partial<Hospedagem> | null>(null);
  const [activeTab, setActiveTab] = useState<'pessoais' | 'estadia' | 'recibo'>('pessoais');

  // Inline Quick Change States
  const [inlineLoadingId, setInlineLoadingId] = useState<string | null>(null);

  // Load Metadata and initial search
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [
          { data: motivos },
          { data: modulos },
          { data: status },
          { data: quartos },
          { data: lavanderia },
          { data: configHosp }
        ] = await Promise.all([
          supabase.from('mainhospedagem').select('idmainhospedagem, main_motivo').eq('main_status', 'Ativo'),
          supabase.from('modulos').select('idmodulos, mod_nome').eq('mod_status', 'Ativo'),
          supabase.from('statushospedagem').select('idstatushospedagem, sta_nome').eq('sta_status', 'Ativo'),
          supabase.from('hos_quartos').select('idhos_quartos, hos_qua_nome').eq('hos_qua_status', 'Ativo'),
          supabase.from('lavanderia').select('idlavanderia, lav_servico'),
          supabase.from('confighospedagens').select('*').eq('idconfighospedagens', 1).maybeSingle()
        ]);

        let colunasVisiveis: string[] = [];
        let colunasInvisiveis: string[] = [];
        if (configHosp) {
          try {
            colunasVisiveis = typeof configHosp.chos_visiveis === 'string' 
              ? JSON.parse(configHosp.chos_visiveis) 
              : configHosp.chos_visiveis || [];
            colunasInvisiveis = typeof configHosp.chos_invisiveis === 'string' 
              ? JSON.parse(configHosp.chos_invisiveis) 
              : configHosp.chos_invisiveis || [];
          } catch (e) {
            colunasVisiveis = [];
            colunasInvisiveis = [];
          }
        }

        const metaData: MetaData = {
          motivos: (motivos || []).map(m => ({ idmainhospedagem: String(m.idmainhospedagem), main_motivo: m.main_motivo })),
          modulos: (modulos || []).map(m => ({ idmodulos: String(m.idmodulos), mod_nome: m.mod_nome })),
          status: (status || []).map(s => ({ idstatushospedagem: String(s.idstatushospedagem), sta_nome: s.sta_nome })),
          quartos: (quartos || []).map(q => ({ idhos_quartos: String(q.idhos_quartos), hos_qua_nome: q.hos_qua_nome })),
          lavanderias: (lavanderia || []).map(l => ({ idlavanderia: String(l.idlavanderia), lav_servico: l.lav_servico })),
          colunasVisiveis,
          colunasInvisiveis
        };

        setMeta(metaData);
        setTempVisCols(colunasVisiveis);
        
        // Pre-select first motive to display something
        if (motivos && motivos.length > 0) {
          setSelectedMotivos([String(motivos[0].idmainhospedagem)]);
        }
      } catch (err) {
        console.error("Erro ao carregar metadados:", err);
      }
    };
    
    loadMetadata();
  }, []);

  // Fetch list based on filters
  const handleBuscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedMotivos.length === 0 && selectedModulos.length === 0) {
        setInscricoes([]);
        return;
      }

      let query = supabase.from('hospedagens').select('*');

      if (selectedMotivos.length > 0) {
        query = query.in('hos_estadiamotivo', selectedMotivos.map(String));
      }
      if (selectedModulos.length > 0) {
        query = query.in('hos_modulo', selectedModulos.map(String));
      }

      const { data, error } = await query.order('hos_inscricao', { ascending: false });
      
      if (!error && data) {
        setInscricoes((data || []).map(item => ({
          ...item,
          idhospedagens: String(item.idhospedagens),
          hos_status: item.hos_status ? String(item.hos_status) : '',
          hos_quarto: item.hos_quarto ? String(item.hos_quarto) : '',
        })) as Hospedagem[]);
      } else if (error) {
        console.error("Erro ao listar inscrições:", error.message);
      }
    } catch (err) {
      console.error("Erro ao listar inscrições:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run automatically when selectedMotivos resolves from metadata load
  useEffect(() => {
    if (selectedMotivos.length > 0 && meta) {
      handleBuscar();
    } else {
      setLoading(false);
    }
  }, [meta, selectedMotivos]);

  // Handle deletion
  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esse cadastro de hospedagem?")) return;
    
    try {
      const { error } = await supabase
        .from('hospedagens')
        .delete()
        .eq('idhospedagens', id);
        
      if (!error) {
        setInscricoes(prev => prev.filter(item => item.idhospedagens !== id));
      } else {
        alert("Erro ao excluir hospedagem: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle column visibility save
  const handleSaveColumns = async () => {
    if (!meta) return;
    const invisiveis = allPossibleColumns.filter(c => !tempVisCols.includes(c));
    
    try {
      const { error } = await supabase
        .from('confighospedagens')
        .update({
          chos_visiveis: JSON.stringify(tempVisCols),
          chos_invisiveis: JSON.stringify(invisiveis)
        })
        .eq('idconfighospedagens', 1);

      if (!error) {
        setMeta({
          ...meta,
          colunasVisiveis: tempVisCols,
          colunasInvisiveis: invisiveis
        });
        setColModalOpen(false);
      } else {
        alert("Erro ao salvar colunas: " + error.message);
      }
    } catch (err) {
      console.error("Erro ao salvar colunas:", err);
    }
  };

  // Inline Quick Actions
  const handleStatusChange = async (id: string, newStatus: string) => {
    setInlineLoadingId(id + '_status');
    const dbStatus = newStatus === '0' || !newStatus ? null : parseInt(newStatus);
    try {
      const { error } = await supabase
        .from('hospedagens')
        .update({ hos_status: dbStatus })
        .eq('idhospedagens', id);

      if (!error) {
        setInscricoes(prev => prev.map(item => item.idhospedagens === id ? { ...item, hos_status: newStatus } : item));
      } else {
        alert("Erro ao salvar status: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInlineLoadingId(null);
    }
  };

  const handleQuartoChange = async (id: string, newQuarto: string) => {
    setInlineLoadingId(id + '_quarto');
    const dbQuarto = newQuarto === '0' || !newQuarto ? null : parseInt(newQuarto);
    try {
      const { error } = await supabase
        .from('hospedagens')
        .update({ hos_quarto: dbQuarto })
        .eq('idhospedagens', id);

      if (!error) {
        setInscricoes(prev => prev.map(item => item.idhospedagens === id ? { ...item, hos_quarto: newQuarto } : item));
      } else {
        alert("Erro ao salvar quarto: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInlineLoadingId(null);
    }
  };

  const handleCheckinToggle = async (id: string, current: string) => {
    setInlineLoadingId(id + '_checkin');
    const newDateTime = current ? null : new Date().toISOString();
    try {
      const { error } = await supabase
        .from('hospedagens')
        .update({ hos_checkin: newDateTime })
        .eq('idhospedagens', id);

      if (!error) {
        setInscricoes(prev => prev.map(item => item.idhospedagens === id ? { ...item, hos_checkin: newDateTime || '' } : item));
      } else {
        alert("Erro ao registrar check-in: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInlineLoadingId(null);
    }
  };

  const handleCheckoutToggle = async (id: string, current: string) => {
    setInlineLoadingId(id + '_checkout');
    const newDateTime = current ? null : new Date().toISOString();
    try {
      const { error } = await supabase
        .from('hospedagens')
        .update({ hos_checkout: newDateTime })
        .eq('idhospedagens', id);

      if (!error) {
        setInscricoes(prev => prev.map(item => item.idhospedagens === id ? { ...item, hos_checkout: newDateTime || '' } : item));
      } else {
        alert("Erro ao registrar check-out: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInlineLoadingId(null);
    }
  };

  // Edit / Form Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setSubmitting(true);
    
    const payload: any = { ...editItem };
    delete payload.idhospedagens; // Remover ID para o payload do update/insert

    // Tratar foreign keys nulas
    payload.hos_status = payload.hos_status === '0' || !payload.hos_status ? null : parseInt(payload.hos_status);
    payload.hos_quarto = payload.hos_quarto === '0' || !payload.hos_quarto ? null : parseInt(payload.hos_quarto);

    try {
      let error;
      if (editItem.idhospedagens) {
        const { error: updateError } = await supabase
          .from('hospedagens')
          .update(payload)
          .eq('idhospedagens', editItem.idhospedagens);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hospedagens')
          .insert([payload]);
        error = insertError;
      }

      if (!error) {
        setEditMode(false);
        setEditItem(null);
        handleBuscar(); // Recarregar
      } else {
        alert("Erro ao salvar dados de hospedagem: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerEmailReceipt = async (id: string) => {
    if (!window.confirm("Deseja enviar o recibo por e-mail para o inscrito (via Supabase Edge Function)?")) return;
    try {
      const { error } = await supabase.functions.invoke('send-receipt', {
        body: { id }
      });
      
      if (error) throw error;
      
      alert("E-mail com recibo enviado com sucesso!");
    } catch (err: any) {
      console.error(err);
      alert("Falha ao enviar e-mail: " + (err.message || err));
    }
  };

  // Filter local search query
  const filteredInscricoes = inscricoes.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.hos_nome?.toLowerCase().includes(query) ||
      item.hos_cpfrg?.toLowerCase().includes(query) ||
      item.hos_email?.toLowerCase().includes(query) ||
      item.hos_cidade?.toLowerCase().includes(query) ||
      item.idhospedagens?.toString().includes(query)
    );
  });

  const allPossibleColumns = [
    "Número de inscrição", "Categoria", "Nome", "CPF/RG", "Nascimento", "E-mail", 
    "Celular/Whatsapp", "Telefone 2 (Urgência)", "Endereço", "Número", "CEP", 
    "Bairro", "Cidade", "Estado", "É alérgico?", "Especifique (alergia)", 
    "Alguma restrição alimentar?", "Especifique (restrição alimentar)", 
    "Você precisará de serviços de lavanderia?", "Motivo da hospedagem (curso)", 
    "Módulo", "Previsão de chegada", "Previsão de saída", "Recibo?", 
    "Nome (Recibo)", "CPF/CNPJ (Recibo)", "Endereço (Recibo)", "Número (Recibo)", 
    "CEP (Recibo)", "Bairro (Recibo)", "Cidade (Recibo)", "Estado (Recibo)", 
    "Termos", "Status", "Check-in", "Check-out", "Quarto", "Inscrição", "Ações"
  ];

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#082842] dark:text-slate-100">
            {editMode ? 'Ficha de Hospedagem' : 'Gerenciamento de Inscrições'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {editMode ? 'Preencha ou altere os dados do inscrito.' : 'Consulte, edite ou altere o status dos hóspedes cadastrados.'}
          </p>
        </div>

        {!editMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setColModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0b1c2e] hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-bold shadow-premium transition-all cursor-pointer hover-lift"
            >
              <Filter className="w-4 h-4" />
              <span>Colunas Visíveis</span>
            </button>
            <button
              onClick={() => {
                setEditItem({
                  hos_categoria: 'Leigo(a)',
                  hos_alergico: 'Não',
                  hos_restricaoalimentar: 'Não',
                  hos_recibo: 'Emitir o recibo no meu próprio nome.',
                  hos_termo: 'Aceito'
                });
                setEditMode(true);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/95 text-white text-xs font-bold shadow-premium shadow-secondary/20 transition-all cursor-pointer hover-lift"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Inscrição</span>
            </button>
          </div>
        )}
      </div>

      {/* EDIT MODE PANEL */}
      {editMode && editItem && (
        <div className="bg-white dark:bg-[#0b1c2e] border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-premium overflow-hidden transition-all animate-fade-in">
          {/* Top Panel Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditItem(null);
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono uppercase tracking-wider">
                {editItem.idhospedagens ? `Editar Inscrição #${editItem.idhospedagens}` : 'Novo Cadastro'}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditItem(null);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 bg-secondary hover:bg-secondary/95 text-white rounded-xl text-xs font-semibold shadow-premium shadow-secondary/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Ficha</span>
              </button>
            </div>
          </div>

          {/* Form Tabs Menu */}
          <div className="flex border-b border-slate-100 dark:border-slate-800/50 px-6">
            {(['pessoais', 'estadia', 'recibo'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 px-4 text-xs font-semibold relative transition-all border-b-2
                  ${activeTab === tab 
                    ? 'border-secondary text-secondary font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {tab === 'pessoais' && 'Dados Pessoais'}
                {tab === 'estadia' && 'Estadia e Lavanderia'}
                {tab === 'recibo' && 'Recibo e Termos'}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveEdit} className="p-6">
            {activeTab === 'pessoais' && (
              <div className="space-y-6">
                {/* Categoria Checkboxes/Radios */}
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide block mb-3">
                    Categoria Eclesial
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['Padre', 'Diácono', 'Religioso(a)', 'Seminarista', 'Leigo(a)'].map(cat => (
                      <label key={cat} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name="hos_categoria"
                          value={cat}
                          checked={editItem.hos_categoria === cat}
                          onChange={(e) => setEditItem({ ...editItem, hos_categoria: e.target.value })}
                          className="w-4 h-4 text-secondary border-slate-300 focus:ring-secondary/25"
                        />
                        <span>{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_nome || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_nome: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Nascimento</label>
                    <input
                      type="date"
                      required
                      value={editItem.hos_nascimento || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_nascimento: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">CPF / RG</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_cpfrg || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_cpfrg: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">E-mail</label>
                    <input
                      type="email"
                      required
                      value={editItem.hos_email || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Telefone Celular</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_telefone || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_telefone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Telefone 2 (Urgência)</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_telefoneemergencia || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_telefoneemergencia: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">Rua / Logradouro</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_logradouro || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_logradouro: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Número</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_numero || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_numero: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">CEP</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_cep || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_cep: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Bairro</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_bairro || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_bairro: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Cidade</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_cidade || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_cidade: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Estado</label>
                    <input
                      type="text"
                      required
                      value={editItem.hos_estado || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_estado: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'estadia' && (
              <div className="space-y-6">
                {/* Saúde e Restrições */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">É Alérgico?</label>
                      <select
                        value={editItem.hos_alergico || 'Não'}
                        onChange={(e) => setEditItem({ ...editItem, hos_alergico: e.target.value })}
                        className="text-xs py-1 px-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg outline-none"
                      >
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                    {editItem.hos_alergico === 'Sim' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500">Especifique a Alergia</label>
                        <input
                          type="text"
                          required
                          value={editItem.hos_especifiquealergia || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_especifiquealergia: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:border-secondary outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Restrição Alimentar?</label>
                      <select
                        value={editItem.hos_restricaoalimentar || 'Não'}
                        onChange={(e) => setEditItem({ ...editItem, hos_restricaoalimentar: e.target.value })}
                        className="text-xs py-1 px-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg outline-none"
                      >
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                    {editItem.hos_restricaoalimentar === 'Sim' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500">Especifique a Restrição</label>
                        <input
                          type="text"
                          required
                          value={editItem.hos_especifiquerestricao || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_especifiquerestricao: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 focus:border-secondary outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Lavanderia */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Precisa de Serviços de Lavanderia?</label>
                  <select
                    value={editItem.hos_lavanderia || ''}
                    onChange={(e) => setEditItem({ ...editItem, hos_lavanderia: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none"
                  >
                    <option value="">Selecione...</option>
                    {meta?.lavanderias.map(l => (
                      <option key={l.idlavanderia} value={l.lav_servico}>{l.lav_servico}</option>
                    ))}
                  </select>
                </div>

                {/* Motivo e Módulo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Curso / Estadia (Motivo)</label>
                    <select
                      required
                      value={editItem.hos_estadiamotivo || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_estadiamotivo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none"
                    >
                      <option value="">Selecione...</option>
                      {meta?.motivos.map(m => (
                        <option key={m.idmainhospedagem} value={m.idmainhospedagem}>{m.main_motivo}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Módulo</label>
                    <select
                      required
                      value={editItem.hos_modulo || ''}
                      onChange={(e) => setEditItem({ ...editItem, hos_modulo: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none"
                    >
                      <option value="">Selecione...</option>
                      {meta?.modulos.map(m => (
                        <option key={m.idmodulos} value={m.idmodulos}>{m.mod_nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Previsões chegada e saída */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Chegada */}
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-4">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 border-b pb-2">Previsão de Chegada</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500">Data</label>
                        <input
                          type="date"
                          required
                          value={editItem.hos_previsaochegada?.split('T')[0] || ''}
                          onChange={(e) => {
                            const time = editItem.hos_previsaochegada?.split('T')[1] || '12:00:00';
                            setEditItem({ ...editItem, hos_previsaochegada: `${e.target.value}T${time}` });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500">Hora</label>
                        <input
                          type="time"
                          required
                          value={editItem.hos_previsaochegada?.split('T')[1]?.slice(0,5) || '12:00'}
                          onChange={(e) => {
                            const date = editItem.hos_previsaochegada?.split('T')[0] || new Date().toISOString().split('T')[0];
                            setEditItem({ ...editItem, hos_previsaochegada: `${date}T${e.target.value}:00` });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Saída */}
                  <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 space-y-4">
                    <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 border-b pb-2">Previsão de Saída</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500">Data</label>
                        <input
                          type="date"
                          required
                          value={editItem.hos_previsaosaida?.split('T')[0] || ''}
                          onChange={(e) => {
                            const time = editItem.hos_previsaosaida?.split('T')[1] || '12:00:00';
                            setEditItem({ ...editItem, hos_previsaosaida: `${e.target.value}T${time}` });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500">Hora</label>
                        <input
                          type="time"
                          required
                          value={editItem.hos_previsaosaida?.split('T')[1]?.slice(0,5) || '12:00'}
                          onChange={(e) => {
                            const date = editItem.hos_previsaosaida?.split('T')[0] || new Date().toISOString().split('T')[0];
                            setEditItem({ ...editItem, hos_previsaosaida: `${date}T${e.target.value}:00` });
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recibo' && (
              <div className="space-y-6">
                {/* Tipo de Emissão de Recibo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Emissão do Recibo</label>
                  <select
                    value={editItem.hos_recibo || ''}
                    onChange={(e) => setEditItem({ ...editItem, hos_recibo: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 focus:border-secondary outline-none"
                  >
                    <option value="Emitir o recibo no meu próprio nome.">Emitir o recibo no meu próprio nome.</option>
                    <option value="Emitir o recibo no nome de terceiro.">Emitir o recibo no nome de terceiro.</option>
                  </select>
                </div>

                {editItem.hos_recibo === 'Emitir o recibo no nome de terceiro.' && (
                  <div className="space-y-5 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl bg-slate-50/20 dark:bg-slate-900/10">
                    <h4 className="text-xs font-bold text-primary dark:text-secondary uppercase tracking-wider font-mono">Dados do Terceiro</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Nome / Razão Social</label>
                        <input
                          type="text"
                          required
                          value={editItem.hos_recnome || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_recnome: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">CPF / CNPJ</label>
                        <input
                          type="text"
                          required
                          value={editItem.hos_reccpfcnpj || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_reccpfcnpj: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    {/* Endereço Recibo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-500">Endereço</label>
                        <input
                          type="text"
                          value={editItem.hos_reclogradouro || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_reclogradouro: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Número</label>
                        <input
                          type="text"
                          value={editItem.hos_recnumero || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_recnumero: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">CEP</label>
                        <input
                          type="text"
                          value={editItem.hos_reccep || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_reccep: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Bairro</label>
                        <input
                          type="text"
                          value={editItem.hos_recbairro || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_recbairro: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Cidade</label>
                        <input
                          type="text"
                          value={editItem.hos_reccidade || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_reccidade: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500">Estado</label>
                        <input
                          type="text"
                          value={editItem.hos_recestado || ''}
                          onChange={(e) => setEditItem({ ...editItem, hos_recestado: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Termos checkbox */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                  <input
                    type="checkbox"
                    id="termos_checkbox"
                    checked={editItem.hos_termo === 'Aceito'}
                    onChange={(e) => setEditItem({ ...editItem, hos_termo: e.target.checked ? 'Aceito' : 'Recusado' })}
                    className="w-5 h-5 text-secondary border-slate-300 focus:ring-secondary/25 rounded-md"
                  />
                  <label htmlFor="termos_checkbox" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    O inscrito declara aceitar todos os termos e condições de hospedagem descritos nos regulamentos do Sistema BRM.
                  </label>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* SEARCH AND FILTERS */}
      {!editMode && (
        <div className="glass shadow-premium rounded-2xl p-6 space-y-4 animate-fade-in bg-white/90">
          <form onSubmit={handleBuscar} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Motivo select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#082842] dark:text-slate-400">Motivo (Curso / Estadia)</label>
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 h-28 overflow-y-auto space-y-1 bg-white/50 dark:bg-slate-900/40 scrollbar-thin">
                {meta?.motivos.map(m => {
                  const isChecked = selectedMotivos.includes(m.idmainhospedagem);
                  return (
                    <label key={m.idmainhospedagem} className="flex items-center gap-2.5 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg text-xs font-semibold cursor-pointer select-none text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMotivos([...selectedMotivos, m.idmainhospedagem]);
                          } else {
                            setSelectedMotivos(selectedMotivos.filter(id => id !== m.idmainhospedagem));
                          }
                        }}
                        className="w-4 h-4 text-secondary border-slate-300 focus:ring-secondary/20 rounded cursor-pointer"
                      />
                      <span className="truncate">{m.main_motivo}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modulo select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#082842] dark:text-slate-400">Módulo</label>
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 h-28 overflow-y-auto space-y-1 bg-white/50 dark:bg-slate-900/40 scrollbar-thin">
                {meta?.modulos.map(m => {
                  const isChecked = selectedModulos.includes(m.idmodulos);
                  return (
                    <label key={m.idmodulos} className="flex items-center gap-2.5 px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg text-xs font-semibold cursor-pointer select-none text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedModulos([...selectedModulos, m.idmodulos]);
                          } else {
                            setSelectedModulos(selectedModulos.filter(id => id !== m.idmodulos));
                          }
                        }}
                        className="w-4 h-4 text-secondary border-slate-300 focus:ring-secondary/20 rounded cursor-pointer"
                      />
                      <span className="truncate">{m.mod_nome}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Buscar button & Search input */}
            <div className="space-y-4">
              <button
                type="submit"
                className="w-full py-2.5 bg-secondary hover:bg-secondary/95 text-white font-bold text-xs rounded-xl shadow-md shadow-secondary/15 transition-all cursor-pointer hover-lift"
              >
                Pesquisar no Banco
              </button>
              
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Pesquisa rápida (nome, cidade, cpf...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                />
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DATA TABLE */}
      {!editMode && (
        <div className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-secondary" />
                <span className="text-xs font-semibold text-slate-400">Pesquisando hóspedes...</span>
              </div>
            </div>
          ) : filteredInscricoes.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <ClipboardList className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold">Nenhuma inscrição encontrada</p>
              <p className="text-xs text-slate-400 mt-1">Experimente alterar os filtros ou pesquisar no banco.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 font-semibold tracking-wider font-mono">
                    {meta?.colunasVisiveis.map(col => (
                      <th key={col} className="p-4 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40 text-slate-700 dark:text-slate-300">
                  {filteredInscricoes.map(item => (
                    <tr key={item.idhospedagens} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      {meta?.colunasVisiveis.map(col => {
                        const loadingInline = inlineLoadingId === (item.idhospedagens + '_status') || inlineLoadingId === (item.idhospedagens + '_quarto');
                        
                        switch(col) {
                          case "Número de inscrição":
                            return <td key={col} className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">#{item.idhospedagens}</td>;
                          case "Nome":
                            return <td key={col} className="p-4 font-sans font-semibold text-slate-800 dark:text-slate-100">{item.hos_nome}</td>;
                          case "Categoria":
                            return <td key={col} className="p-4 font-sans font-medium text-slate-500">{item.hos_categoria}</td>;
                          case "Cidade":
                            return <td key={col} className="p-4 font-sans text-slate-500">{item.hos_cidade} - {item.hos_estado}</td>;
                          case "Celular/Whatsapp":
                            return <td key={col} className="p-4 font-mono text-slate-500">{item.hos_telefone}</td>;
                          case "E-mail":
                            return <td key={col} className="p-4 text-slate-500">{item.hos_email}</td>;
                          case "Status":
                            return (
                              <td key={col} className="p-4">
                                <select
                                  disabled={loadingInline}
                                  value={item.hos_status || '0'}
                                  onChange={(e) => handleStatusChange(item.idhospedagens, e.target.value)}
                                  className="text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg outline-none cursor-pointer"
                                >
                                  <option value="0">Pendente</option>
                                  {meta?.status.map(s => (
                                    <option key={s.idstatushospedagem} value={s.idstatushospedagem}>{s.sta_nome}</option>
                                  ))}
                                </select>
                              </td>
                            );
                          case "Quarto":
                            return (
                              <td key={col} className="p-4">
                                <select
                                  disabled={loadingInline}
                                  value={item.hos_quarto || '0'}
                                  onChange={(e) => handleQuartoChange(item.idhospedagens, e.target.value)}
                                  className="text-[11px] py-1 px-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg outline-none cursor-pointer"
                                >
                                  <option value="0">Não Atribuído</option>
                                  {meta?.quartos.map(q => (
                                    <option key={q.idhos_quartos} value={q.idhos_quartos}>{q.hos_qua_nome}</option>
                                  ))}
                                </select>
                              </td>
                            );
                          case "Check-in":
                            return (
                              <td key={col} className="p-4 font-mono text-[11px] whitespace-nowrap">
                                <button
                                  onClick={() => handleCheckinToggle(item.idhospedagens, item.hos_checkin)}
                                  className={`px-2 py-1 rounded font-semibold text-[10px] cursor-pointer hover-lift
                                    ${item.hos_checkin 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {item.hos_checkin 
                                    ? new Date(item.hos_checkin).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) 
                                    : 'Realizar Check-in'}
                                </button>
                              </td>
                            );
                          case "Check-out":
                            return (
                              <td key={col} className="p-4 font-mono text-[11px] whitespace-nowrap">
                                <button
                                  onClick={() => handleCheckoutToggle(item.idhospedagens, item.hos_checkout)}
                                  disabled={!item.hos_checkin}
                                  className={`px-2 py-1 rounded font-semibold text-[10px] cursor-pointer disabled:opacity-40 hover-lift
                                    ${item.hos_checkout 
                                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20' 
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                                >
                                  {item.hos_checkout 
                                    ? new Date(item.hos_checkout).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) 
                                    : 'Realizar Check-out'}
                                </button>
                              </td>
                            );
                          case "Ações":
                            return (
                              <td key={col} className="p-4">
                                <div className="flex items-center gap-1.5 whitespace-nowrap">
                                  {/* PDF actions */}
                                  <a
                                    href={`/recibo-pdf.php?id=${item.idhospedagens}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Imprimir Recibo"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </a>
                                  <button
                                    onClick={() => triggerEmailReceipt(item.idhospedagens)}
                                    title="Enviar Recibo por E-mail"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {/* Core edit/delete */}
                                  <button
                                    onClick={() => {
                                      setEditItem(item);
                                      setEditMode(true);
                                    }}
                                    title="Editar Dados"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors font-semibold"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item.idhospedagens)}
                                    title="Excluir Inscrição"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            );
                          default:
                            const fieldName = {
                              "CPF/RG": "hos_cpfrg",
                              "Nascimento": "hos_nascimento",
                              "Endereço": "hos_logradouro",
                              "Número": "hos_numero",
                              "CEP": "hos_cep",
                              "Bairro": "hos_bairro",
                              "Estado": "hos_estado",
                              "É alérgico?": "hos_alergico",
                              "Especifique (alergia)": "hos_especifiquealergia",
                              "Alguma restrição alimentar?": "hos_restricaoalimentar",
                              "Especifique (restrição alimentar)": "hos_especifiquerestricao",
                              "Você precisará de serviços de lavanderia?": "hos_lavanderia",
                              "Motivo da hospedagem (curso)": "hos_estadiamotivo",
                              "Módulo": "hos_modulo",
                              "Previsão de chegada": "hos_previsaochegada",
                              "Previsão de saída": "hos_previsaosaida",
                              "Recibo?": "hos_recibo",
                              "Nome (Recibo)": "hos_recnome",
                              "CPF/CNPJ (Recibo)": "hos_reccpfcnpj",
                              "Termos": "hos_termo",
                              "Inscrição": "hos_inscricao",
                              "Telefone 2 (Urgência)": "hos_telefoneemergencia",
                              "Endereço (Recibo)": "hos_reclogradouro",
                              "Número (Recibo)": "hos_recnumero",
                              "CEP (Recibo)": "hos_reccep",
                              "Bairro (Recibo)": "hos_recbairro",
                              "Cidade (Recibo)": "hos_reccidade",
                              "Estado (Recibo)": "hos_recestado"
                            }[col];
                            
                            const val = fieldName ? (item as any)[fieldName] : '';
                            
                            // Format value nicely based on column type
                            let displayVal = val;
                            if (val) {
                              if (col === 'Nascimento') {
                                try {
                                  const d = new Date(val + 'T12:00:00'); // avoid timezone shifts
                                  displayVal = d.toLocaleDateString('pt-BR');
                                } catch (e) {}
                              } else if (['Inscrição', 'Previsão de chegada', 'Previsão de saída'].includes(col)) {
                                try {
                                  const d = new Date(val);
                                  displayVal = d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
                                } catch (e) {}
                              }
                            } else {
                              displayVal = '-';
                            }

                            return (
                              <td key={col} className="p-4 text-slate-500 font-sans max-w-[220px] truncate whitespace-nowrap">
                                {displayVal}
                              </td>
                            );
                        }
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* COLUMN CUSTOMIZER MODAL */}
      {colModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setColModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0b1c2e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-premium p-6 z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Personalizar Colunas Visíveis</h3>
              <button onClick={() => setColModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400 mb-4">
              Marque as colunas que deseja exibir na tabela de hóspedes. Desmarque as que deseja ocultar para uma visão mais focada.
            </p>
            
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {allPossibleColumns.map(col => {
                const isChecked = tempVisCols.includes(col);
                return (
                  <label
                    key={col}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer select-none transition-all
                      ${isChecked 
                        ? 'border-secondary bg-secondary/5 text-secondary dark:border-secondary/40' 
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempVisCols([...tempVisCols, col]);
                        } else {
                          // Don't allow removing Name or Actions completely to prevent unusable table
                          if (col === 'Nome' || col === 'Ações') return;
                          setTempVisCols(tempVisCols.filter(c => c !== col));
                        }
                      }}
                      className="w-4 h-4 text-secondary focus:ring-secondary/25 rounded border-slate-300"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                );
              })}
            </div>
            
            <div className="flex justify-end gap-2 border-t pt-4 mt-6">
              <button
                onClick={() => setColModalOpen(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveColumns}
                className="px-4 py-2 bg-secondary hover:bg-secondary/95 text-white text-xs font-semibold rounded-xl shadow-premium shadow-secondary/15 transition-colors cursor-pointer"
              >
                Salvar Colunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HospedagensInscricoes;
