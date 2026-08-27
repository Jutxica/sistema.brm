import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Save, Plus, Trash2, Edit, Copy, Loader2, 
  Settings2, BookOpen, Layers, Hotel, HelpCircle, ShieldAlert, Waves
} from 'lucide-react';

interface ConfigGeral {
  chos_acolhida: string;
  chos_ativar: 'Sim' | 'Não';
  chos_txtinativo: string;
}

interface Estadia {
  idmainhospedagem: string;
  main_motivo: string;
  main_host: string;
  main_seguranca: string;
  main_porta: string;
  main_remetente: string;
  main_email: string;
  main_senha?: string;
  main_mensagemtela: string;
  main_mensagememail: string;
  main_termos: string;
  main_recibo_pessoal: string;
  main_recibo_terceiros: string;
  main_recibo_mensagem: string;
  main_status: 'Ativo' | 'Inativo';
}

interface Modulo {
  idmodulos: string;
  mod_nome: string;
  mod_status: 'Ativo' | 'Inativo';
}

interface Quarto {
  idhos_quartos: string;
  hos_qua_nome: string;
  hos_qua_status: 'Ativo' | 'Inativo';
}

interface StatusItem {
  idstatushospedagem: string;
  sta_nome: string;
  sta_status: 'Ativo' | 'Inativo';
}

interface Lavanderia {
  idlavanderia: string;
  lav_servico: string;
}

