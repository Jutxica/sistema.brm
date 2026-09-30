import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Church, 
  Home, 
  Landmark, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Loader2, 
  RefreshCw, 
  Image as ImageIcon,
  Clock,
  Camera,
  ArrowRight,
  Send,
  Building
} from 'lucide-react';
import { confirmAction, showToast } from '../hooks/useFeedback';
import { supabase } from '../lib/supabaseClient';

// Ícone oficial WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

interface FotoItem {
  id: string;
  slotIndex: number;
  tituloSugerido: string;
  url: string;
  legenda: string;
  nomeArquivo?: string;
  carregando?: boolean;
}

const SLOTS_FOTOS_PADRAO = [
  { id: 'fachada', titulo: '1. Fachada Principal da Igreja', desc: 'Vista externa frontal da Matriz ou fachada principal' },
  { id: 'altar', titulo: '2. Altar-Mor e Presbitério', desc: 'Área celebrativa, retábulo, sacrário e presbitério' },
  { id: 'interior', titulo: '3. Nave / Interior do Templo', desc: 'Visão geral interna a partir da entrada em direção ao altar' },
  { id: 'historica', titulo: '4. Registro Histórico de Época', desc: 'Foto antiga da construção, primeira capela ou pioneiros' },
  { id: 'padroeiro', titulo: '5. Padroeiro(a) ou Arte Sacra', desc: 'Imagem do padroeiro(a), vitral ou detalhe arquitetônico' },
  { id: 'comunidade', titulo: '6. Vida Pastoral / Panorâmica', desc: 'Celebração com a comunidade ou vista externa ampla' }
];

