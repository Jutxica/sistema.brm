import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  User, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

interface PerfilData {
  id?: string;
  nome_civil: string;
  nome_religioso: string;
  grau: string;
  foto_url: string;
  comunidade_atual_nome: string;
  email_institucional: string;
  whatsapp: string;
  telefone_celular: string;
}

interface ComunidadeRef {
  id: string;
  nome: string;
  tipo?: string;
  localidade?: string;
  cidade?: string;
  uf?: string;
}

interface MeuPerfilProps {
  isPortal?: boolean;
}

export const MeuPerfilReligioso: React.FC<MeuPerfilProps> = ({ isPortal = false }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [comunidades, setComunidades] = useState<ComunidadeRef[]>([]);
  const [form, setForm] = useState<PerfilData>({
    nome_civil: '',
    nome_religioso: '',
    grau: 'Padre',
    foto_url: '',
    comunidade_atual_nome: '',
    email_institucional: '',
    whatsapp: '',
    telefone_celular: ''
  });

  // Carregar dados básicos do religioso e comunidades oficiais da Província BRM
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        // Buscar comunidades e obras ativas do schema oficial
        const { data: obrasData } = await supabase
          .from('religiosos_obras_referencia')
          .select('id, nome, tipo, localidade, cidade, uf')
          .eq('status', 'Ativa')
          .order('nome');

        if (obrasData && obrasData.length > 0) {
          setComunidades(obrasData);
        }

        if (isE2E) {
          setForm({
            nome_civil: 'Carlos Eduardo da Silva',
            nome_religioso: 'Pe. Carlos Eduardo, SCJ',
            grau: 'Padre',
            foto_url: '',
            comunidade_atual_nome: 'Sede Provincial BRM • Curitiba/PR',
            email_institucional: 'pe.carlos@brm.org.br',
            whatsapp: '(41) 99876-5432',
            telefone_celular: '(41) 99876-5432'
          });
          setLoading(false);
          return;
        }

        let targetId = user?.religiosoId;

        if (!targetId && user?.id) {
          const { data: rel, error } = await supabase
            .from('religiosos')
            .select('id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (error) throw error;
          if (rel) targetId = rel.id;
        }

        if (targetId) {
          const { data: relRecord, error } = await supabase
            .from('religiosos')
            .select('id, nome_civil, nome_religioso, grau, foto_url, comunidade_atual_nome, email_institucional, whatsapp, telefone_celular')
            .eq('id', targetId)
            .eq('auth_user_id', user?.id || '')
            .maybeSingle();
          if (error) throw error;

          if (relRecord) {
            setForm({
              id: relRecord.id,
              nome_civil: relRecord.nome_civil || '',
              nome_religioso: relRecord.nome_religioso || '',
              grau: relRecord.grau || 'Padre',
              foto_url: relRecord.foto_url || '',
              comunidade_atual_nome: relRecord.comunidade_atual_nome || '',
              email_institucional: relRecord.email_institucional || user?.email || '',
              whatsapp: relRecord.whatsapp || '',
              telefone_celular: relRecord.telefone_celular || ''
            });
          } else {
            setErrorMsg('Sua conta ainda não está vinculada a uma ficha da Província. Entre em contato com a Secretaria Provincial.');
          }
        } else {
          setErrorMsg('Sua conta ainda não está vinculada a uma ficha da Província. Entre em contato com a Secretaria Provincial.');
        }
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, isE2E]);

  // Upload da Foto de Perfil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Converte para Base64 preview imediato
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setForm(prev => ({ ...prev, foto_url: result }));
      setSuccessMsg('Foto carregada. Clique em "Salvar Alterações" para confirmar.');
      setTimeout(() => setSuccessMsg(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setForm(prev => ({ ...prev, foto_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setSuccessMsg('Foto removida. Clique em "Salvar Alterações" para confirmar.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Máscara WhatsApp
  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : '';
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Salvar Alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (isE2E) {
        await new Promise(r => setTimeout(r, 600));
        setSuccessMsg('Perfil atualizado com sucesso! As alterações já estão sincronizadas.');
        setTimeout(() => setSuccessMsg(null), 5000);
        setSaving(false);
        return;
      }

      if (form.id && user?.id) {
        const payload: any = {
          nome_civil: form.nome_civil,
          nome_religioso: form.nome_religioso,
          comunidade_atual_nome: form.comunidade_atual_nome,
          email_institucional: form.email_institucional,
          whatsapp: form.whatsapp,
          telefone_celular: form.whatsapp,
          updated_at: new Date().toISOString()
        };

        // Adiciona foto_url se coluna existir
        if (form.foto_url) {
          payload.foto_url = form.foto_url;
        }

        const { error } = await supabase
          .from('religiosos')
          .update(payload)
          .eq('id', form.id)
          .eq('auth_user_id', user.id);

        if (error) {
          // Se falhar por causa da coluna foto_url inexistente, tenta sem foto_url
          if (error.message?.includes('foto_url')) {
            delete payload.foto_url;
            const { error: retryError } = await supabase.from('religiosos').update(payload).eq('id', form.id).eq('auth_user_id', user.id);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      } else {
        throw new Error('Sua ficha não está vinculada à conta autenticada.');
      }

      setSuccessMsg('Perfil atualizado com sucesso! Suas informações de acesso foram sincronizadas.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMsg(err.message || 'Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] w-full py-12">
        <div className="w-8 h-8 rounded-full border-2 border-[#226380]/20 border-t-[#226380] animate-spin" />
        <span className={`text-[12px] font-medium ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-3`}>
          Carregando informações do perfil...
        </span>
      </div>
    );
  }

  const inputClass = isPortal
    ? "w-full rounded-[14px] bg-[#f5f5f7] dark:bg-[#262628] border border-transparent focus:border-[#226380] dark:focus:border-[#A3C3C7] focus:bg-white dark:focus:bg-[#161617] px-4 py-3 text-[14px] text-[#1d1d1f] dark:text-[#f5f5f7] outline-none transition-all placeholder:text-[#86868b]"
    : "w-full rounded-[6px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#226380] focus:ring-1 focus:ring-[#226380] px-3.5 py-2.5 text-xs text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 font-mono";

  const labelClass = isPortal
    ? "block text-[12px] font-medium text-[#707070] dark:text-[#86868b] mb-1.5"
    : "block text-xs font-semibold font-mono text-[#113240] dark:text-slate-300 mb-1";

  return (
    <div className={`w-full max-w-3xl mx-auto space-y-6 ${!isPortal ? 'font-sans' : ''}`}>
      
      {/* CABEÇALHO DO PERFIL */}
      <div className={
        isPortal
          ? "bg-white dark:bg-[#161617] rounded-[28px] border border-[#d6d6d6]/60 dark:border-white/10 p-6 sm:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
          : "bg-white dark:bg-[#161b22] rounded-[6px] border border-slate-200 dark:border-slate-800 border-t-2 border-t-[#226380] p-6 sm:p-8 shadow-[0_1px_3px_rgba(17,50,64,0.03)]"
      }>
        
        <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b ${isPortal ? 'border-[#d6d6d6]/40 dark:border-white/5' : 'border-slate-200 dark:border-slate-800'}`}>
          {/* FOTO / AVATAR COM GESTÃO DE UPLOAD */}
          <div className="relative group shrink-0">
            <div className={
              isPortal
                ? "w-24 h-24 rounded-[22px] bg-[#f5f5f7] dark:bg-[#262628] border-2 border-[#d6d6d6]/80 dark:border-white/10 overflow-hidden flex items-center justify-center shadow-inner"
                : "w-24 h-24 rounded-[6px] bg-[#113240]/5 dark:bg-slate-800 border border-[#A3C3C7]/40 dark:border-slate-700 overflow-hidden flex items-center justify-center"
            }>
              {form.foto_url ? (
                <img src={form.foto_url} alt="Foto do perfil" className="w-full h-full object-cover" />
              ) : (
                <div className={`flex flex-col items-center justify-center ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-[#113240] dark:text-slate-300'}`}>
                  <User className="w-10 h-10 stroke-[1.5]" />
                  <span className={`text-[10px] font-medium mt-1 uppercase tracking-wider ${!isPortal ? 'font-mono' : ''}`}>
                    {form.grau || 'SCJ'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={
                isPortal
                  ? "absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#226380] hover:bg-[#113240] text-white flex items-center justify-center shadow-md transition-transform group-hover:scale-105 cursor-pointer"
                  : "absolute -bottom-2 -right-2 w-7 h-7 rounded-[6px] bg-[#113240] hover:bg-[#226380] dark:bg-white text-white dark:text-slate-900 border border-[#113240] flex items-center justify-center cursor-pointer shadow-sm transition-colors"
              }
              title="Alterar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={
                isPortal
                  ? "text-[11px] font-semibold uppercase tracking-[0.16em] text-[#226380] dark:text-[#A3C3C7]"
                  : "text-[10px] font-semibold uppercase tracking-[0.2em] text-[#226380] font-cinzel"
              }>
                Conta do Confrade • {form.grau || 'Padre'}
              </span>
              <span className={
                isPortal
                  ? "px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#f5f5f7] dark:bg-[#262628] text-[#707070] dark:text-[#86868b] border border-[#d6d6d6]/60 dark:border-white/10"
                  : "px-2 py-0.5 rounded-[4px] text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }>
                Província BRM
              </span>
            </div>

            <h1 className={
              isPortal
                ? "text-2xl font-bold tracking-tight text-[#113240] dark:text-[#f5f5f7]"
                : "text-2xl md:text-3xl font-bold tracking-tight text-[#113240] dark:text-white font-cinzel"
            }>
              {form.nome_religioso || form.nome_civil || 'Meu Perfil'}
            </h1>
            <p className={
              isPortal
                ? "text-xs text-[#707070] dark:text-[#86868b]"
                : "text-xs text-slate-500 dark:text-slate-400 font-sans"
            }>
              Gerencie suas informações essenciais de identificação, comunidade e contatos de segurança.
            </p>

            {form.foto_url && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className={`inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer ${!isPortal ? 'font-mono' : ''}`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remover foto atual</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {successMsg && (
          <div className={
            isPortal
              ? "mt-5 p-4 rounded-[16px] bg-[#e8f5e9] dark:bg-[#152a1b] border border-[#a5d6a7] dark:border-[#2e7d32]/40 text-[#1b5e20] dark:text-[#81c784] text-xs flex items-center gap-3"
              : "mt-5 p-3.5 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3 font-mono"
          }>
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className={
            isPortal
              ? "mt-5 p-4 rounded-[16px] bg-[#ffebee] dark:bg-[#321417] border border-[#ef9a9a] dark:border-rose-900/40 text-[#c62828] dark:text-[#ef9a9a] text-xs flex items-center gap-3"
              : "mt-5 p-3.5 rounded-[6px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-3 font-mono"
          }>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* FORMULÁRIO BÁSICO DE CONTA */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Nome Civil */}
            <div>
              <label className={labelClass}>Nome Civil Completo *</label>
              <input
                type="text"
                required
                value={form.nome_civil}
                onChange={e => setForm({ ...form, nome_civil: e.target.value })}
                placeholder="Ex: Carlos Eduardo da Silva"
                className={inputClass}
              />
            </div>

            {/* Nome Religioso */}
            <div>
              <label className={labelClass}>Nome Religioso / Forma Fraterna *</label>
              <input
                type="text"
                required
                value={form.nome_religioso}
                onChange={e => setForm({ ...form, nome_religioso: e.target.value })}
                placeholder="Ex: Pe. Carlos Eduardo, SCJ"
                className={inputClass}
              />
            </div>

          </div>

          {/* Comunidade Religiosa Atual */}
          <div>
            <label className={labelClass}>Comunidade Religiosa onde Reside *</label>
            <div className="relative">
              <input
                type="text"
                list="comunidades-list"
                required
                value={form.comunidade_atual_nome}
                onChange={e => setForm({ ...form, comunidade_atual_nome: e.target.value })}
                placeholder="Selecione ou digite sua comunidade/convento"
                className={inputClass}
              />
              <datalist id="comunidades-list">
                {comunidades.map(c => {
                  const label = `${c.nome} • ${c.cidade || c.localidade || ''}/${c.uf || ''}`;
                  return <option key={c.id} value={label} />;
                })}
              </datalist>
            </div>
            <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`}>
              Comunidade canônica de atribuição ou residência oficial na Província BRM.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* E-mail Institucional */}
            <div>
              <label className={labelClass}>E-mail Institucional (@brm.org.br) *</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={form.email_institucional}
                  onChange={e => setForm({ ...form, email_institucional: e.target.value })}
                  placeholder="confrade@brm.org.br"
                  className={inputClass}
                />
              </div>
              <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`}>
                Utilizado para login e comunicados da Sede Provincial.
              </span>
            </div>

            {/* WhatsApp (Segurança & Recuperação) */}
            <div>
              <label className={labelClass}>WhatsApp / Celular (Recuperação de Acesso) *</label>
              <input
                type="text"
                required
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
              <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`}>
                Contato verificado para recuperar a conta e receber avisos da Secretaria Provincial.
              </span>
            </div>

          </div>

          {/* CARD DE SEGURANÇA E RECUPERAÇÃO */}
          <div className={
            isPortal
              ? "p-4 rounded-[18px] bg-[#f5f5f7] dark:bg-[#262628] border border-[#d6d6d6]/60 dark:border-white/10 flex items-start gap-3 mt-4"
              : "p-4 rounded-[6px] bg-[#226380]/5 dark:bg-[#226380]/20 border border-[#226380]/20 dark:border-[#226380]/40 flex items-start gap-3 mt-4"
          }>
            <ShieldCheck className="w-5 h-5 text-[#226380] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className={`font-semibold ${isPortal ? 'text-[#1d1d1f] dark:text-[#f5f5f7]' : 'text-[#113240] dark:text-white font-mono'} block`}>
                Segurança & Verificação da Conta
              </span>
              <p className={isPortal ? 'text-[#707070] dark:text-[#86868b] leading-relaxed' : 'text-slate-600 dark:text-slate-400 leading-relaxed font-sans'}>
                Seu e-mail institucional e WhatsApp são os canais oficiais para redefinição de credenciais e comunicações sigilosas. Mantenha-os sempre atualizados.
              </p>
            </div>
          </div>

          {/* BOTÃO DE SALVAMENTO */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className={
                isPortal
                  ? "px-6 py-3 rounded-full bg-[#226380] hover:bg-[#113240] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  : "inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider font-semibold border border-[#113240] bg-[#113240] text-white hover:bg-[#226380] hover:border-[#226380] transition-all cursor-pointer rounded-[6px] shadow-sm disabled:opacity-50"
              }
            >
              {saving ? (
                <>
                  <div className={`w-3.5 h-3.5 ${isPortal ? 'rounded-full' : 'rounded-full'} border-2 border-white/30 border-t-white animate-spin`} />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações do Perfil</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default MeuPerfilReligioso;
