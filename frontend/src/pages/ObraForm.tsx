import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Church, 
  Home, 
  Landmark, 
  CheckCircle2, 
  AlertCircle,
  Building,
  MapPin,
  Phone,
  Globe,
  Share2,
  BookOpen,
  ExternalLink,
  Image as ImageIcon,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface ObraFormData {
  nome: string;
  tipo: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  localidade: string;
  uf: string;
  diocese: string;
  telefone: string;
  whatsapp: string;
  email: string;
  site: string;
  instagram: string;
  facebook: string;
  youtube: string;
  fundacao: string;
  assumida_pelos_dehonianos: string;
  status: string;
  token_edicao?: string;
  historia: string;
  resumo_historico: string;
  fotos: any[];
  status_historia: string;
}

const initialForm: ObraFormData = {
  nome: '',
  tipo: 'Paróquia',
  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  localidade: '',
  uf: '',
  diocese: '',
  telefone: '',
  whatsapp: '',
  email: '',
  site: '',
  instagram: '',
  facebook: '',
  youtube: '',
  fundacao: '',
  assumida_pelos_dehonianos: '',
  status: 'Ativa',
  token_edicao: '',
  historia: '',
  resumo_historico: '',
  fotos: [],
  status_historia: 'Pendente'
};

const tipoOptions = [
  { value: 'Paróquia', label: 'Paróquia', desc: 'Comunidade paroquial e matriz', icon: Church },
  { value: 'Casa', label: 'Casa Religiosa', desc: 'Convento, seminário ou residência', icon: Home },
  { value: 'Obra', label: 'Obra Social / Instituto', desc: 'Colégio, instituto social ou centro pastoral', icon: Landmark }
];