export const AtualizarObraPublico: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isFinalizado, setIsFinalizado] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<string | null>(null);

  // Dados da obra
  const [obraId, setObraId] = useState<string>('');
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('Paróquia');
  const [diocese, setDiocese] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [uf, setUf] = useState('');
  const [fundacao, setFundacao] = useState('');
  const [assumida, setAssumida] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [youtube, setYoutube] = useState('');

  // Seções novas: História e Fotos
  const [historia, setHistoria] = useState('');
  const [resumoHistorico, setResumoHistorico] = useState('');
  const [fotos, setFotos] = useState<FotoItem[]>(
    SLOTS_FOTOS_PADRAO.map((slot, index) => ({
      id: slot.id,
      slotIndex: index,
      tituloSugerido: slot.titulo,
      url: '',
      legenda: '',
      nomeArquivo: ''
    }))
  );

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  // Carregar dados da Obra a partir do token (com fallback para ID)
  useEffect(() => {
    const carregarObra = async () => {
      if (!token) {
        setErrorMsg('Link de acesso inválido ou incompleto.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg(null);

      try {
        // Tenta buscar por token_edicao ou por id
        let query = supabase.from('religiosos_obras_referencia').select('*');
        
        // Verifica se é UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
        if (!isUUID) {
          throw new Error('O código de acesso fornecido possui formato inválido.');
        }

        // Tentar primeiro por token_edicao
        let { data, error } = await query.eq('token_edicao', token).maybeSingle();

        // Se der erro de coluna inexistente ou não encontrar, tenta por ID
        if (!data || error) {
          const fallback = await supabase
            .from('religiosos_obras_referencia')
            .select('*')
            .eq('id', token)
            .maybeSingle();

          if (fallback.data) {
            data = fallback.data;
            error = null;
          }
        }

        if (error || !data) {
          throw new Error('Instituição não encontrada ou link de acesso expirado. Por favor, solicite um novo link à Secretaria Provincial da Província BRM.');
        }

        setObraId(data.id);
        setNome(data.nome || '');
        setTipo(data.tipo || 'Paróquia');
        setDiocese(data.diocese || '');
        setLocalidade(data.localidade || data.cidade || '');
        setUf(data.uf || '');
        setFundacao(data.fundacao ? data.fundacao.slice(0, 10) : '');
        setAssumida(data.assumida_pelos_dehonianos ? data.assumida_pelos_dehonianos.slice(0, 10) : '');
        setEndereco(data.endereco || '');
        setTelefone(data.telefone || '');
        setWhatsapp(data.whatsapp || data.telefone || '');
        setEmail(data.email || '');
        setSite(data.site || '');
        setInstagram(data.instagram || '');
        setFacebook(data.facebook || '');
        setYoutube(data.youtube || '');
        setHistoria(data.historia || '');
        setResumoHistorico(data.resumo_historico || '');

        if (data.status_historia === 'Preenchido pela Paróquia' || data.status_historia === 'Aprovado') {
          setIsFinalizado(true);
        }

        // Restaurar fotos salvas se houver
        if (data.fotos && Array.isArray(data.fotos)) {
          setFotos(prev => {
            return prev.map((slot, index) => {
              const salva = (data.fotos as any[]).find(f => f.slotIndex === index || f.id === slot.id);
              if (salva) {
                return {
                  ...slot,
                  url: salva.url || '',
                  legenda: salva.legenda || '',
                  nomeArquivo: salva.nomeArquivo || ''
                };
              }
              return slot;
            });
          });
        }

        // Se houver rascunho salvo no localStorage para emergências de conexão
        try {
          const draftKey = `rascunho_obra_${data.id}`;
          const rascunho = localStorage.getItem(draftKey);
          if (rascunho) {
            const parsed = JSON.parse(rascunho);
            if (parsed.historia && !data.historia) {
              setHistoria(parsed.historia);
            }
          }
        } catch {
          // ignora
        }

      } catch (err: any) {
        setErrorMsg(err.message || 'Erro ao carregar formulário da paróquia.');
      } finally {
        setLoading(false);
        setTimeout(() => {
          isInitialLoad.current = false;
        }, 1000);
      }
    };

    carregarObra();
  }, [token]);

  // Função central de salvamento
  const salvarDados = useCallback(async (isFinal: boolean = false) => {
    if (!obraId) return;

    setSaving(true);
    setErrorMsg(null);

    const fotosPayload = fotos.map(f => ({
      id: f.id,
      slotIndex: f.slotIndex,
      tituloSugerido: f.tituloSugerido,
      url: f.url,
      legenda: f.legenda,
      nomeArquivo: f.nomeArquivo
    }));

    const updatePayload: Record<string, any> = {
      telefone: telefone.trim() || null,
      whatsapp: whatsapp.trim() || telefone.trim() || null,
      email: email.trim() || null,
      site: site.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
      youtube: youtube.trim() || null,
      endereco: endereco.trim() || null,
      diocese: diocese.trim() || null,
      fundacao: fundacao || null,
      assumida_pelos_dehonianos: assumida || null,
      historia: historia.trim() || null,
      resumo_historico: resumoHistorico.trim() || null,
      fotos: fotosPayload,
    };

    if (isFinal) {
      updatePayload.status_historia = 'Preenchido pela Paróquia';
      updatePayload.data_envio_historia = new Date().toISOString();
    }

    try {
      const { error } = await supabase
        .from('religiosos_obras_referencia')
        .update(updatePayload)
        .eq('id', obraId);

      if (error) {
        // Se a coluna ainda não existir no banco (antes de rodar a migração SQL),
        // salva campos básicos e mantém no localStorage
        console.warn('Aviso ao salvar no banco:', error);
        if (error.message.includes('column') || error.code === '42703') {
          // Salva apenas campos tradicionais
          await supabase
            .from('religiosos_obras_referencia')
            .update({
              telefone: updatePayload.telefone,
              whatsapp: updatePayload.whatsapp,
              email: updatePayload.email,
              site: updatePayload.site,
              instagram: updatePayload.instagram,
              facebook: updatePayload.facebook,
              youtube: updatePayload.youtube,
              endereco: updatePayload.endereco,
              diocese: updatePayload.diocese
            })
            .eq('id', obraId);
        } else {
          throw error;
        }
      }

      // Salva backup local
      try {
        localStorage.setItem(`rascunho_obra_${obraId}`, JSON.stringify({
          historia,
          resumoHistorico,
          fotos: fotosPayload,
          data: new Date().toISOString()
        }));
      } catch {
        // ignora
      }

      const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      setUltimoSalvo(`Salvo às ${agora}`);

      if (isFinal) {
        setIsFinalizado(true);
        setSuccessMsg('História e fotos enviadas com sucesso à Província BRM! Agradecemos imensamente pela colaboração.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  }, [obraId, telefone, whatsapp, email, site, instagram, facebook, youtube, endereco, diocese, fundacao, assumida, historia, resumoHistorico, fotos]);

  // Autosave suave a cada 4 segundos após digitação na história
  useEffect(() => {
    if (isInitialLoad.current || !obraId) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      salvarDados(false);
    }, 3500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [historia, resumoHistorico, salvarDados, obraId]);

  // Upload de arquivo para um slot específico
  const handleUploadFoto = async (index: number, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast.error('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      showToast.warning('A imagem selecionada é muito grande. O limite máximo é de 12 MB.');
      return;
    }

    // Sinalizar carregando no slot
    setFotos(prev => prev.map((f, i) => i === index ? { ...f, carregando: true } : f));

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `obras/${obraId}/slot-${index + 1}-${Date.now()}-${cleanName}`;

      let fotoUrl = '';

      // Tenta upload no bucket obras-fotos
      const { data: upData, error: upError } = await supabase.storage
        .from('obras-fotos')
        .upload(storagePath, file, { upsert: true });

      if (!upError && upData) {
        const { data: urlData } = supabase.storage.from('obras-fotos').getPublicUrl(storagePath);
        fotoUrl = urlData.publicUrl;
      } else {
        // Fallback: upload no bucket religiosos-documentos
        const { data: fbData, error: fbError } = await supabase.storage
          .from('religiosos-documentos')
          .upload(storagePath, file);

        if (!fbError && fbData) {
          const { data: urlFb } = supabase.storage.from('religiosos-documentos').getPublicUrl(storagePath);
          fotoUrl = urlFb.publicUrl;
        } else {
          // Fallback de alta fidelidade: converter para Base64 otimizado
          fotoUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string || '');
            reader.readAsDataURL(file);
          });
        }
      }

      setFotos(prev => prev.map((f, i) => {
        if (i === index) {
          return {
            ...f,
            url: fotoUrl,
            nomeArquivo: file.name,
            carregando: false
          };
        }
        return f;
      }));

      showToast.success('Foto carregada com sucesso.');

      // Salva no banco de dados imediatamente
      setTimeout(() => salvarDados(false), 300);

    } catch (err: any) {
      console.error('Erro no upload da foto:', err);
      showToast.error('Erro ao carregar a imagem. Tente novamente.');
      setFotos(prev => prev.map((f, i) => i === index ? { ...f, carregando: false } : f));
    }
  };

  // Remover foto de um slot
  const handleRemoverFoto = async (index: number) => {
    const confirmed = await confirmAction({
      title: 'Remover Imagem',
      badge: 'Galeria • Registro',
      message: 'Deseja remover esta foto do formulário da obra?',
      confirmLabel: 'Remover Imagem',
      cancelLabel: 'Cancelar',
      tone: 'warning',
      icon: 'alert'
    });
    if (!confirmed) return;

    setFotos(prev => prev.map((f, i) => i === index ? { ...f, url: '', nomeArquivo: '', legenda: '' } : f));
    showToast.info('Foto removida.');
    setTimeout(() => salvarDados(false), 200);
  };

  // Atualizar legenda de um slot
  const handleLegendaChange = (index: number, novaLegenda: string) => {
    setFotos(prev => prev.map((f, i) => i === index ? { ...f, legenda: novaLegenda } : f));
  };

  // Contadores
  const contagemPalavras = historia.trim() ? historia.trim().split(/\s+/).length : 0;
  const fotosEnviadas = fotos.filter(f => Boolean(f.url)).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex flex-col items-center justify-center p-4">
        <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 border-2 border-slate-900 dark:border-white border-t-transparent animate-spin mx-auto" />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-white">Carregando Formulário</h2>
            <p className="text-xs text-slate-500 mt-1">Buscando os registros oficiais da Província BRM...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg && !nome) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] flex flex-col items-center justify-center p-4">
        <div className="border border-red-200 dark:border-red-900/60 bg-white dark:bg-[#161b22] p-8 max-w-md w-full text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Acesso Não Autorizado ou Expirado</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{errorMsg}</p>
          <div className="pt-2">
            <span className="text-[11px] text-slate-400">Província Brasileira Meridional dos Padres Dehonianos (BRM)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#090d13] text-slate-800 dark:text-slate-100 font-sans pb-32">
      {/* HEADER INSTITUCIONAL */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
              {tipo === 'Casa' ? <Home className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : tipo === 'Obra' ? <Landmark className="w-4 h-4 text-slate-700 dark:text-slate-300" /> : <Church className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
            </div>
            <div>
              <span className="text-[10px] uppercase font-cinzel tracking-widest text-slate-400 block font-semibold">
                Província BRM • Secretaria Provincial
              </span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block font-cinzel">
                {nome}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {ultimoSalvo && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 inline-block"></span>
                {ultimoSalvo}
              </span>
            )}
            <button
              type="button"
              onClick={() => salvarDados(false)}
              disabled={saving}
              className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Salvar Rascunho</span>
            </button>
          </div>
        </div>
      </header>

      {/* LEAD INSTITUCIONAL DO DOCUMENTO */}
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-2">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 font-semibold font-cinzel">
              Documento Oficial
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {tipo.toUpperCase()} • {localidade || 'PROVÍNCIA BRM'}{uf ? ` - ${uf}` : ''}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-cinzel">
            {nome}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Formulário oficial para conferência cadastral, redação da memória histórica e acervo de 6 fotografias representativas da comunidade para os arquivos e o portal da Província Brasileira Meridional dos Padres Dehonianos (SCJ).
          </p>
        </div>
      </div>

      {/* FEEDBACK DE SUCESSO / ERRO */}
      {successMsg && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">{successMsg}</span>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-xs text-red-800 dark:text-red-200 font-medium">{errorMsg}</span>
          </div>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 pt-4 space-y-6">

        {/* SEÇÃO 1: REVISÃO DE DADOS CADASTRAIS */}
        <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                01 / CONFERÊNCIA CADASTRAL
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
                Dados Administrativos & Canais Oficiais
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 bg-slate-50 dark:bg-slate-900">
              {localidade} • {uf}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Revise as informações canônicas e os contatos da paróquia. Seus ajustes são gravados automaticamente:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Diocese / Arquidiocese</label>
              <input
                type="text"
                value={diocese}
                onChange={e => setDiocese(e.target.value)}
                placeholder="Ex: Arquidiocese de Curitiba"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Data de Fundação</label>
              <input
                type="date"
                value={fundacao}
                onChange={e => setFundacao(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Assumida pelos Dehonianos</label>
              <input
                type="date"
                value={assumida}
                onChange={e => setAssumida(e.target.value)}
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1 sm:col-span-2 md:col-span-3">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Endereço Completo</label>
              <input
                type="text"
                value={endereco}
                onChange={e => setEndereco(e.target.value)}
                placeholder="Rua, Número, Bairro, CEP..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp Oficial</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="(00) 90000-0000"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs font-mono outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Telefone Fixo / Secretaria</span>
              </label>
              <input
                type="text"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="(00) 0000-0000"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs font-mono outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>E-mail Paroquial</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="secretaria@paroquia.org.br"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={e => setInstagram(e.target.value)}
                placeholder="@paroquia ou link"
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Facebook</label>
              <input
                type="text"
                value={facebook}
                onChange={e => setFacebook(e.target.value)}
                placeholder="facebook.com/..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Portal Web ou YouTube</label>
              <input
                type="text"
                value={site || youtube}
                onChange={e => setSite(e.target.value)}
                placeholder="https://..."
                className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-3 py-1.5 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
              />
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: HISTÓRIA E MEMÓRIA */}
        <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                02 / MEMÓRIA HISTÓRICA
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
                Crônica & Trajetória da Paróquia
              </h2>
            </div>
            <div className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 px-2 py-0.5 bg-slate-50 dark:bg-slate-900">
              {contagemPalavras} palavras • {historia.length} caracteres
            </div>
          </div>

          {/* Diretrizes Editoriais Dignas */}
          <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block font-semibold">
              Roteiro de Registro Histórico Recomendado pela Província:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                <strong className="text-slate-800 dark:text-slate-100 font-semibold block text-[11px]">1. Origens e Fundação:</strong>
                Primeiras capelas, povoadores da localidade, data de ereção canônica da paróquia e padroeiro(a).
              </div>
              <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                <strong className="text-slate-800 dark:text-slate-100 font-semibold block text-[11px]">2. Presença dos Padres Dehonianos (SCJ):</strong>
                Ano de assunção pelos religiosos, primeiros vigários e párocos dehonianos e obras missionárias.
              </div>
              <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                <strong className="text-slate-800 dark:text-slate-100 font-semibold block text-[11px]">3. Construção do Templo Matriz:</strong>
                Etapas da edificação, bênção solene, estilo arquitetônico, altares e reformas históricas.
              </div>
              <div className="border-l-2 border-slate-300 dark:border-slate-700 pl-3">
                <strong className="text-slate-800 dark:text-slate-100 font-semibold block text-[11px]">4. Frutos Pastorais & Comunitários:</strong>
                Vocações religiosas e sacerdotais nascidas na paróquia, movimentos pastorais e celebrações históricas.
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Texto Histórico Integral:
            </label>
            <textarea
              rows={12}
              value={historia}
              onChange={e => setHistoria(e.target.value)}
              placeholder="Redija ou cole aqui a crônica histórica da paróquia ou instituição..."
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] p-3 text-xs leading-relaxed outline-none focus:border-slate-900 dark:focus:border-white font-sans text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Síntese Histórica (opcional — 2 a 3 frases para introdução no portal):
            </label>
            <textarea
              rows={2}
              value={resumoHistorico}
              onChange={e => setResumoHistorico(e.target.value)}
              placeholder="Ex: Fundada em 1924 e assumida pelos Dehonianos em 1935, a Paróquia São José é um centro irradiador de fé e vida pastoral..."
              className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] p-2.5 text-xs leading-relaxed outline-none focus:border-slate-900 dark:focus:border-white"
            />
          </div>
        </section>

        {/* SEÇÃO 3: AS 6 FOTOS DA IGREJA */}
        <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                03 / ACERVO FOTOGRÁFICO OFICIAL
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
                6 Fotografias Oficiais do Templo & Comunidade
              </h2>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 border ${
              fotosEnviadas === 6 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300' 
                : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
            }`}>
              {fotosEnviadas} de 6 fotos registradas
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Envie fotografias com boa iluminação e resolução (formatos JPG ou PNG, até 12 MB). Cada registro possui uma finalidade específica no catálogo provincial:
          </p>

          {/* GRADE COM OS 6 SLOTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {fotos.map((foto, index) => {
              const slotInfo = SLOTS_FOTOS_PADRAO[index] || { titulo: `Foto ${index + 1}`, desc: 'Foto da paróquia' };
              const temFoto = Boolean(foto.url);

              return (
                <div 
                  key={foto.id || index}
                  className="border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        REGISTRO 0{index + 1}
                      </span>
                      {temFoto && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400"></span>
                          Anexada
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {slotInfo.titulo.replace(/^[0-9]+\.\s*/, '')}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {slotInfo.desc}
                    </p>
                  </div>

                  {/* ÁREA DE PREVIEW OU UPLOAD */}
                  <div className="relative aspect-4/3 w-full border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] flex items-center justify-center overflow-hidden group">
                    {foto.carregando ? (
                      <div className="flex flex-col items-center gap-2 p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                        <span className="text-[10px] font-mono text-slate-500">Gravando fotografia...</span>
                      </div>
                    ) : temFoto ? (
                      <>
                        <img 
                          src={foto.url} 
                          alt={foto.legenda || slotInfo.titulo}
                          className="w-full h-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[index]?.click()}
                            className="bg-white text-slate-900 px-2 py-1 text-[11px] font-semibold hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                            title="Substituir fotografia"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Substituir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoverFoto(index)}
                            className="bg-red-600 text-white px-2 py-1 text-[11px] font-semibold hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1"
                            title="Remover fotografia"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remover</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[index]?.click()}
                        className="w-full h-full flex flex-col items-center justify-center p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                      >
                        <Upload className="w-5 h-5 text-slate-400 mb-1.5 stroke-[1.5]" />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                          Anexar Fotografia
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">JPG ou PNG até 12 MB</span>
                      </button>
                    )}

                    <input
                      ref={el => { fileInputRefs.current[index] = el; }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadFoto(index, file);
                        e.target.value = '';
                      }}
                    />
                  </div>

                  {/* CAMPO DE LEGENDA */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[9px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                      Legenda / Ano / Autoria:
                    </label>
                    <input
                      type="text"
                      value={foto.legenda || ''}
                      onChange={e => handleLegendaChange(index, e.target.value)}
                      onBlur={() => salvarDados(false)}
                      placeholder="Ex: Dedicação da Igreja Matriz em 1968"
                      className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#161b22] px-2.5 py-1 text-xs outline-none focus:border-slate-900 dark:focus:border-white"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SEÇÃO 4: AÇÕES FINAIS E ENVIO */}
        <section className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 block">
                04 / TRANSMISSÃO OFICIAL
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-cinzel">
                Finalizar e Encaminhar à Secretaria Provincial
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Ao clicar em Concluir, o status do cadastro será atualizado na Província. Você poderá retornar a esta página a qualquer momento para complementar dados ou fotografias.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => salvarDados(false)}
                disabled={saving}
                className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                Salvar Rascunho
              </button>

              <button
                type="button"
                onClick={() => salvarDados(true)}
                disabled={saving}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-black dark:hover:bg-slate-100 px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Enviar Formulário Oficial</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="mt-12 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800 py-6">
        <p className="font-semibold text-slate-600 dark:text-slate-400">Província Brasileira Meridional dos Padres Dehonianos (BRM)</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Secretaria Provincial • Sistema Integrado de Gestão e Memória Canônica</p>
      </footer>
    </div>
  );
};

export default AtualizarObraPublico;
