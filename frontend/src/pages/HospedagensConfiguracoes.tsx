import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  Save, Plus, Trash2, Edit, Copy, Loader2, 
  Settings2, BookOpen, Layers, Hotel, HelpCircle, ShieldAlert, Waves
} from 'lucide-react';
import { confirmAction, showToast } from '../hooks/useFeedback';

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
        <label className="text-xs font-medium text-slate-500">{label}</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTags(!showTags)}
            className="flex items-center gap-1.5 px-3 py-1 border border-slate-300 dark:border-slate-700 rounded-[6px] bg-white dark:bg-slate-900 hover:bg-slate-50 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-sm cursor-pointer select-none transition-colors"
          >
            <span>Campos Dinâmicos</span>
            <span className="text-[8px] opacity-60">▼</span>
          </button>
          
          {showTags && (
            <div className="absolute right-0 mt-1 w-80 max-h-72 overflow-y-auto bg-white dark:bg-[#161b22] rounded-[6px] shadow-xl z-20 p-3.5 space-y-3 scrollbar-thin border border-slate-300 dark:border-slate-700">
              {tags.map(cat => (
                <div key={cat.category} className="space-y-1">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/60 pb-0.5">{cat.category}</span>
                  <div className="flex flex-wrap gap-1">
                    {cat.items.map(item => (
                      <button
                        key={item.tag}
                        type="button"
                        onClick={() => handleInsertTag(item.tag)}
                        className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 bg-[#f5f5f7]/80 hover:bg-[#226380]/10 hover:text-[#226380] hover:border-[#226380]/20 dark:bg-slate-800 rounded-[6px] text-[10px] font-medium transition-colors cursor-pointer"
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
        className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none transition-all font-mono"
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
        showToast.success("Configurações gerais salvas com sucesso!");
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar configurações: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar configurações gerais.");
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
        showToast.success('Dados da estadia/curso salvos com sucesso.');
        setEditingEstadia(null);
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar estadia.");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateEstadia = async (id: string) => {
    const source = estadias.find(e => e.idmainhospedagem === id);
    const confirmed = await confirmAction({
      title: 'Duplicar Curso/Estadia',
      badge: 'Hospedagens • Duplicação',
      message: source?.main_motivo 
        ? `Deseja criar uma cópia de "${source.main_motivo}"?` 
        : 'Deseja criar uma cópia deste curso/estadia?',
      detail: 'Uma nova entrada será gerada com os mesmos parâmetros de configuração.',
      confirmLabel: 'Criar Cópia',
      cancelLabel: 'Cancelar',
      tone: 'primary',
      icon: 'help'
    });
    if (!confirmed) return;

    try {
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
        showToast.success('Cópia da estadia criada com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao duplicar estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao duplicar estadia.");
    }
  };

  const handleDeleteEstadia = async (id: string) => {
    const target = estadias.find(e => e.idmainhospedagem === id);
    const confirmed = await confirmAction({
      title: 'Excluir Curso/Estadia',
      badge: 'Hospedagens • Exclusão',
      message: target?.main_motivo 
        ? `Deseja realmente excluir "${target.main_motivo}"?` 
        : 'Deseja realmente excluir este curso/estadia?',
      detail: 'Esta ação não poderá ser desfeita e removerá este curso das opções de hospedagem.',
      confirmLabel: 'Excluir Estadia',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('mainhospedagem')
        .delete()
        .eq('idmainhospedagem', id);

      if (!error) {
        showToast.success('Estadia/curso excluído com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao excluir estadia: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao excluir estadia.");
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
        showToast.success('Módulo salvo com sucesso.');
        setNewModulo({ idmodulos: '', mod_nome: '', mod_status: 'Ativo' });
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar módulo: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar módulo.");
    }
  };

  const handleDeleteModulo = async (id: string) => {
    const target = modulos.find(m => m.idmodulos === id);
    const confirmed = await confirmAction({
      title: 'Excluir Módulo',
      badge: 'Hospedagens • Configuração',
      message: target?.mod_nome ? `Deseja excluir o módulo "${target.mod_nome}"?` : 'Deseja excluir este módulo?',
      confirmLabel: 'Excluir Módulo',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('modulos')
        .delete()
        .eq('idmodulos', id);

      if (!error) {
        showToast.success('Módulo excluído com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao excluir módulo: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao excluir módulo.");
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
        showToast.success('Quarto salvo com sucesso.');
        setNewQuarto({ idhos_quartos: '', hos_qua_nome: '', hos_qua_status: 'Ativo' });
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar quarto: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar quarto.");
    }
  };

  const handleDeleteQuarto = async (id: string) => {
    const target = quartos.find(q => q.idhos_quartos === id);
    const confirmed = await confirmAction({
      title: 'Excluir Quarto',
      badge: 'Hospedagens • Configuração',
      message: target?.hos_qua_nome ? `Deseja excluir o quarto "${target.hos_qua_nome}"?` : 'Deseja excluir este quarto?',
      confirmLabel: 'Excluir Quarto',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('hos_quartos')
        .delete()
        .eq('idhos_quartos', id);

      if (!error) {
        showToast.success('Quarto excluído com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao excluir quarto: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao excluir quarto.");
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
        showToast.success('Status salvo com sucesso.');
        setNewStatus({ idstatushospedagem: '', sta_nome: '', sta_status: 'Ativo' });
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar status: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar status.");
    }
  };

  const handleDeleteStatus = async (id: string) => {
    const target = statuses.find(s => s.idstatushospedagem === id);
    const confirmed = await confirmAction({
      title: 'Excluir Status',
      badge: 'Hospedagens • Configuração',
      message: target?.sta_nome ? `Deseja excluir o status "${target.sta_nome}"?` : 'Deseja excluir este status?',
      confirmLabel: 'Excluir Status',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('statushospedagem')
        .delete()
        .eq('idstatushospedagem', id);

      if (!error) {
        showToast.success('Status excluído com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao excluir status: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao excluir status.");
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
        showToast.success('Serviço de lavanderia salvo com sucesso.');
        setNewLavanderia({ idlavanderia: '', lav_servico: '' });
        loadConfigData();
      } else {
        showToast.error("Erro ao salvar lavanderia: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao salvar lavanderia.");
    }
  };

  const handleDeleteLavanderia = async (id: string) => {
    const target = lavanderias.find(l => l.idlavanderia === id);
    const confirmed = await confirmAction({
      title: 'Excluir Serviço de Lavanderia',
      badge: 'Hospedagens • Configuração',
      message: target?.lav_servico ? `Deseja excluir o serviço "${target.lav_servico}"?` : 'Deseja excluir este serviço de lavanderia?',
      confirmLabel: 'Excluir Serviço',
      cancelLabel: 'Cancelar',
      tone: 'danger',
      icon: 'trash'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('lavanderia')
        .delete()
        .eq('idlavanderia', id);

      if (!error) {
        showToast.success('Serviço de lavanderia excluído com sucesso.');
        loadConfigData();
      } else {
        showToast.error("Erro ao excluir lavanderia: " + error.message);
      }
    } catch (err) {
      console.error(err);
      showToast.error("Erro ao excluir lavanderia.");
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
      {/* HEADER SECTION - Apple Design System */}
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
          Parâmetros do Sistema • Hospedagem
        </span>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-1">
          Configurações de Hospedagem
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ajuste as diretrizes, serviços de lavanderia, quartos, cursos e status do sistema.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side Tab Menu - Apple Sidebar Style */}
        <div className="apple-card rounded-[6px] p-2 flex flex-col gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
          {tabsConfig.map(t => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setEditingEstadia(null);
              }}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-[6px] text-xs font-medium text-left transition-all duration-150 cursor-pointer
                ${activeTab === t.key 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'}`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Right Side Content Pane */}
        <div className="lg:col-span-3">
          {activeTab === 'geral' && (
            <form onSubmit={handleSaveGeral} className="apple-card rounded-[6px] p-6 md:p-8 space-y-6 animate-fade-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Diretrizes da Casa</span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Configuração Geral de Acolhida</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                <div className="flex items-center justify-between p-4 rounded-[6px] border border-amber-500/20 bg-amber-500/5 text-slate-700 dark:text-slate-300">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-400">
                      <ShieldAlert className="w-4 h-4" />
                      Status de Inscrições Externas
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Ativa ou suspende a abertura do formulário público de hospedagens.</p>
                  </div>
                  <select
                    value={configGeral.chos_ativar}
                    onChange={(e) => setConfigGeral({ ...configGeral, chos_ativar: e.target.value as 'Sim' | 'Não' })}
                    className="apple-input text-xs font-medium py-2 px-3.5 rounded-[6px] outline-none cursor-pointer"
                  >
                    <option value="Sim">Ativo (Permitir Inscrições)</option>
                    <option value="Não">Inativo (Bloquear Inscrições)</option>
                  </select>
                </div>

                {configGeral.chos_ativar === 'Não' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-500">Mensagem para Formulário Inativo</label>
                    <textarea
                      required
                      value={configGeral.chos_txtinativo}
                      onChange={(e) => setConfigGeral({ ...configGeral, chos_txtinativo: e.target.value })}
                      rows={3}
                      className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                      placeholder="Ex: As inscrições para hospedagens estão temporariamente suspensas..."
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">Texto de Acolhida (Início do Formulário)</label>
                  <textarea
                    required
                    value={configGeral.chos_acolhida}
                    onChange={(e) => setConfigGeral({ ...configGeral, chos_acolhida: e.target.value })}
                    rows={6}
                    className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                    placeholder="Escreva a mensagem de acolhida que aparecerá no cabeçalho da ficha externa..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'lavanderia' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add form */}
              <form onSubmit={handleSaveLavanderia} className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Serviços Adicionais</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {newLavanderia.idlavanderia ? 'Editar Serviço' : 'Cadastrar Serviço de Lavanderia'}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500">Descrição / Opção do Serviço</label>
                    <input
                      type="text"
                      required
                      value={newLavanderia.lav_servico}
                      onChange={(e) => setNewLavanderia({ ...newLavanderia, lav_servico: e.target.value })}
                      placeholder="Ex: Preciso de lavanderia (Completo), Não preciso de lavanderia"
                      className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newLavanderia.idlavanderia && (
                      <button
                        type="button"
                        onClick={() => setNewLavanderia({ idlavanderia: '', lav_servico: '' })}
                        className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-[6px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] shrink-0 cursor-pointer uppercase tracking-wider"
                    >
                      {newLavanderia.idlavanderia ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Itens Disponíveis</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Serviços Cadastrados</h3>
                </div>

                {lavanderias.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum serviço de lavanderia cadastrado.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                    {lavanderias.map(l => (
                      <div key={l.idlavanderia} className="py-3.5 flex items-center justify-between gap-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{l.lav_servico}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setNewLavanderia({ idlavanderia: l.idlavanderia, lav_servico: l.lav_servico })}
                            className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteLavanderia(l.idlavanderia)}
                            className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
              <div className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Eventos & Cursos</span>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Cursos e Estadias Cadastrados</h3>
                  </div>
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
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] cursor-pointer uppercase tracking-wider"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Curso</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {estadias.map(item => (
                    <div key={item.idmainhospedagem} className="py-4 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{item.main_motivo}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 font-mono">
                          Servidor: {item.main_host || 'N/A'} • Status: <span className={item.main_status === 'Ativo' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500'}>{item.main_status}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleDuplicateEstadia(item.idmainhospedagem)}
                          title="Duplicar"
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingEstadia(item);
                            setCourseSubTab('smtp');
                          }}
                          title="Editar"
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEstadia(item.idmainhospedagem)}
                          title="Excluir"
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
            <form onSubmit={handleSaveEstadia} className="apple-card rounded-[6px] p-6 md:p-8 space-y-6 animate-fade-in border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Configuração de Evento</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {editingEstadia.idmainhospedagem ? `Editar: ${editingEstadia.main_motivo || 'Curso'}` : 'Novo Curso / Estadia'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEstadia(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-[6px] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
              </div>

              {/* Sub-tab Navigation for Course Editing */}
              <div className="flex flex-wrap border-b border-slate-100 dark:border-slate-800 pb-0.5 gap-2">
                {(['smtp', 'mensagens', 'recibo', 'termos'] as const).map(subTab => (
                  <button
                    key={subTab}
                    type="button"
                    onClick={() => setCourseSubTab(subTab)}
                    className={`py-2 px-3.5 text-xs transition-all border-b-2 cursor-pointer
                      ${courseSubTab === subTab
                        ? 'border-[#226380] text-[#226380] font-semibold'
                        : 'border-transparent text-slate-400 hover:text-slate-600 font-medium'}`}
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
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Status</label>
                      <select
                        value={editingEstadia.main_status || 'Ativo'}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_status: e.target.value as 'Ativo' | 'Inativo' })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none cursor-pointer focus:border-secondary transition-all"
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
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Segurança</label>
                      <select
                        value={editingEstadia.main_seguranca || 'TLS'}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_seguranca: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none cursor-pointer focus:border-secondary transition-all"
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
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-500">Nome do Remetente (Nome da Conta)</label>
                      <input
                        type="text"
                        value={editingEstadia.main_remetente || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_remetente: e.target.value })}
                        placeholder="Sistema BRM"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">E-mail do Remetente</label>
                      <input
                        type="email"
                        value={editingEstadia.main_email || ''}
                        onChange={(e) => setEditingEstadia({ ...editingEstadia, main_email: e.target.value })}
                        placeholder="contato@brm.org.br"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all font-mono"
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
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-[6px] bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary transition-all font-mono"
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

              <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingEstadia(null)}
                  className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-[6px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Salvar Curso</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'modulos' && (
            <div className="space-y-6 animate-fade-in">
              {/* Add form */}
              <form onSubmit={handleSaveModulo} className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estrutura de Cursos</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {newModulo.idmodulos ? 'Editar Módulo' : 'Cadastrar Novo Módulo'}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500">Nome do Módulo</label>
                    <input
                      type="text"
                      required
                      value={newModulo.mod_nome}
                      onChange={(e) => setNewModulo({ ...newModulo, mod_nome: e.target.value })}
                      placeholder="Ex: Módulo I - Primeiro Semestre"
                      className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newModulo.idmodulos && (
                      <button
                        type="button"
                        onClick={() => setNewModulo({ idmodulos: '', mod_nome: '', mod_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-[6px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] shrink-0 cursor-pointer uppercase tracking-wider"
                    >
                      {newModulo.idmodulos ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Itens Disponíveis</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Módulos Cadastrados</h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                  {modulos.map(m => (
                    <div key={m.idmodulos} className="py-3.5 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{m.mod_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewModulo({ idmodulos: m.idmodulos, mod_nome: m.mod_nome, mod_status: m.mod_status })}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteModulo(m.idmodulos)}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
              <form onSubmit={handleSaveQuarto} className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acomodações</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {newQuarto.idhos_quartos ? 'Editar Quarto' : 'Cadastrar Novo Quarto'}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500">Identificador / Número do Quarto</label>
                    <input
                      type="text"
                      required
                      value={newQuarto.hos_qua_nome}
                      onChange={(e) => setNewQuarto({ ...newQuarto, hos_qua_nome: e.target.value })}
                      placeholder="Ex: Quarto 102 - Ala Leste"
                      className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newQuarto.idhos_quartos && (
                      <button
                        type="button"
                        onClick={() => setNewQuarto({ idhos_quartos: '', hos_qua_nome: '', hos_qua_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-[6px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] shrink-0 cursor-pointer uppercase tracking-wider"
                    >
                      {newQuarto.idhos_quartos ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Itens Disponíveis</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Quartos Cadastrados</h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                  {quartos.map(q => (
                    <div key={q.idhos_quartos} className="py-3.5 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{q.hos_qua_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewQuarto({ idhos_quartos: q.idhos_quartos, hos_qua_nome: q.hos_qua_nome, hos_qua_status: q.hos_qua_status })}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuarto(q.idhos_quartos)}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
              <form onSubmit={handleSaveStatus} className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Ciclo de Atendimento</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                    {newStatus.idstatushospedagem ? 'Editar Status' : 'Cadastrar Novo Status'}
                  </h3>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="space-y-1.5 flex-1 w-full">
                    <label className="text-xs font-medium text-slate-500">Nome do Status</label>
                    <input
                      type="text"
                      required
                      value={newStatus.sta_nome}
                      onChange={(e) => setNewStatus({ ...newStatus, sta_nome: e.target.value })}
                      placeholder="Ex: Confirmado, Em análise, Cancelado"
                      className="w-full apple-input px-3.5 py-2.5 text-xs rounded-[6px] outline-none"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {newStatus.idstatushospedagem && (
                      <button
                        type="button"
                        onClick={() => setNewStatus({ idstatushospedagem: '', sta_nome: '', sta_status: 'Ativo' })}
                        className="px-4 py-2.5 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-[6px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 rounded-[6px] shrink-0 cursor-pointer uppercase tracking-wider"
                    >
                      {newStatus.idstatushospedagem ? 'Salvar' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              </form>

              {/* List */}
              <div className="apple-card rounded-[6px] p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] shadow-none">
                <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Itens Disponíveis</span>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">Status Disponíveis</h3>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                  {statuses.map(s => (
                    <div key={s.idstatushospedagem} className="py-3.5 flex items-center justify-between gap-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{s.sta_nome}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setNewStatus({ idstatushospedagem: s.idstatushospedagem, sta_nome: s.sta_nome, sta_status: s.sta_status })}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStatus(s.idstatushospedagem)}
                          className="w-8 h-8 rounded-[6px] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