const ufList = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const ObraForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<ObraFormData>(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // Se for criação, verificar tipo inicial na query string
    if (!isEditing) {
      const tipoParam = searchParams.get('tipo');
      if (tipoParam) {
        const lower = tipoParam.toLowerCase();
        if (lower === 'paroquia' || lower === 'paróquia') {
          setForm(prev => ({ ...prev, tipo: 'Paróquia' }));
        } else if (lower === 'casa') {
          setForm(prev => ({ ...prev, tipo: 'Casa' }));
        } else if (lower === 'obra') {
          setForm(prev => ({ ...prev, tipo: 'Obra' }));
        }
      }
      return;
    }

    // Carregar obra existente para edição
    const loadObra = async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase
          .from('religiosos_obras_referencia')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Obra não encontrada no banco de dados.');

        let rawTel = data.telefone || '';
        let rawWpp = data.whatsapp || '';
        if (!rawWpp && rawTel.includes('Whats:')) {
          const parts = rawTel.split(/\|\s*Whats:|\bWhats:/i);
          rawTel = parts[0]?.trim() || '';
          rawWpp = parts[1]?.trim() || '';
        }

        setForm({
          nome: data.nome || '',
          tipo: data.tipo || 'Paróquia',
          cep: data.cep || '',
          endereco: data.endereco || data.logradouro || '',
          numero: data.numero || '',
          complemento: data.complemento || '',
          bairro: data.bairro || '',
          cidade: data.cidade || data.localidade || '',
          localidade: data.localidade || data.cidade || '',
          uf: (data.uf || '').toUpperCase(),
          diocese: data.diocese || '',
          telefone: rawTel,
          whatsapp: rawWpp,
          email: data.email || '',
          site: data.site || '',
          instagram: data.instagram || '',
          facebook: data.facebook || '',
          youtube: data.youtube || '',
          fundacao: data.fundacao ? data.fundacao.slice(0, 10) : '',
          assumida_pelos_dehonianos: data.assumida_pelos_dehonianos ? data.assumida_pelos_dehonianos.slice(0, 10) : '',
          status: data.status || 'Ativa',
          token_edicao: data.token_edicao || '',
          historia: data.historia || '',
          resumo_historico: data.resumo_historico || '',
          fotos: Array.isArray(data.fotos) ? data.fotos : [],
          status_historia: data.status_historia || 'Pendente'
        });
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMsg(error.message || 'Erro ao carregar dados da obra.');
      } finally {
        setLoading(false);
      }
    };

    loadObra();
  }, [id, isEditing, searchParams]);

  // Consulta automática de CEP
  const handleCepBlur = async () => {
    const rawCep = form.cep.replace(/\D/g, '');
    if (rawCep.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          endereco: prev.endereco || data.logradouro || '',
          bairro: prev.bairro || data.bairro || '',
          cidade: data.localidade || prev.cidade,
          localidade: data.localidade || prev.localidade,
          uf: data.uf ? data.uf.toUpperCase() : prev.uf
        }));
      }
    } catch {
      // Ignorar falhas silenciosamente
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setErrorMsg('Por favor, informe o nome da obra ou paróquia.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      cep: form.cep.trim() || null,
      endereco: form.endereco.trim() || null,
      numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: (form.cidade || form.localidade).trim() || null,
      localidade: (form.localidade || form.cidade).trim() || null,
      uf: form.uf ? form.uf.trim().toUpperCase() : null,
      diocese: form.diocese.trim() || null,
      telefone: form.telefone.trim() || null,
      whatsapp: form.whatsapp.trim() || form.telefone.trim() || null,
      email: form.email.trim() || null,
      site: form.site.trim() || null,
      instagram: form.instagram.trim() || null,
      facebook: form.facebook.trim() || null,
      youtube: form.youtube.trim() || null,
      fundacao: form.fundacao || null,
      assumida_pelos_dehonianos: form.assumida_pelos_dehonianos || null,
      status: form.status,
      historia: form.historia.trim() || null,
      resumo_historico: form.resumo_historico.trim() || null,
      fotos: form.fotos,
      status_historia: form.status_historia,
    };

    try {
      let saveError: any = null;

      if (isEditing) {
        const res = await supabase
          .from('religiosos_obras_referencia')
          .update(payload)
          .eq('id', id);
        saveError = res.error;
      } else {
        const res = await supabase
          .from('religiosos_obras_referencia')
          .insert([payload]);
        saveError = res.error;
      }

      // Fallback de contingência se a coluna whatsapp ainda não existir no Postgres
      if (saveError && (saveError.message?.toLowerCase().includes('whatsapp') || saveError.code === 'PGRST204')) {
        const fallbackPayload: Record<string, any> = { ...payload };
        delete fallbackPayload.whatsapp;
        if (form.whatsapp?.trim()) {
          const baseTel = form.telefone?.trim();
          fallbackPayload.telefone = baseTel && baseTel !== form.whatsapp.trim()
            ? `${baseTel} | Whats: ${form.whatsapp.trim()}`
            : form.whatsapp.trim();
        }

        if (isEditing) {
          const retryRes = await supabase
            .from('religiosos_obras_referencia')
            .update(fallbackPayload)
            .eq('id', id);
          saveError = retryRes.error;
        } else {
          const retryRes = await supabase
            .from('religiosos_obras_referencia')
            .insert([fallbackPayload]);
          saveError = retryRes.error;
        }
      }

      if (saveError) throw saveError;

      setSuccessMsg('Registro gravado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/obras');
      }, 1000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Erro ao salvar os dados.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 rounded-full animate-spin text-[#0071e3]" />
        <span className="text-xs font-medium text-[#707070] dark:text-[#86868b] tracking-wider uppercase">
          Carregando informações da obra...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Bar with Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/obras')}
            className="w-9 h-9 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Voltar para a listagem"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
              Base Institucional • Província BRM
            </span>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white mt-0.5">
              {isEditing ? `Editar: ${form.nome || 'Obra'}` : 'Cadastrar Nova Obra'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => navigate('/obras')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="obra-form"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Salvar Alterações' : 'Cadastrar Obra'}</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-medium text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs font-medium text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <form id="obra-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Seção 1: Identificação Institucional */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Identificação Institucional</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Nome, classificação e vínculos eclesiásticos</p>
            </div>
          </div>

          {/* Tipo Selector */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Tipo de Presença / Instituição *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {tipoOptions.map(t => {
                const isSelected = form.tipo === t.value;
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, tipo: t.value }))}
                    className={`flex items-start gap-3 p-3.5 border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800/80 text-slate-900 dark:text-white'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className={`p-2 border mt-0.5 shrink-0 ${isSelected ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Nome Oficial da Obra / Paróquia *
              </label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={e => setForm(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Paróquia Sagrado Coração de Jesus"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Diocese / Arquidiocese
              </label>
              <input
                type="text"
                value={form.diocese}
                onChange={e => setForm(prev => ({ ...prev, diocese: e.target.value }))}
                placeholder="Ex: Arquidiocese de Curitiba"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Data de Fundação
              </label>
              <input
                type="date"
                value={form.fundacao}
                onChange={e => setForm(prev => ({ ...prev, fundacao: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Assumida pelos Dehonianos
              </label>
              <input
                type="date"
                value={form.assumida_pelos_dehonianos}
                onChange={e => setForm(prev => ({ ...prev, assumida_pelos_dehonianos: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Status Operacional
              </label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="Ativa">Ativa (Em atividade)</option>
                <option value="Inativa">Inativa (Entregue ou Arquivada)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Seção 2: Localização & Endereço */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Localização & Endereço</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Endereço físico para correspondência e mapas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                CEP (com busca automática)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={9}
                  value={form.cep}
                  onChange={e => setForm(prev => ({ ...prev, cep: e.target.value }))}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs pr-8 font-mono outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
                />
                {buscandoCep && (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Logradouro / Endereço
              </label>
              <input
                type="text"
                value={form.endereco}
                onChange={e => setForm(prev => ({ ...prev, endereco: e.target.value }))}
                placeholder="Rua, Avenida, Praça..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Número
              </label>
              <input
                type="text"
                value={form.numero}
                onChange={e => setForm(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="123 ou S/N"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Complemento
              </label>
              <input
                type="text"
                value={form.complemento}
                onChange={e => setForm(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apto, Sala, Bloco..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Bairro
              </label>
              <input
                type="text"
                value={form.bairro}
                onChange={e => setForm(prev => ({ ...prev, bairro: e.target.value }))}
                placeholder="Centro, Jardim..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Cidade / Município *
              </label>
              <input
                type="text"
                value={form.cidade || form.localidade}
                onChange={e => setForm(prev => ({ ...prev, cidade: e.target.value, localidade: e.target.value }))}
                placeholder="Ex: Curitiba"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Estado (UF) *
              </label>
              <select
                value={form.uf}
                onChange={e => setForm(prev => ({ ...prev, uf: e.target.value }))}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="">Selecione a UF</option>
                {ufList.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Seção 3: Comunicação & Contato */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 border border-sky-200 dark:border-sky-900 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Contatos Oficiais</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Canais diretos de atendimento e secretaria</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Telefone Fixo</label>
              <input
                type="text"
                value={form.telefone}
                onChange={e => setForm(prev => ({ ...prev, telefone: e.target.value }))}
                placeholder="(00) 0000-0000"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs font-mono outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Oficial</span>
              </label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={e => setForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                placeholder="(00) 90000-0000"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs font-mono outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">E-mail Institucional</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="secretaria@paroquia.org.br"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs font-mono outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Website Oficial</label>
              <div className="relative">
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="url"
                  value={form.site}
                  onChange={e => setForm(prev => ({ ...prev, site: e.target.value }))}
                  placeholder="https://..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] pl-9 pr-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Seção 4: Redes Sociais & Presença Digital */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Redes Sociais & Mídias</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Canais de evangelização e comunicação pastoral</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Instagram Oficial</label>
              <input
                type="text"
                value={form.instagram}
                onChange={e => setForm(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="@paroquia ou link"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Facebook</label>
              <input
                type="text"
                value={form.facebook}
                onChange={e => setForm(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="Link da página"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Canal do YouTube</label>
              <input
                type="text"
                value={form.youtube}
                onChange={e => setForm(prev => ({ ...prev, youtube: e.target.value }))}
                placeholder="Link do canal"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-2 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Seção 5: História Oficial & Acervo de 6 Fotos */}
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Memória Histórica & Acervo Fotográfico</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Registro histórico e fotografias preenchidas via formulário de inscrição ou geridas pela Província</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={form.status_historia}
                onChange={e => setForm(prev => ({ ...prev, status_historia: e.target.value }))}
                className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="Pendente">Status: Pendente</option>
                <option value="Preenchido pela Paróquia">Status: Preenchido pela Paróquia</option>
                <option value="Aprovado">Status: Aprovado para o Portal</option>
              </select>

              {isEditing && (
                <a
                  href={`/atualizar-obra/${form.token_edicao || id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Formulário da Paróquia</span>
                </a>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Texto Completo da História
              </label>
              <textarea
                rows={8}
                value={form.historia}
                onChange={e => setForm(prev => ({ ...prev, historia: e.target.value }))}
                placeholder="Histórico detalhado da comunidade, fundação, vigários, dedicação do templo..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] p-3 text-xs leading-relaxed outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Resumo Histórico (para cards rápidos e catálogo)
              </label>
              <textarea
                rows={2}
                value={form.resumo_historico}
                onChange={e => setForm(prev => ({ ...prev, resumo_historico: e.target.value }))}
                placeholder="Breve síntese de 2 a 3 frases..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] p-2.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white text-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Galeria de Fotos Enviadas */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                Acervo de Fotos Enviadas ({form.fotos.filter((f: any) => Boolean(f?.url)).length} de 6 fotos cadastradas):
              </label>

              {form.fotos && form.fotos.some((f: any) => Boolean(f?.url)) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {form.fotos.map((f: any, i: number) => {
                    if (!f?.url) return null;
                    return (
                      <div key={i} className="border border-slate-200 dark:border-slate-800 p-2 space-y-1.5 bg-slate-50 dark:bg-slate-900/40">
                        <div className="aspect-4/3 overflow-hidden bg-slate-200 dark:bg-slate-800">
                          <img src={f.url} alt={f.legenda || `Foto ${i+1}`} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                          {f.tituloSugerido || `Foto ${i+1}`}
                        </span>
                        {f.legenda && (
                          <p className="text-[10px] text-slate-500 truncate" title={f.legenda}>
                            {f.legenda}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                  <p className="text-xs">Nenhuma foto enviada ainda por esta paróquia.</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Envie o link de inscrição para a secretaria paroquial anexar as 6 fotos da igreja.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/obras')}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ← Voltar para listagem
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-medium border border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Salvar Alterações' : 'Concluir Cadastro da Obra'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ObraForm;
