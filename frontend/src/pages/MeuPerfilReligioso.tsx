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
  nome_civil: string;
  nome_religioso: string;
  grau: string;
  data_nascimento: string;
  foto_url: string;
  foto_path: string;
  comunidade_atual_nome: string;
  email_institucional: string;
  whatsapp: string;
  telefone_celular: string;
}

const grausPerfil = ['Dom', 'Padre', 'Diácono', 'Frater', 'Irmão'] as const;

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
  onSaved?: () => void | Promise<void>;
}

export const MeuPerfilReligioso: React.FC<MeuPerfilProps> = ({ isPortal = false, onSaved }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isE2E = import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('brm_e2e_preview') === 'true';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [comunidades, setComunidades] = useState<ComunidadeRef[]>([]);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [form, setForm] = useState<PerfilData>({
    nome_civil: '',
    nome_religioso: '',
    grau: 'Padre',
    data_nascimento: '',
    foto_url: '',
    foto_path: '',
    comunidade_atual_nome: '',
    email_institucional: '',
    whatsapp: '',
    telefone_celular: ''
  });

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

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
            data_nascimento: '1990-01-15',
            foto_url: '',
            foto_path: '',
            comunidade_atual_nome: 'Sede Provincial BRM • Curitiba/PR',
            email_institucional: 'pe.carlos@brm.org.br',
            whatsapp: '(41) 99876-5432',
            telefone_celular: '(41) 99876-5432'
          });
          setLoading(false);
          return;
        }

        if (!user?.id) return;
        const [{ data: authResult, error: authError }, { data: profile, error: profileError }] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('portal_perfis_religiosos')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle(),
        ]);
        if (authError) throw authError;
        if (profileError) throw profileError;

        const metadata = authResult.user?.user_metadata || {};
        let photoUrl = '';
        if (profile?.foto_path) {
          const { data: signedPhoto, error: photoError } = await supabase.storage
            .from('religiosos-perfil')
            .createSignedUrl(profile.foto_path, 60 * 60);
          if (photoError) throw photoError;
          photoUrl = signedPhoto.signedUrl;
        }
        setForm({
          nome_civil: profile?.nome_civil || metadata.nome || user.nome || '',
          nome_religioso: profile?.nome_religioso || '',
          grau: profile?.grau || 'Padre',
          data_nascimento: profile?.data_nascimento || metadata.data_nascimento || '',
          foto_url: photoUrl,
          foto_path: profile?.foto_path || '',
          comunidade_atual_nome: profile?.comunidade_atual_nome || '',
          email_institucional: profile?.email_institucional || authResult.user?.email || user.email || '',
          whatsapp: profile?.whatsapp || '',
          telefone_celular: profile?.telefone_celular || '',
        });
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
        setErrorMsg(err instanceof Error
          ? err.message
          : 'Não foi possível carregar as informações do perfil.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, isE2E]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Escolha uma imagem JPEG, PNG ou WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A foto deve ter no máximo 5 MB.');
      e.target.value = '';
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setPendingPhoto(file);
    setPhotoRemoved(false);
    setPhotoPreview(URL.createObjectURL(file));
    setForm(prev => ({ ...prev, foto_url: '' }));
  };

  const handleRemovePhoto = () => {
    setPendingPhoto(null);
    setPhotoPreview('');
    setPhotoRemoved(true);
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

      if (user?.id) {
        const previousPhotoPath = form.foto_path;
        let nextPhotoPath = previousPhotoPath;
        let nextPhotoUrl = form.foto_url;
        let uploadedPhotoPath: string | null = null;

        if (pendingPhoto) {
          const extensionByType: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/png': 'png',
            'image/webp': 'webp',
          };
          uploadedPhotoPath = `${user.id}/${crypto.randomUUID()}.${extensionByType[pendingPhoto.type]}`;
          const { error: uploadError } = await supabase.storage
            .from('religiosos-perfil')
            .upload(uploadedPhotoPath, pendingPhoto, {
              contentType: pendingPhoto.type,
              upsert: false,
            });
          if (uploadError) throw uploadError;

          const { data: signedPhoto, error: photoError } = await supabase.storage
            .from('religiosos-perfil')
            .createSignedUrl(uploadedPhotoPath, 60 * 60);
          if (photoError) {
            const { error: cleanupError } = await supabase.storage
              .from('religiosos-perfil')
              .remove([uploadedPhotoPath]);
            if (cleanupError) console.error('Falha ao limpar foto não vinculada ao perfil:', cleanupError);
            throw photoError;
          }
          nextPhotoPath = uploadedPhotoPath;
          nextPhotoUrl = signedPhoto.signedUrl;
        } else if (photoRemoved) {
          nextPhotoPath = '';
          nextPhotoUrl = '';
        }

        if (form.data_nascimento) {
          const { error: metaError } = await supabase.auth.updateUser({
            data: {
              nome: form.nome_civil,
              data_nascimento: form.data_nascimento,
            },
          });
          if (metaError) throw metaError;
        }

        const payload: Record<string, unknown> = {
          auth_user_id: user.id,
          nome_civil: form.nome_civil,
          nome_religioso: form.nome_religioso,
          grau: form.grau,
          data_nascimento: form.data_nascimento || null,
          comunidade_atual_nome: form.comunidade_atual_nome,
          email_institucional: form.email_institucional,
          whatsapp: form.whatsapp,
          telefone_celular: form.whatsapp,
          atualizado_em: new Date().toISOString()
        };
        if (pendingPhoto || photoRemoved) {
          payload.foto_path = nextPhotoPath || null;
        }

        const { error } = await supabase
          .from('portal_perfis_religiosos')
          .upsert(payload, { onConflict: 'auth_user_id' });

        if (error) {
          if (uploadedPhotoPath) {
            const { error: cleanupError } = await supabase.storage
              .from('religiosos-perfil')
              .remove([uploadedPhotoPath]);
            if (cleanupError) console.error('Falha ao limpar foto não vinculada ao perfil:', cleanupError);
          }
          throw error;
        }

        setForm(prev => ({ ...prev, foto_path: nextPhotoPath, foto_url: nextPhotoUrl }));
        setPendingPhoto(null);
        setPhotoPreview('');
        setPhotoRemoved(false);

        if ((pendingPhoto || photoRemoved) && previousPhotoPath) {
          const { error: removeError } = await supabase.storage
            .from('religiosos-perfil')
            .remove([previousPhotoPath]);
          if (removeError) {
            console.error('Falha ao remover a foto anterior do perfil:', removeError);
            throw new Error('Perfil salvo, mas não foi possível remover a foto anterior. Tente novamente ou contacte o suporte.');
          }
        }
      } else {
        throw new Error('Entre na sua conta para salvar as informações do perfil.');
      }

      setSuccessMsg('Perfil pessoal atualizado com sucesso.');
      await onSaved?.();
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: unknown) {
      console.error('Erro ao salvar perfil:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao salvar perfil. Tente novamente.');
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
  const gradeOptions: string[] = [...grausPerfil];
  if (form.grau && !gradeOptions.includes(form.grau)) gradeOptions.push(form.grau);

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
              {(photoPreview || form.foto_url) ? (
                <img src={photoPreview || form.foto_url} alt="Foto do perfil" className="w-full h-full object-cover" />
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
              accept="image/jpeg,image/png,image/webp"
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
              {form.nome_civil || 'Meu Perfil'}
            </h1>
            {form.nome_religioso && <p className={isPortal
              ? "text-sm font-normal text-[#707070] dark:text-[#a1a1a6]"
              : "text-sm font-normal text-slate-600 dark:text-slate-300"
            }>
              {form.nome_religioso} · {form.grau || 'Religioso SCJ'}
            </p>}
            <p className={
              isPortal
                ? "text-xs text-[#707070] dark:text-[#86868b]"
                : "text-xs text-slate-500 dark:text-slate-400 font-sans"
            }>
              Gerencie suas informações essenciais de identificação, comunidade e contatos de segurança.
            </p>

            {(photoPreview || form.foto_url) && (
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
                maxLength={160}
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
                maxLength={160}
                value={form.nome_religioso}
                onChange={e => setForm({ ...form, nome_religioso: e.target.value })}
                placeholder="Ex: Pe. Carlos Eduardo, SCJ"
                className={inputClass}
              />
            </div>

          </div>

          <div className="max-w-sm">
            <label className={labelClass}>Data de nascimento *</label>
            <input
              type="date"
              required
              value={form.data_nascimento}
              onChange={e => setForm({ ...form, data_nascimento: e.target.value })}
              className={inputClass}
            />
            <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`} >
              Essa data é usada apenas para verificação do vínculo com a Ficha Cadastral Oficial.
            </span>
          </div>

          <div className="max-w-sm">
            <label className={labelClass}>Categoria de apresentação</label>
            <select
              value={form.grau}
              onChange={e => setForm({ ...form, grau: e.target.value })}
              className={inputClass}
            >
              {gradeOptions.map(grau => (
                <option key={grau} value={grau}>{grau}</option>
              ))}
            </select>
            <span className={`mt-1 block text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500'}`}>
              Esta categoria é apenas de apresentação do perfil; não altera a Ficha Cadastral Oficial da Província.
            </span>
          </div>

          {/* Comunidade Religiosa Atual */}
          <div>
            <label className={labelClass}>Comunidade Religiosa onde Reside *</label>
            <div className="relative">
              <input
                type="text"
                list="comunidades-list"
                required
                maxLength={240}
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
                  maxLength={254}
                  value={form.email_institucional}
                  onChange={e => setForm({ ...form, email_institucional: e.target.value })}
                  placeholder="confrade@brm.org.br"
                  className={inputClass}
                />
              </div>
              <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`}>
                Contato institucional exibido no perfil. O e-mail de acesso à conta é gerenciado separadamente.
              </span>
            </div>

            {/* WhatsApp (Segurança & Recuperação) */}
            <div>
              <label className={labelClass}>WhatsApp / Celular *</label>
              <input
                type="text"
                required
                maxLength={40}
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: formatPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className={inputClass}
              />
              <span className={`text-[11px] ${isPortal ? 'text-[#707070] dark:text-[#86868b]' : 'text-slate-500 font-mono'} mt-1 block`}>
                Contato de apresentação do perfil; a recuperação de senha usa o e-mail da conta.
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
                Os contatos deste perfil não alteram os dados da Ficha Cadastral Oficial. A recuperação de senha é enviada ao e-mail usado para entrar na conta.
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
