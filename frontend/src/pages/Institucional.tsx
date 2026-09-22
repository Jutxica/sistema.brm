import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  Building2,
  Check,
  Edit,
  Landmark,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react';

type Status = 'Ativa' | 'Inativa';
type CadastroStatus = 'Em revisão' | 'Aprovado' | 'Arquivado';

interface Comunidade {
  id: string;
  nome: string;
  padroeiro: string | null;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  status: Status;
}

interface Obra {
  id: string;
  comunidade_id: string | null;
  nome: string;
  tipo: string;
  permite_hospedagem: boolean;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  email: string | null;
  status: Status;
}

interface Religioso {
  id: string;
  nome_civil: string;
  nome_religioso: string | null;
  grau: string;
  comunidade_atual_id: string | null;
  obra_atual_id: string | null;
  email_institucional: string | null;
  telefone_celular: string | null;
  status: string;
  status_cadastro: CadastroStatus;
}

type ActiveTab = 'religiosos' | 'comunidades' | 'obras';

const emptyReligioso: Partial<Religioso> = {
  nome_civil: '',
  nome_religioso: '',
  grau: 'Padre',
  comunidade_atual_id: '',
  obra_atual_id: '',
  email_institucional: '',
  telefone_celular: '',
  status: 'Ativo',
  status_cadastro: 'Aprovado',
};

const emptyComunidade: Partial<Comunidade> = {
  nome: '',
  padroeiro: '',
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  status: 'Ativa',
};