// Reusable Textarea component with cursor placeholder injection
const TagTextarea: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}> = ({ label, value, onChange, rows = 4, placeholder, required = false }) => {
  const [showTags, setShowTags] = useState(false);
  const textareaId = React.useId();

  const tags = [
    { category: "Inscrição", items: [ { name: "Nº Inscrição", tag: "idhospedagens" } ] },
    { category: "Dados Pessoais", items: [
      { name: "Categoria", tag: "hos_categoria" },
      { name: "Nome", tag: "hos_nome" },
      { name: "Nascimento", tag: "hos_nascimento" },
      { name: "CPF/RG", tag: "hos_cpfrg" },
      { name: "E-mail", tag: "hos_email" },
      { name: "Telefone", tag: "hos_telefone" },
      { name: "Tel. Emergência", tag: "hos_telefoneemergencia" }
    ] },
    { category: "Endereço", items: [
      { name: "Logradouro", tag: "hos_logradouro" },
      { name: "Número", tag: "hos_numero" },
      { name: "CEP", tag: "hos_cep" },
      { name: "Bairro", tag: "hos_bairro" },
      { name: "Cidade", tag: "hos_cidade" },
      { name: "Estado", tag: "hos_estado" }
    ] },
    { category: "Saúde e Restrições", items: [
      { name: "Alérgico", tag: "hos_alergico" },
      { name: "Especificar Alergia", tag: "hos_especifiquealergia" },
      { name: "Restrição Alim.", tag: "hos_restricaoalimentar" },
      { name: "Especificar Restrição", tag: "hos_especifiquerestricao" }
    ] },
    { category: "Estadia", items: [
      { name: "Lavanderia", tag: "hos_lavanderia" },
      { name: "Motivo (Curso)", tag: "hos_estadiamotivo" },
      { name: "Módulo", tag: "hos_modulo" },
      { name: "Prev. Chegada", tag: "hos_previsaochegada" },
      { name: "Prev. Saída", tag: "hos_previsaosaida" },
      { name: "Quarto", tag: "hos_quarto" }
    ] },
    { category: "Recibo", items: [
      { name: "Recibo (S/N)", tag: "hos_recibo" },
      { name: "Nome (Recibo)", tag: "hos_recnome" },
      { name: "CPF/CNPJ (Recibo)", tag: "hos_reccpfcnpj" },
      { name: "Endereço (Recibo)", tag: "hos_reclogradouro" },
      { name: "Número (Recibo)", tag: "hos_recnumero" },
      { name: "CEP (Recibo)", tag: "hos_reccep" },
      { name: "Bairro (Recibo)", tag: "hos_recbairro" },
      { name: "Cidade (Recibo)", tag: "hos_reccidade" },
      { name: "Estado (Recibo)", tag: "hos_recestado" }
    ] },
    { category: "Contrato e Status", items: [
      { name: "Termos (Aceito)", tag: "hos_termo" },
      { name: "Data Inscrição", tag: "hos_inscricao" },
      { name: "Status", tag: "hos_status" },
      { name: "Check-in", tag: "hos_checkin" },
      { name: "Check-out", tag: "hos_checkout" }
    ] },
    { category: "Datas Atuais", items: [
      { name: "Dia", tag: "dia" },
      { name: "Mês (Escrito)", tag: "mesescrito" },
      { name: "Mês (Número)", tag: "mes" },
      { name: "Ano", tag: "ano" }
    ] }
  ];

  const handleInsertTag = (tag: string) => {
    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const tagFormatted = `[[${tag}]]`;
    const newValue = text.substring(0, start) + tagFormatted + text.substring(end);
    onChange(newValue);
    
    // Restore focus and selection range
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagFormatted.length, start + tagFormatted.length);
    }, 10);
    setShowTags(false);
  };

  return (
    <div className="space-y-1.5 relative">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-slate-500">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1.5 px-3 py-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm cursor-pointer select-none"
          >
            <span>Campos Dinâmicos</span>
            <span className="text-[8px] opacity-60">▼</span>
          </button>
          
          {showTags && (
            <div className="absolute right-0 mt-1 w-80 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 p-3.5 space-y-3 scrollbar-thin">
              {tags.map(cat => (
                <div key={cat.category} className="space-y-1">
                  <span className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800/60 pb-0.5">{cat.category}</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.items.map(item => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => handleInsertTag(item.tag)}
                        className="px-2 py-0.5 border border-slate-100 dark:border-slate-800 bg-slate-50 hover:bg-secondary/10 hover:text-secondary hover:border-secondary/20 dark:bg-slate-800 rounded text-[10px] transition-colors cursor-pointer"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <textarea
        id={textareaId}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all"
      />
    </div>
  );
};

export const HospedagensConfiguracoes: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'lavanderia' | 'estadias' | 'modulos' | 'quartos' | 'status'>('geral');

  // Page States
  const [configGeral, setConfigGeral] = useState<ConfigGeral>({ chos_acolhida: '', chos_ativar: 'Sim', chos_txtinativo: '' });
  const [estadias, setEstadias] = useState<Estadia[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [quartos, setQuartos] = useState<Quarto[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [lavanderias, setLavanderias] = useState<Lavanderia[]>([]);

  // Modal / Form States
  const [editingEstadia, setEditingEstadia] = useState<Partial<Estadia> | null>(null);
  const [courseSubTab, setCourseSubTab] = useState<'smtp' | 'mensagens' | 'termos' | 'recibo'>('smtp');
  const [newModulo, setNewModulo] = useState({ idmodulos: '', mod_nome: '', mod_status: 'Ativo' });
  const [newQuarto, setNewQuarto] = useState({ idhos_quartos: '', hos_qua_nome: '', hos_qua_status: 'Ativo' });
  const [newStatus, setNewStatus] = useState({ idstatushospedagem: '', sta_nome: '', sta_status: 'Ativo' });
  const [newLavanderia, setNewLavanderia] = useState({ idlavanderia: '', lav_servico: '' });

  // Load Data
  const loadConfigData = async () => {
    setLoading(true);
    try {
      const [
        { data: geral },
        { data: estadiasData },
        { data: modulosData },
        { data: quartosData },
        { data: statusesData },
        { data: lavanderiaData }
      ] = await Promise.all([
        supabase.from('confighospedagens').select('*').eq('idconfighospedagens', 1).maybeSingle(),
        supabase.from('mainhospedagem').select('*').order('idmainhospedagem', { ascending: false }),
        supabase.from('modulos').select('*').order('idmodulos', { ascending: false }),
        supabase.from('hos_quartos').select('*').order('idhos_quartos', { ascending: false }),
        supabase.from('statushospedagem').select('*').order('idstatushospedagem', { ascending: false }),
        supabase.from('lavanderia').select('*').order('idlavanderia', { ascending: false })
      ]);

      if (geral) {
        setConfigGeral({
          chos_acolhida: geral.chos_acolhida || '',
          chos_ativar: (geral.chos_ativar === 'ativo' || geral.chos_ativar === 'Sim') ? 'Sim' : 'Não',
          chos_txtinativo: geral.chos_txtinativo || ''
        });
      }
      setEstadias((estadiasData || []).map(e => ({ ...e, idmainhospedagem: String(e.idmainhospedagem) })) as Estadia[]);
      setModulos((modulosData || []).map(m => ({ ...m, idmodulos: String(m.idmodulos) })) as Modulo[]);
      setQuartos((quartosData || []).map(q => ({ ...q, idhos_quartos: String(q.idhos_quartos) })) as Quarto[]);
      setStatuses((statusesData || []).map(s => ({ ...s, idstatushospedagem: String(s.idstatushospedagem) })) as StatusItem[]);
      setLavanderias((lavanderiaData || []).map(l => ({ ...l, idlavanderia: String(l.idlavanderia) })) as Lavanderia[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigData();
  }, []);

  // Save General Config
  const handleSaveGeral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from('confighospedagens')
        .upsert({
          idconfighospedagens: 1,
          chos_acolhida: configGeral.chos_acolhida,
          chos_ativar: configGeral.chos_ativar === 'Sim' ? 'ativo' : 'inativo',
          chos_txtinativo: configGeral.chos_txtinativo
        });

      if (!error) {
        alert("Configurações gerais salvas com sucesso!");
        loadConfigData();
      } else {
        alert("Erro ao salvar configurações: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Main Hospedagem (Estadias) CRUD
  const handleSaveEstadia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEstadia) return;
    setSaving(true);

    const payload = { ...editingEstadia };
    delete payload.idmainhospedagem; // Remover ID do insert/update

    try {
      let error;
      if (editingEstadia.idmainhospedagem) {
        const { error: updateError } = await supabase
          .from('mainhospedagem')
          .update(payload)
          .eq('idmainhospedagem', editingEstadia.idmainhospedagem);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('mainhospedagem')
          .insert([payload]);
        error = insertError;
      }

      if (!error) {
        setEditingEstadia(null);
        loadConfigData();
      } else {
        alert("Erro ao salvar estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateEstadia = async (id: string) => {
    if (!window.confirm("Deseja criar uma cópia deste curso/estadia?")) return;
    try {
      const source = estadias.find(e => e.idmainhospedagem === id);
      if (!source) return;

      const payload = {
        main_motivo: `${source.main_motivo} (Cópia)`,
        main_host: source.main_host || null,
        main_seguranca: source.main_seguranca || null,
        main_porta: source.main_porta || null,
        main_remetente: source.main_remetente || null,
        main_email: source.main_email || null,
        main_senha: source.main_senha || null,
        main_mensagemtela: source.main_mensagemtela || '',
        main_mensagememail: source.main_mensagememail || '',
        main_termos: source.main_termos || '',
        main_recibo_pessoal: source.main_recibo_pessoal || '',
        main_recibo_terceiros: source.main_recibo_terceiros || '',
        main_recibo_mensagem: source.main_recibo_mensagem || '',
        main_status: source.main_status
      };

      const { error } = await supabase
        .from('mainhospedagem')
        .insert([payload]);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao duplicar estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEstadia = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este curso/estadia?")) return;
    try {
      const { error } = await supabase
        .from('mainhospedagem')
        .delete()
        .eq('idmainhospedagem', id);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao excluir estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Modulos CRUD
  const handleSaveModulo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let error;
      if (newModulo.idmodulos) {
        const { error: updateError } = await supabase
          .from('modulos')
          .update({ mod_nome: newModulo.mod_nome })
          .eq('idmodulos', newModulo.idmodulos);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('modulos')
          .insert([{ mod_nome: newModulo.mod_nome, mod_status: 'Ativo' }]);
        error = insertError;
      }

      if (!error) {
        setNewModulo({ idmodulos: '', mod_nome: '', mod_status: 'Ativo' });
        loadConfigData();
      } else {
        alert("Erro ao criar módulo: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModulo = async (id: string) => {
    if (!window.confirm("Deseja excluir este módulo?")) return;
    try {
      const { error } = await supabase
        .from('modulos')
        .delete()
        .eq('idmodulos', id);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao excluir módulo: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Quartos CRUD
  const handleSaveQuarto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let error;
      if (newQuarto.idhos_quartos) {
        const { error: updateError } = await supabase
          .from('hos_quartos')
          .update({ hos_qua_nome: newQuarto.hos_qua_nome })
          .eq('idhos_quartos', newQuarto.idhos_quartos);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('hos_quartos')
          .insert([{ hos_qua_nome: newQuarto.hos_qua_nome, hos_qua_status: 'Ativo' }]);
        error = insertError;
      }

      if (!error) {
        setNewQuarto({ idhos_quartos: '', hos_qua_nome: '', hos_qua_status: 'Ativo' });
        loadConfigData();
      } else {
        alert("Erro ao criar quarto: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteQuarto = async (id: string) => {
    if (!window.confirm("Deseja excluir este quarto?")) return;
    try {
      const { error } = await supabase
        .from('hos_quartos')
        .delete()
        .eq('idhos_quartos', id);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao excluir quarto: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Status CRUD
  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let error;
      if (newStatus.idstatushospedagem) {
        const { error: updateError } = await supabase
          .from('statushospedagem')
          .update({ sta_nome: newStatus.sta_nome })
          .eq('idstatushospedagem', newStatus.idstatushospedagem);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('statushospedagem')
          .insert([{ sta_nome: newStatus.sta_nome, sta_status: 'Ativo' }]);
        error = insertError;
      }

      if (!error) {
        setNewStatus({ idstatushospedagem: '', sta_nome: '', sta_status: 'Ativo' });
        loadConfigData();
      } else {
        alert("Erro ao criar status: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!window.confirm("Deseja excluir este status?")) return;
    try {
      const { error } = await supabase
        .from('statushospedagem')
        .delete()
        .eq('idstatushospedagem', id);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao excluir status: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lavanderias CRUD
  const handleSaveLavanderia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let error;
      if (newLavanderia.idlavanderia) {
        const { error: updateError } = await supabase
          .from('lavanderia')
          .update({ lav_servico: newLavanderia.lav_servico })
          .eq('idlavanderia', newLavanderia.idlavanderia);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('lavanderia')
          .insert([{ lav_servico: newLavanderia.lav_servico }]);
        error = insertError;
      }

      if (!error) {
        setNewLavanderia({ idlavanderia: '', lav_servico: '' });
        loadConfigData();
      } else {
        alert("Erro ao criar lavanderia: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLavanderia = async (id: string) => {
    if (!window.confirm("Deseja excluir este serviço de lavanderia?")) return;
    try {
      const { error } = await supabase
        .from('lavanderia')
        .delete()
        .eq('idlavanderia', id);

      if (!error) {
        loadConfigData();
      } else {
        alert("Erro ao excluir lavanderia: " + error.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  const tabsConfig = [
    { key: 'geral', label: 'Geral', icon: Settings2 },
    { key: 'lavanderia', label: 'Lavanderia', icon: Waves },
    { key: 'estadias', label: 'Cursos e Estadias', icon: BookOpen },
    { key: 'modulos', label: 'Módulos', icon: Layers },
    { key: 'quartos', label: 'Quartos', icon: Hotel },
    { key: 'status', label: 'Status de Hóspedes', icon: HelpCircle },
  ] as const;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-xl font-serif font-bold text-[#082842] dark:text-slate-100">Configurações de Hospedagem</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Ajuste as diretrizes e os cadastros auxiliares do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Tab Menu */}
        <div className="glass shadow-premium rounded-2xl p-3 flex flex-col gap-1.5 transition-all">
          {tabsConfig.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setEditingEstadia(null);
              }}
              className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-left transition-all duration-200 cursor-pointer hover-lift
                ${activeTab === t.key 
                  ? 'bg-secondary text-white shadow-md shadow-secondary/15' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-secondary'}`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side Content Pane */}
        <div className="lg:col-span-3">
          {activeTab === 'geral' && (
            <form onSubmit={handleSaveGeral} className="glass shadow-premium rounded-2xl p-6 space-y-6 animate-fade-in bg-white/90">
              <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono">Configuração Geral</h3>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-center justify-between p-4.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-slate-700 dark:text-slate-300">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                      <ShieldAlert className="w-4 h-4" />
                      Status de Inscrições Externas
                    </p>
                    <p className="text-[10px] text-slate-500">Ativa ou suspende a abertura do formulário público.</p>
                  </div>
                  <select
                    value={configGeral.chos_ativar}
                    onChange={(e) => setConfigGeral({ ...configGeral, chos_ativar: e.target.value as 'Sim' | 'Não' })}
                    className="text-xs font-semibold py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl outline-none cursor-pointer focus:ring-1 focus:ring-secondary/20"
                  >
                    <option value="Sim">Ativo (Permitir Inscrições)</option>
                    <option value="Não">Inativo (Bloquear Inscrições)</option>
                  </select>
                </div>

                {configGeral.chos_ativar === 'Não' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Mensagem para Formulário Inativo</label>
                    <textarea
                      required
                      value={configGeral.chos_txtinativo}
                      onChange={(e) => setConfigGeral({ ...configGeral, chos_txtinativo: e.target.value })}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      placeholder="Ex: As inscrições para hospedagens estão temporariamente suspensas..."
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Texto de Acolhida (Início do Formulário)</label>
                  <textarea
                    required
                    value={configGeral.chos_acolhida}
                    onChange={(e) => setConfigGeral({ ...configGeral, chos_acolhida: e.target.value })}
                    rows={6}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                    placeholder="Escreva a mensagem de acolhida que aparecerá no cabeçalho da ficha externa..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-secondary hover:bg-secondary/95 text-white font-bold text-xs rounded-xl shadow-md shadow-secondary/15 transition-all cursor-pointer disabled:opacity-50 hover-lift"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'lavanderia' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add form */}
              <form onSubmit={handleSaveLavanderia} className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">
                  {newLavanderia.idlavanderia ? 'Editar Serviço' : 'Adicionar Serviço de Lavanderia'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500">Identificador / Descrição do Serviço</label>
                    <input
                      type="text"
                      required
                      value={newLavanderia.lav_servico}
                      onChange={(e) => setNewLavanderia({ ...newLavanderia, lav_servico: e.target.value })}
                      placeholder="Ex: Preciso de lavanderia (Completo), Não preciso de lavanderia"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newLavanderia.idlavanderia && (
                      <button
                        type="button"
                        onClick={() => setNewLavanderia({ idlavanderia: '', lav_servico: '' })}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 shrink-0 cursor-pointer hover-lift"
                    >
                      {newLavanderia.idlavanderia ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">Serviços de Lavanderia Cadastrados</h3>
                {lavanderias.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum serviço de lavanderia cadastrado.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                    {lavanderias.map(l => (
                      <div key={l.idlavanderia} className="py-3 flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{l.lav_servico}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setNewLavanderia({ idlavanderia: l.idlavanderia, lav_servico: l.lav_servico })}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-amber-500 cursor-pointer transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLavanderia(l.idlavanderia)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'estadias' && !editingEstadia && (
            <div className="space-y-6 animate-fade-in">
              <div className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono">Cursos e Estadias Cadastrados</h3>
                  <button
                    onClick={() => {
                      setEditingEstadia({
                        main_motivo: 'Novo Curso',
                        main_status: 'Ativo',
                        main_porta: '587',
                        main_seguranca: 'TLS',
                        main_mensagemtela: 'Sua inscrição foi realizada com sucesso!',
                        main_mensagememail: 'Prezado(a) [[hos_nome]], sua inscrição no curso [[hos_estadiamotivo]] foi realizada com sucesso!',
                        main_termos: 'Eu aceito os termos e regulamentos da hospedagem...',
                        main_recibo_pessoal: 'RECEBEMOS de [[hos_nome]] o valor correspondente a diárias de hospedagem...',
                        main_recibo_terceiros: 'RECEBEMOS de [[hos_recnome]] o valor correspondente a diárias de hospedagem do hóspede [[hos_nome]]...',
                        main_recibo_mensagem: 'Prezado(a) [[hos_nome]], segue em anexo o recibo da sua hospedagem.'
                      });
                      setCourseSubTab('smtp');
                    }}
                    className="flex items-center gap-1.5 px-4.5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/15 transition-all cursor-pointer hover-lift"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Curso</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {estadias.map(item => (
                    <div key={item.idmainhospedagem} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.main_motivo}</h4>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">
                          Servidor: {item.main_host || 'N/A'} | Status: <span className={item.main_status === 'Ativo' ? 'text-emerald-500 font-bold' : 'text-rose-500'}>{item.main_status}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDuplicateEstadia(item.idmainhospedagem)}
                          title="Duplicar"
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEstadia(item);
                            setCourseSubTab('smtp');
                          }}
                          title="Editar"
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-amber-50 text-amber-500 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEstadia(item.idmainhospedagem)}
                          title="Excluir"
                          className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-red-50 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'estadias' && editingEstadia && (
            <form onSubmit={handleSaveEstadia} className="glass shadow-premium rounded-2xl p-6 space-y-6 animate-fade-in bg-white/90">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono">
                  {editingEstadia.idmainhospedagem ? 'Editar Curso' : 'Novo Curso / Estadia'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingEstadia(null)}
                  className="text-xs font-bold text-slate-500 hover:text-[#082842]"
                >
                  Voltar
                </button>
              </div>

              {/* Sub-tab Navigation for Course Editing */}
              <div className="flex flex-wrap border-b border-slate-100 dark:border-slate-800/60 pb-0.5 gap-2">
                {(['smtp', 'mensagens', 'recibo', 'termos'] as const).map(subTab => (
                  <button
                    key={subTab}
                    type="button"
                    onClick={() => setCourseSubTab(subTab)}
                    className={`py-2 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer
                      ${courseSubTab === subTab
                        ? 'border-secondary text-secondary font-black'
                        : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    {subTab === 'smtp' && 'Identificação & SMTP'}
                    {subTab === 'mensagens' && 'Confirmações'}
                    {subTab === 'recibo' && 'Templates de Recibo'}
                    {subTab === 'termos' && 'Termos & Regulamento'}
                  </button>
                ))}
              </div>

              {/* Sub-tab Content: SMTP */}
              {courseSubTab === 'smtp' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Nome do Curso / Motivo da Estadia</label>
                      <input
                        type="text"
                        required
                        value={editingEstadia.main_motivo || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_motivo: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Status</label>
                      <select
                        value={editingEstadia.main_status || 'Ativo'}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_status: e.target.value as 'Ativo' | 'Inativo' })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none cursor-pointer focus:border-secondary transition-all"
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider font-mono border-b border-slate-100 dark:border-slate-800/60 pb-1">Configurações de E-mail (PHPMailer SMTP)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Servidor Host</label>
                      <input
                        type="text"
                        value={editingEstadia.main_host || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_host: e.target.value })}
                        placeholder="smtp.dehoniana.org.br"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Segurança</label>
                      <select
                        value={editingEstadia.main_seguranca || 'TLS'}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_seguranca: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none cursor-pointer focus:border-secondary transition-all"
                      >
                        <option value="SSL">SSL</option>
                        <option value="TLS">TLS</option>
                        <option value="">Nenhuma</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Porta</label>
                      <input
                        type="text"
                        value={editingEstadia.main_porta || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_porta: e.target.value })}
                        placeholder="587"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Nome do Remetente (Nome da Conta)</label>
                      <input
                        type="text"
                        value={editingEstadia.main_remetente || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_remetente: e.target.value })}
                        placeholder="Conventinho SCJ"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">E-mail do Remetente</label>
                      <input
                        type="email"
                        value={editingEstadia.main_email || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_email: e.target.value })}
                        placeholder="contato@conventinho.org.br"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Senha da Conta de E-mail</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={editingEstadia.main_senha || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_senha: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab Content: Confirmações */}
              {courseSubTab === 'mensagens' && (
                <div className="space-y-5 animate-fade-in">
                  <TagTextarea
                    label="Mensagem de Sucesso na Tela (Exibida imediatamente após a inscrição)"
                    value={editingEstadia.main_mensagemtela || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_mensagemtela: val })}
                    rows={4}
                  />
                  <TagTextarea
                    label="Corpo da Mensagem de Confirmação Enviada por E-mail"
                    value={editingEstadia.main_mensagememail || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_mensagememail: val })}
                    rows={8}
                  />
                </div>
              )}

              {/* Sub-tab Content: Recibos */}
              {courseSubTab === 'recibo' && (
                <div className="space-y-5 animate-fade-in">
                  <TagTextarea
                    label="Template do Recibo no Próprio Nome"
                    value={editingEstadia.main_recibo_pessoal || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_recibo_pessoal: val })}
                    rows={6}
                  />
                  <TagTextarea
                    label="Template do Recibo em Nome de Terceiros"
                    value={editingEstadia.main_recibo_terceiros || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_recibo_terceiros: val })}
                    rows={6}
                  />
                  <TagTextarea
                    label="Mensagem do E-mail de Envio de Recibo (O PDF irá em anexo)"
                    value={editingEstadia.main_recibo_mensagem || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_recibo_mensagem: val })}
                    rows={4}
                  />
                </div>
              )}

              {/* Sub-tab Content: Termos */}
              {courseSubTab === 'termos' && (
                <div className="space-y-5 animate-fade-in">
                  <TagTextarea
                    label="Regulamentos / Termos e Condições Gerais"
                    value={editingEstadia.main_termos || ''}
                    onChange={(val) => setEditingEstadia({ ...editingEstadia, main_termos: val })}
                    rows={12}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEstadia(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/15 disabled:opacity-50 hover-lift"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Curso</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'modulos' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add form */}
              <form onSubmit={handleSaveModulo} className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">
                  {newModulo.idmodulos ? 'Editar Módulo' : 'Adicionar Módulo'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500">Nome do Módulo</label>
                    <input
                      type="text"
                      required
                      value={newModulo.mod_nome}
                      onChange={(e) => setNewModulo({ ...newModulo, mod_nome: e.target.value })}
                      placeholder="Ex: Módulo I - Primeiro Semestre"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newModulo.idmodulos && (
                      <button
                        type="button"
                        onClick={() => setNewModulo({ idmodulos: '', mod_nome: '', mod_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 shrink-0 cursor-pointer hover-lift"
                    >
                      {newModulo.idmodulos ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">Módulos Cadastrados</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                  {modulos.map(m => (
                    <div key={m.idmodulos} className="py-3 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{m.mod_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewModulo({ idmodulos: m.idmodulos, mod_nome: m.mod_nome, mod_status: m.mod_status })}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-amber-500 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteModulo(m.idmodulos)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quartos' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add Form */}
              <form onSubmit={handleSaveQuarto} className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">
                  {newQuarto.idhos_quartos ? 'Editar Quarto' : 'Adicionar Quarto'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500">Identificador / Nome do Quarto</label>
                    <input
                      type="text"
                      required
                      value={newQuarto.hos_qua_nome}
                      onChange={(e) => setNewQuarto({ ...newQuarto, hos_qua_nome: e.target.value })}
                      placeholder="Ex: Quarto 102 - Ala Leste"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newQuarto.idhos_quartos && (
                      <button
                        type="button"
                        onClick={() => setNewQuarto({ idhos_quartos: '', hos_qua_nome: '', hos_qua_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 shrink-0 cursor-pointer hover-lift"
                    >
                      {newQuarto.idhos_quartos ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">Quartos Cadastrados</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                  {quartos.map(q => (
                    <div key={q.idhos_quartos} className="py-3 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{q.hos_qua_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewQuarto({ idhos_quartos: q.idhos_quartos, hos_qua_nome: q.hos_qua_nome, hos_qua_status: q.hos_qua_status })}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-amber-500 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuarto(q.idhos_quartos)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add Form */}
              <form onSubmit={handleSaveStatus} className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">
                  {newStatus.idstatushospedagem ? 'Editar Status' : 'Adicionar Status'}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-semibold text-slate-500">Nome do Status</label>
                    <input
                      type="text"
                      required
                      value={newStatus.sta_nome}
                      onChange={(e) => setNewStatus({ ...newStatus, sta_nome: e.target.value })}
                      placeholder="Ex: Confirmado, Pago, Cancelado"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/25 transition-all"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newStatus.idstatushospedagem && (
                      <button
                        type="button"
                        onClick={() => setNewStatus({ idstatushospedagem: '', sta_nome: '', sta_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow-md shadow-secondary/10 shrink-0 cursor-pointer hover-lift"
                    >
                      {newStatus.idstatushospedagem ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="glass shadow-premium rounded-2xl p-6 bg-white/90">
                <h3 className="text-xs font-extrabold text-[#082842] dark:text-[#2d8bc6] uppercase tracking-wider font-mono mb-4">Status Disponíveis</h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs text-slate-700 dark:text-slate-300">
                  {statuses.map(s => (
                    <div key={s.idstatushospedagem} className="py-3 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.sta_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewStatus({ idstatushospedagem: s.idstatushospedagem, sta_nome: s.sta_nome, sta_status: s.sta_status })}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-amber-500 cursor-pointer transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(s.idstatushospedagem)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospedagensConfiguracoes;