const emptyObra: Partial<Obra> = {
  nome: '',
  tipo: 'Casa de Retiro/Hospedagem',
  comunidade_id: '',
  permite_hospedagem: false,
  cidade: '',
  estado: '',
  telefone: '',
  email: '',
  status: 'Ativa',
};

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
  hint?: string;
}> = ({ label, children, hint }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-slate-500">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

const inputClass = 'w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 outline-none focus:border-secondary';

export const Institucional: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('religiosos');
  const [religiosos, setReligiosos] = useState<Religioso[]>([]);
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [editingReligioso, setEditingReligioso] = useState<Partial<Religioso> | null>(null);
  const [editingComunidade, setEditingComunidade] = useState<Partial<Comunidade> | null>(null);
  const [editingObra, setEditingObra] = useState<Partial<Obra> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [{ data: religiososData }, { data: comunidadesData }, { data: obrasData }] = await Promise.all([
        supabase
          .from('religiosos')
          .select('id,nome_civil,nome_religioso,grau,comunidade_atual_id,obra_atual_id,email_institucional,telefone_celular,status,status_cadastro')
          .order('nome_civil', { ascending: true }),
        supabase
          .from('comunidades')
          .select('id,nome,padroeiro,cidade,estado,telefone,email,status')
          .order('nome', { ascending: true }),
        supabase
          .from('obras')
          .select('id,comunidade_id,nome,tipo,permite_hospedagem,cidade,estado,telefone,email,status')
          .order('nome', { ascending: true }),
      ]);

      setReligiosos((religiososData || []) as Religioso[]);
      setComunidades((comunidadesData || []) as Comunidade[]);
      setObras((obrasData || []) as Obra[]);
    } catch (err) {
      console.error('Erro ao carregar dados institucionais:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const comunidadeNome = (id?: string | null) => comunidades.find(c => c.id === id)?.nome || 'Sem comunidade';
  const obraNome = (id?: string | null) => obras.find(o => o.id === id)?.nome || 'Sem obra';

  const filteredReligiosos = useMemo(() => {
    const lower = query.toLowerCase();
    return religiosos.filter(item =>
      [item.nome_civil, item.nome_religioso || '', item.grau, item.email_institucional || '']
        .join(' ')
        .toLowerCase()
        .includes(lower)
    );
  }, [query, religiosos]);

  const handleSaveReligioso = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingReligioso?.nome_civil) return;
    setSaving(true);

    const payload = {
      nome_civil: editingReligioso.nome_civil,
      nome_religioso: editingReligioso.nome_religioso || null,
      grau: editingReligioso.grau || 'Padre',
      comunidade_atual_id: editingReligioso.comunidade_atual_id || null,
      obra_atual_id: editingReligioso.obra_atual_id || null,
      email_institucional: editingReligioso.email_institucional || null,
      telefone_celular: editingReligioso.telefone_celular || null,
      status: editingReligioso.status || 'Ativo',
      status_cadastro: editingReligioso.status_cadastro || 'Aprovado',
      origem_cadastro: 'admin',
    };

    const { error } = editingReligioso.id
      ? await supabase.from('religiosos').update(payload).eq('id', editingReligioso.id)
      : await supabase.from('religiosos').insert([payload]);

    setSaving(false);
    if (error) {
      alert(`Erro ao salvar religioso: ${error.message}`);
      return;
    }
    setEditingReligioso(null);
    loadData();
  };

  const handleSaveComunidade = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingComunidade?.nome) return;
    setSaving(true);

    const payload = {
      nome: editingComunidade.nome,
      padroeiro: editingComunidade.padroeiro || null,
      cidade: editingComunidade.cidade || null,
      estado: editingComunidade.estado || null,
      telefone: editingComunidade.telefone || null,
      email: editingComunidade.email || null,
      status: editingComunidade.status || 'Ativa',
    };

    const { error } = editingComunidade.id
      ? await supabase.from('comunidades').update(payload).eq('id', editingComunidade.id)
      : await supabase.from('comunidades').insert([payload]);

    setSaving(false);
    if (error) {
      alert(`Erro ao salvar comunidade: ${error.message}`);
      return;
    }
    setEditingComunidade(null);
    loadData();
  };

  const handleSaveObra = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingObra?.nome) return;
    setSaving(true);

    const payload = {
      nome: editingObra.nome,
      tipo: editingObra.tipo || 'Outro',
      comunidade_id: editingObra.comunidade_id || null,
      permite_hospedagem: Boolean(editingObra.permite_hospedagem),
      cidade: editingObra.cidade || null,
      estado: editingObra.estado || null,
      telefone: editingObra.telefone || null,
      email: editingObra.email || null,
      status: editingObra.status || 'Ativa',
    };

    const { error } = editingObra.id
      ? await supabase.from('obras').update(payload).eq('id', editingObra.id)
      : await supabase.from('obras').insert([payload]);

    setSaving(false);
    if (error) {
      alert(`Erro ao salvar obra: ${error.message}`);
      return;
    }
    setEditingObra(null);
    loadData();
  };

  const handleDelete = async (table: 'religiosos' | 'comunidades' | 'obras', id: string) => {
    if (!window.confirm('Deseja realmente excluir este registro?')) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert(`Erro ao excluir registro: ${error.message}`);
      return;
    }
    loadData();
  };

  const tabs = [
    { key: 'religiosos' as const, label: 'Religiosos', icon: UsersRound, count: religiosos.length },
    { key: 'comunidades' as const, label: 'Comunidades', icon: Landmark, count: comunidades.length },
    { key: 'obras' as const, label: 'Obras', icon: Building2, count: obras.length },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
          <span className="text-sm font-medium text-slate-500">Carregando dados institucionais...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#082842] dark:text-slate-100">
            Gestão Institucional BRM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastro de religiosos, comunidades, obras e vínculos pastorais da Província.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar religiosos..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white/80 dark:bg-slate-900/70 outline-none focus:border-secondary"
            />
          </div>
          <button
            onClick={() => {
              if (activeTab === 'religiosos') setEditingReligioso(emptyReligioso);
              if (activeTab === 'comunidades') setEditingComunidade(emptyComunidade);
              if (activeTab === 'obras') setEditingObra(emptyObra);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/95 text-white text-xs font-semibold rounded-xl shadow-premium shadow-secondary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-secondary text-white border-secondary shadow-premium shadow-secondary/15'
                : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-secondary/40'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {editingReligioso && (
        <form onSubmit={handleSaveReligioso} className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          <FormHeader title={editingReligioso.id ? 'Editar Religioso' : 'Novo Religioso'} onCancel={() => setEditingReligioso(null)} saving={saving} />
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Nome civil">
              <input required className={inputClass} value={editingReligioso.nome_civil || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, nome_civil: e.target.value })} />
            </Field>
            <Field label="Nome religioso">
              <input className={inputClass} value={editingReligioso.nome_religioso || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, nome_religioso: e.target.value })} />
            </Field>
            <Field label="Grau">
              <select className={inputClass} value={editingReligioso.grau || 'Padre'} onChange={(e) => setEditingReligioso({ ...editingReligioso, grau: e.target.value })}>
                {['Frater', 'Irmão', 'Diácono', 'Padre', 'Bispo'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Comunidade atual">
              <select className={inputClass} value={editingReligioso.comunidade_atual_id || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, comunidade_atual_id: e.target.value })}>
                <option value="">Sem comunidade</option>
                {comunidades.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </Field>
            <Field label="Obra atual">
              <select className={inputClass} value={editingReligioso.obra_atual_id || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, obra_atual_id: e.target.value })}>
                <option value="">Sem obra</option>
                {obras.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </Field>
            <Field label="Status do cadastro">
              <select className={inputClass} value={editingReligioso.status_cadastro || 'Aprovado'} onChange={(e) => setEditingReligioso({ ...editingReligioso, status_cadastro: e.target.value as CadastroStatus })}>
                {['Em revisão', 'Aprovado', 'Arquivado'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="E-mail institucional">
              <input className={inputClass} value={editingReligioso.email_institucional || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, email_institucional: e.target.value })} />
            </Field>
            <Field label="Celular">
              <input className={inputClass} value={editingReligioso.telefone_celular || ''} onChange={(e) => setEditingReligioso({ ...editingReligioso, telefone_celular: e.target.value })} />
            </Field>
            <Field label="Status">
              <input className={inputClass} value={editingReligioso.status || 'Ativo'} onChange={(e) => setEditingReligioso({ ...editingReligioso, status: e.target.value })} />
            </Field>
          </div>
        </form>
      )}

      {editingComunidade && (
        <form onSubmit={handleSaveComunidade} className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          <FormHeader title={editingComunidade.id ? 'Editar Comunidade' : 'Nova Comunidade'} onCancel={() => setEditingComunidade(null)} saving={saving} />
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Nome">
              <input required className={inputClass} value={editingComunidade.nome || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, nome: e.target.value })} />
            </Field>
            <Field label="Padroeiro">
              <input className={inputClass} value={editingComunidade.padroeiro || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, padroeiro: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputClass} value={editingComunidade.status || 'Ativa'} onChange={(e) => setEditingComunidade({ ...editingComunidade, status: e.target.value as Status })}>
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </select>
            </Field>
            <Field label="Cidade">
              <input className={inputClass} value={editingComunidade.cidade || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, cidade: e.target.value })} />
            </Field>
            <Field label="Estado">
              <input className={inputClass} value={editingComunidade.estado || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, estado: e.target.value })} />
            </Field>
            <Field label="Telefone">
              <input className={inputClass} value={editingComunidade.telefone || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, telefone: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} value={editingComunidade.email || ''} onChange={(e) => setEditingComunidade({ ...editingComunidade, email: e.target.value })} />
            </Field>
          </div>
        </form>
      )}

      {editingObra && (
        <form onSubmit={handleSaveObra} className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          <FormHeader title={editingObra.id ? 'Editar Obra' : 'Nova Obra'} onCancel={() => setEditingObra(null)} saving={saving} />
          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Field label="Nome">
              <input required className={inputClass} value={editingObra.nome || ''} onChange={(e) => setEditingObra({ ...editingObra, nome: e.target.value })} />
            </Field>
            <Field label="Tipo">
              <select className={inputClass} value={editingObra.tipo || 'Outro'} onChange={(e) => setEditingObra({ ...editingObra, tipo: e.target.value })}>
                {['Casa de Retiro/Hospedagem', 'Paróquia', 'Colégio', 'Seminário', 'Obra Social', 'Outro'].map(value => <option key={value} value={value}>{value}</option>)}
              </select>
            </Field>
            <Field label="Comunidade vinculada">
              <select className={inputClass} value={editingObra.comunidade_id || ''} onChange={(e) => setEditingObra({ ...editingObra, comunidade_id: e.target.value })}>
                <option value="">Sem comunidade</option>
                {comunidades.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
            </Field>
            <Field label="Cidade">
              <input className={inputClass} value={editingObra.cidade || ''} onChange={(e) => setEditingObra({ ...editingObra, cidade: e.target.value })} />
            </Field>
            <Field label="Estado">
              <input className={inputClass} value={editingObra.estado || ''} onChange={(e) => setEditingObra({ ...editingObra, estado: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className={inputClass} value={editingObra.status || 'Ativa'} onChange={(e) => setEditingObra({ ...editingObra, status: e.target.value as Status })}>
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </select>
            </Field>
            <Field label="Telefone">
              <input className={inputClass} value={editingObra.telefone || ''} onChange={(e) => setEditingObra({ ...editingObra, telefone: e.target.value })} />
            </Field>
            <Field label="E-mail">
              <input className={inputClass} value={editingObra.email || ''} onChange={(e) => setEditingObra({ ...editingObra, email: e.target.value })} />
            </Field>
            <label className="flex items-center gap-3 mt-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(editingObra.permite_hospedagem)}
                onChange={(e) => setEditingObra({ ...editingObra, permite_hospedagem: e.target.checked })}
                className="w-4 h-4 accent-secondary"
              />
              Permite módulo de hospedagem
            </label>
          </div>
        </form>
      )}

      {activeTab === 'religiosos' && (
        <div className="glass shadow-premium rounded-2xl overflow-hidden bg-white/90">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 font-semibold tracking-wider font-mono">
                <th className="p-4">Religioso</th>
                <th className="p-4">Comunidade / Obra</th>
                <th className="p-4">Contato</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-slate-700 dark:text-slate-300">
              {filteredReligiosos.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.nome_religioso || item.nome_civil}</p>
                    <p className="text-[10px] text-slate-400">{item.grau} - {item.nome_civil}</p>
                  </td>
                  <td className="p-4">
                    <p>{comunidadeNome(item.comunidade_atual_id)}</p>
                    <p className="text-[10px] text-slate-400">{obraNome(item.obra_atual_id)}</p>
                  </td>
                  <td className="p-4 font-mono text-[11px]">
                    <p>{item.email_institucional || 'Sem e-mail'}</p>
                    <p className="text-slate-400">{item.telefone_celular || 'Sem telefone'}</p>
                  </td>
                  <td className="p-4 text-center">
                    <StatusBadge value={item.status_cadastro} />
                  </td>
                  <td className="p-4">
                    <ActionButtons onEdit={() => setEditingReligioso({ ...item })} onDelete={() => handleDelete('religiosos', item.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'comunidades' && (
        <SimpleCards
          items={comunidades}
          icon={Landmark}
          getTitle={(item) => item.nome}
          getSubtitle={(item) => item.padroeiro || 'Sem padroeiro informado'}
          getMeta={(item) => `${item.cidade || 'Cidade'} - ${item.estado || 'UF'}`}
          onEdit={(item) => setEditingComunidade({ ...item })}
          onDelete={(item) => handleDelete('comunidades', item.id)}
        />
      )}

      {activeTab === 'obras' && (
        <SimpleCards
          items={obras}
          icon={Building2}
          getTitle={(item) => item.nome}
          getSubtitle={(item) => `${item.tipo}${item.permite_hospedagem ? ' - Hospedagem ativa' : ''}`}
          getMeta={(item) => comunidadeNome(item.comunidade_id)}
          onEdit={(item) => setEditingObra({ ...item })}
          onDelete={(item) => handleDelete('obras', item.id)}
        />
      )}
    </div>
  );
};

const FormHeader: React.FC<{ title: string; onCancel: () => void; saving: boolean }> = ({ title, onCancel, saving }) => (
  <div className="flex justify-between items-center px-6 py-4 border-b bg-slate-50/50 dark:bg-slate-900/30">
    <span className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">{title}</span>
    <div className="flex gap-2">
      <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-400 text-xs font-semibold">
        <X className="w-4 h-4" />
        Cancelar
      </button>
      <button type="submit" disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-secondary text-white rounded-xl text-xs font-semibold shadow-premium shadow-secondary/15 disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar
      </button>
    </div>
  </div>
);

const StatusBadge: React.FC<{ value: string }> = ({ value }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
    value === 'Aprovado'
      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
      : value === 'Arquivado'
        ? 'bg-slate-500/10 text-slate-500'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }`}>
    <Check className="w-3 h-3" />
    {value}
  </span>
);

const ActionButtons: React.FC<{ onEdit: () => void; onDelete: () => void }> = ({ onEdit, onDelete }) => (
  <div className="flex items-center justify-center gap-1.5">
    <button onClick={onEdit} className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-amber-500">
      <Edit className="w-3.5 h-3.5" />
    </button>
    <button onClick={onDelete} className="p-1 rounded border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-red-500">
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  </div>
);

const SimpleCards = <T extends { id: string; status: string }>({
  items,
  icon: Icon,
  getTitle,
  getSubtitle,
  getMeta,
  onEdit,
  onDelete,
}: {
  items: T[];
  icon: React.ElementType;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  getMeta: (item: T) => string;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    {items.map(item => (
      <div key={item.id} className="glass shadow-premium rounded-2xl bg-white/90 p-5 border border-slate-100 dark:border-slate-800/70">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary dark:bg-secondary/10 dark:text-secondary">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{getTitle(item)}</h3>
              <p className="text-xs text-slate-500 mt-1">{getSubtitle(item)}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">{getMeta(item)}</p>
            </div>
          </div>
          <StatusBadge value={item.status === 'Ativa' ? 'Aprovado' : 'Arquivado'} />
        </div>
        <div className="flex justify-end mt-4">
          <ActionButtons onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} />
        </div>
      </div>
    ))}
  </div>
);

export default Institucional;
