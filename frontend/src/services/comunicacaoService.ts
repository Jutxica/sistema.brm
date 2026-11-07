import { supabase } from '../lib/supabaseClient';
import type {
  ComunicacaoPauta,
  ComunicacaoPost,
  ComunicacaoComentario,
  ComunicacaoTarefa,
  ComunicacaoCaptacao,
  ComunicacaoEmailEquipe,
  ComunicacaoBrandAsset,
  ComunicacaoBenchmarking,
  ComunicacaoMetrica,
  ReligiosoConteudo,
  HistoricoConteudoItem,
  ObraResumoComunicacao,
  AniversarianteProvincia,
  ComentarioCaptacao
} from '../types/comunicacao';

// ==========================================
// 1. Pautas
// ==========================================
export async function getPautas(): Promise<ComunicacaoPauta[]> {
  const { data, error } = await supabase
    .from('comunicacao_pautas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Usando mock/fallback para pautas:', error.message);
    return MOCK_PAUTAS;
  }
  return data && data.length > 0 ? (data as ComunicacaoPauta[]) : MOCK_PAUTAS;
}

export async function createPauta(pauta: Partial<ComunicacaoPauta>): Promise<ComunicacaoPauta | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_pautas')
      .insert([pauta])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoPauta;
  } catch {
    // Modo offline
  }

  return {
    id: `pauta-${Date.now()}`,
    titulo: pauta.titulo || 'Nova Pauta',
    area: pauta.area || 'Institucional',
    formato: pauta.formato || 'Carrossel',
    status: pauta.status || 'ideia',
    prioridade: pauta.prioridade || 'media',
    canais: pauta.canais || ['Instagram'],
    criado_por_nome: pauta.criado_por_nome || 'Comunicação BRM',
    data_prevista: pauta.data_prevista || null,
    created_at: new Date().toISOString()
  };
}

export async function updatePauta(id: string, updates: Partial<ComunicacaoPauta>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_pautas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 2. Posts (Produção & Aprovação)
// ==========================================
export async function getPosts(): Promise<ComunicacaoPost[]> {
  const { data, error } = await supabase
    .from('comunicacao_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Usando mock/fallback para posts:', error.message);
    return MOCK_POSTS;
  }
  return data && data.length > 0 ? (data as ComunicacaoPost[]) : MOCK_POSTS;
}

export async function createPost(post: Partial<ComunicacaoPost>): Promise<ComunicacaoPost | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_posts')
      .insert([post])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoPost;
  } catch {
    // Modo offline
  }

  return {
    id: `post-${Date.now()}`,
    titulo: post.titulo || 'Novo Post',
    area: post.area || 'Institucional',
    formato: post.formato || 'Carrossel',
    status: post.status || 'em_producao',
    canais: post.canais || ['Instagram'],
    legenda: post.legenda || '',
    hashtags: post.hashtags || '',
    arte_entregue: post.arte_entregue ?? false,
    texto_entregue: post.texto_entregue ?? false,
    data_cronograma: post.data_cronograma || null,
    horario_agendado: post.horario_agendado || '15:00',
    melhor_horario_sugerido: '15h-18h',
    arquivos_arte: post.arquivos_arte || [
      {
        id: `arte-${Date.now()}-1`,
        nome: 'Card 1',
        url: 'https://images.unsplash.com/photo-1548625361-1959779df34d?auto=format&fit=crop&w=800&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date().toISOString()
  };
}

export async function updatePost(id: string, updates: Partial<ComunicacaoPost>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 3. Comentários (Aprovação)
// ==========================================
export async function getComentarios(postId: string): Promise<ComunicacaoComentario[]> {
  const { data, error } = await supabase
    .from('comunicacao_comentarios')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    return MOCK_COMENTARIOS.filter(c => c.post_id === postId);
  }
  return data as ComunicacaoComentario[];
}

export async function addComentario(comentario: Partial<ComunicacaoComentario>): Promise<ComunicacaoComentario | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_comentarios')
      .insert([comentario])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoComentario;
  } catch {
    // Modo offline
  }

  return {
    id: `com-${Date.now()}`,
    post_id: comentario.post_id || 'post-1',
    autor_nome: comentario.autor_nome || 'Comunicação BRM',
    mensagem: comentario.mensagem || '',
    escopo: comentario.escopo || 'geral',
    slide_numero: comentario.slide_numero,
    resolvido: false,
    created_at: new Date().toISOString()
  };
}

// ==========================================
// 4. Tarefas & Checklists
// ==========================================
export async function getTarefas(): Promise<ComunicacaoTarefa[]> {
  const { data, error } = await supabase
    .from('comunicacao_tarefas')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return MOCK_TAREFAS;
  }
  return data && data.length > 0 ? (data as ComunicacaoTarefa[]) : MOCK_TAREFAS;
}

export async function createTarefa(tarefa: Partial<ComunicacaoTarefa>): Promise<ComunicacaoTarefa | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_tarefas')
      .insert([tarefa])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoTarefa;
  } catch {
    // Modo offline
  }

  return {
    id: `tar-${Date.now()}`,
    titulo: tarefa.titulo || 'Nova Tarefa',
    tipo: tarefa.tipo || 'fazer',
    concluida: false,
    responsavel_nome: tarefa.responsavel_nome,
    data_limite: tarefa.data_limite,
    created_at: new Date().toISOString()
  };
}

export async function toggleTarefa(id: string, concluida: boolean): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_tarefas')
      .update({ concluida, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

export async function deleteTarefa(id: string): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_tarefas')
      .delete()
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 5. Captações
// ==========================================
export async function getCaptacoes(): Promise<ComunicacaoCaptacao[]> {
  const { data, error } = await supabase
    .from('comunicacao_captacoes')
    .select('*')
    .order('data_gravacao', { ascending: true });

  if (error) {
    return MOCK_CAPTACOES;
  }
  return data && data.length > 0 ? (data as ComunicacaoCaptacao[]) : MOCK_CAPTACOES;
}

export async function createCaptacao(captacao: Partial<ComunicacaoCaptacao>): Promise<ComunicacaoCaptacao | null> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_captacoes')
      .insert([captacao])
      .select()
      .single();

    if (!error && data) return data as ComunicacaoCaptacao;
  } catch {
    // Modo offline
  }

  return {
    id: `cap-${Date.now()}`,
    titulo: captacao.titulo || 'Nova Gravação',
    entrevistado_nome: captacao.entrevistado_nome || 'Pe. Provincial',
    data_gravacao: captacao.data_gravacao || new Date().toISOString(),
    duracao: captacao.duracao || '20 min',
    local: captacao.local || 'Cúria Provincial - Sala de Gravações',
    area: captacao.area || 'Institucional',
    situacao: captacao.situacao || 'agendada',
    roteiro: captacao.roteiro || '',
    checklist_equipamentos: captacao.checklist_equipamentos || [
      { item: 'Câmera Principal + Baterias carregadas', checado: true },
      { item: 'Microfone de Lapela sem fio testado', checado: true },
      { item: 'Softbox / Iluminação frontal ligada', checado: false },
      { item: 'Cartão SD com espaço livre', checado: false }
    ],
    conteudos_previstos: captacao.conteudos_previstos || [{ formato: 'Reels', titulo: 'Destaque da fala' }],
    participantes: captacao.participantes || [{ nome: 'Comunicação BRM', email: 'comunicacao@dehonianosbrm.org.br' }],
    tags: captacao.tags || [],
    mencoes: captacao.mencoes || [],
    comentarios: captacao.comentarios || [],
    religioso_id: captacao.religioso_id,
    created_at: new Date().toISOString()
  };
}

export async function addComentarioCaptacao(captacaoId: string, autorNome: string, mensagem: string): Promise<ComentarioCaptacao> {
  const novo: ComentarioCaptacao = {
    id: `com-cap-${Date.now()}`,
    autor_nome: autorNome,
    mensagem,
    created_at: new Date().toISOString()
  };

  try {
    // Tenta atualizar no Supabase se existir
    const { data } = await supabase
      .from('comunicacao_captacoes')
      .select('comentarios')
      .eq('id', captacaoId)
      .maybeSingle();

    if (data) {
      const comsAtuais = Array.isArray(data.comentarios) ? data.comentarios : [];
      await supabase
        .from('comunicacao_captacoes')
        .update({ comentarios: [...comsAtuais, novo], updated_at: new Date().toISOString() })
        .eq('id', captacaoId);
    }
  } catch {
    // Offline
  }

  return novo;
}

export async function updateCaptacao(id: string, updates: Partial<ComunicacaoCaptacao>): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_captacoes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  } catch {
    // Modo offline
  }
  return true;
}

// ==========================================
// 6. Métricas
// ==========================================
export async function getMetricas(): Promise<ComunicacaoMetrica> {
  const { data, error } = await supabase
    .from('comunicacao_metricas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return MOCK_METRICA;
  }
  return data as ComunicacaoMetrica;
}

// ==========================================
// 7. E-mails da Equipe
// ==========================================
export async function getEmailsEquipe(): Promise<ComunicacaoEmailEquipe[]> {
  const { data, error } = await supabase
    .from('comunicacao_emails_equipe')
    .select('*')
    .order('nome', { ascending: true });

  if (error || !data || data.length === 0) {
    return MOCK_EMAILS;
  }
  return data as ComunicacaoEmailEquipe[];
}

// ==========================================
// 8. Brand Assets (Estúdio de Arte)
// ==========================================
const BRAND_ASSETS_STORAGE_KEY = 'brm_comunicacao_brand_assets';

export async function getBrandAssets(): Promise<ComunicacaoBrandAsset[]> {
  try {
    const { data, error } = await supabase
      .from('comunicacao_brand_assets')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as ComunicacaoBrandAsset[];
    }
  } catch {
    // Modo offline
  }

  // Tentar carregar do localStorage para persistência em ambiente local
  if (typeof window !== 'undefined') {
    try {
      const salvo = localStorage.getItem(BRAND_ASSETS_STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(BRAND_ASSETS_STORAGE_KEY, JSON.stringify(MOCK_BRAND_ASSETS));
    } catch {
      // Ignorar erro de localStorage
    }
  }

  return MOCK_BRAND_ASSETS;
}

export async function createBrandAsset(asset: Partial<ComunicacaoBrandAsset>): Promise<ComunicacaoBrandAsset | null> {
  const novo: ComunicacaoBrandAsset = {
    id: `ba-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tipo: asset.tipo || 'logo',
    nome: asset.nome || 'Novo Arquivo',
    valor: asset.valor || '',
    categoria: asset.categoria || 'Geral',
    descricao: asset.descricao || '',
    arquivo_url: asset.arquivo_url || asset.valor,
    psd_ou_vetor_url: asset.psd_ou_vetor_url,
    extensao: asset.extensao || 'png',
    tamanho: asset.tamanho || '1.2 MB',
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('comunicacao_brand_assets')
      .insert([asset])
      .select()
      .single();

    if (!error && data) {
      const res = data as ComunicacaoBrandAsset;
      if (typeof window !== 'undefined') {
        const atual = await getBrandAssets();
        localStorage.setItem(BRAND_ASSETS_STORAGE_KEY, JSON.stringify([res, ...atual.filter(a => a.id !== res.id)]));
      }
      return res;
    }
  } catch {
    // offline
  }

  // Salvar no localStorage local
  if (typeof window !== 'undefined') {
    try {
      const atual = await getBrandAssets();
      const atualizado = [novo, ...atual];
      localStorage.setItem(BRAND_ASSETS_STORAGE_KEY, JSON.stringify(atualizado));
    } catch {
      // Ignorar erro de localStorage
    }
  }

  return novo;
}

export async function deleteBrandAsset(id: string): Promise<boolean> {
  try {
    await supabase
      .from('comunicacao_brand_assets')
      .delete()
      .eq('id', id);
  } catch {
    // offline
  }

  if (typeof window !== 'undefined') {
    try {
      const salvo = localStorage.getItem(BRAND_ASSETS_STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo);
        if (Array.isArray(parsed)) {
          const filtrado = parsed.filter(a => a.id !== id);
          localStorage.setItem(BRAND_ASSETS_STORAGE_KEY, JSON.stringify(filtrado));
        }
      }
    } catch {
      // Ignorar erro de localStorage
    }
  }

  return true;
}

// ==========================================
// 9. Benchmarking
// ==========================================
export async function getBenchmarking(): Promise<ComunicacaoBenchmarking[]> {
  const { data, error } = await supabase
    .from('comunicacao_benchmarking')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    return MOCK_BENCHMARKING;
  }
  return data as ComunicacaoBenchmarking[];
}

// ==========================================
// 10. Inteligência de Religiosos e Obras Reais
// ==========================================

export function extrairRedesSociais(redesTexto?: string | null): { instagram?: string; facebook?: string; youtube?: string } {
  if (!redesTexto) return {};
  const limpo = redesTexto.trim();
  let instagram: string | undefined;
  let facebook: string | undefined;
  let youtube: string | undefined;

  // Instagram match: @usuario ou link instagram.com/usuario
  const instaMatch = limpo.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_\.]+)|@([a-zA-Z0-9_\.]+)/i);
  if (instaMatch) {
    const handle = (instaMatch[1] || instaMatch[2] || '').replace(/^@+/, '');
    if (handle) instagram = `@${handle}`;
  } else if (!limpo.includes(' ') && !limpo.includes('/') && limpo.length > 2) {
    const handle = limpo.replace(/^@+/, '');
    instagram = `@${handle}`;
  }

  // Facebook match
  const fbMatch = limpo.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9_\.]+)/i);
  if (fbMatch) {
    facebook = fbMatch[1];
  }

  // YouTube match
  const ytMatch = limpo.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(@?[a-zA-Z0-9_\.\-]+)/i);
  if (ytMatch) {
    youtube = ytMatch[1];
  }

  return { instagram, facebook, youtube };
}

export async function getReligiososParaConteudo(): Promise<ReligiosoConteudo[]> {
  try {
    const { data: relsData, error: relsError } = await supabase
      .from('religiosos')
      .select('*')
      .order('nome_religioso', { ascending: true });

    if (!relsError && relsData && relsData.length > 0) {
      const ativos = relsData.filter(r => {
        const s = (r.status || '').toLowerCase();
        const se = (r.situacao_elenco || '').toLowerCase();
        return !s.includes('falec') && !se.includes('falec');
      });

      if (ativos.length > 0) {
        // Busca em paralelo todas as tabelas canônicas e de secretaria preenchidas no cadastro público
        const [
          contatosRes,
          votosRes,
          ordensRes,
          ordensFallbackRes,
          origemRes,
          desigRes,
          docsRes,
          familiaresRes,
          sacramentosRes,
          academicaRes,
          idiomasRes
        ] = await Promise.allSettled([
          supabase.from('religiosos_enderecos_contatos').select('*'),
          supabase.from('religiosos_profissoes_votos').select('*').order('data', { ascending: true }),
          supabase.from('religiosos_ministerios_ordens').select('*').order('data', { ascending: true }),
          supabase.from('religiosos_ordens').select('*').order('data', { ascending: true }),
          supabase.from('religiosos_origem_vocacional').select('*'),
          supabase.from('religiosos_designacoes').select('*, comunidades(nome), religiosos_obras_referencia(nome)').order('vigencia_inicio', { ascending: false }),
          supabase.from('religiosos_documentos').select('religioso_id, categoria, nome_arquivo, caminho_storage').eq('status', 'Ativo'),
          supabase.from('religiosos_familiares').select('*'),
          supabase.from('religiosos_sacramentos').select('*'),
          supabase.from('religiosos_formacao_academica').select('*'),
          supabase.from('religiosos_idiomas').select('*')
        ]);

        const contatosData = contatosRes.status === 'fulfilled' && contatosRes.value?.data ? contatosRes.value.data : [];
        const votosData = votosRes.status === 'fulfilled' && votosRes.value?.data ? votosRes.value.data : [];
        const ordensData = ordensRes.status === 'fulfilled' && ordensRes.value?.data ? ordensRes.value.data : [];
        const ordensFallbackData = ordensFallbackRes.status === 'fulfilled' && ordensFallbackRes.value?.data ? ordensFallbackRes.value.data : [];
        const origemData = origemRes.status === 'fulfilled' && origemRes.value?.data ? origemRes.value.data : [];
        const desigData = desigRes.status === 'fulfilled' && desigRes.value?.data ? desigRes.value.data : [];
        const docsData = docsRes.status === 'fulfilled' && docsRes.value?.data ? docsRes.value.data : [];
        const familiaresData = familiaresRes.status === 'fulfilled' && familiaresRes.value?.data ? familiaresRes.value.data : [];
        const sacramentosData = sacramentosRes.status === 'fulfilled' && sacramentosRes.value?.data ? sacramentosRes.value.data : [];
        const academicaData = academicaRes.status === 'fulfilled' && academicaRes.value?.data ? academicaRes.value.data : [];
        const idiomasData = idiomasRes.status === 'fulfilled' && idiomasRes.value?.data ? idiomasRes.value.data : [];

        const allOrdens = [...ordensData, ...ordensFallbackData];

        return ativos.map(r => {
          const contato = contatosData.find(c => c.religioso_id === r.id);
          const votos = votosData.filter(v => v.religioso_id === r.id);
          const ordens = allOrdens.filter(o => o.religioso_id === r.id);
          const origem = origemData.find(o => o.religioso_id === r.id);
          const desig = desigData.find(d => d.religioso_id === r.id);
          const docs = docsData.filter(d => d.religioso_id === r.id);
          const familiares = familiaresData.filter(f => f.religioso_id === r.id);
          const sacramentos = sacramentosData.filter(s => s.religioso_id === r.id);
          const academicas = academicaData.filter(a => a.religioso_id === r.id).map(a => ({
            curso: a.categoria || (a as any).curso || 'Curso Superior',
            instituicao: a.instituicao,
            periodo: a.periodo
          }));
          const idiomas = idiomasData.filter(i => i.religioso_id === r.id).map(i => ({
            idioma: i.idioma,
            nivel: i.nivel
          }));

          // Filiação
          const pai = familiares.find(f => f.tipo === 'Pai')?.nome || null;
          const mae = familiares.find(f => f.tipo === 'Mãe')?.nome || null;

          // Sacramentos
          const batismo = sacramentos.find(s => (s.tipo || '').toLowerCase().includes('batis'));
          const crisma = sacramentos.find(s => (s.tipo || '').toLowerCase().includes('cris') || (s.tipo || '').toLowerCase().includes('confirm'));
          const batismoInfo = batismo ? [batismo.data, batismo.paroquia, batismo.cidade ? `${batismo.cidade}${batismo.uf ? `/${batismo.uf}` : ''}` : null].filter(Boolean).join(' • ') : null;
          const crismaInfo = crisma ? [crisma.data, crisma.paroquia, crisma.cidade ? `${crisma.cidade}${crisma.uf ? `/${crisma.uf}` : ''}` : null].filter(Boolean).join(' • ') : null;

          // Votos e Profissões Religiosas
          const primVoto = votos.find(v => {
            const t = (v.tipo_voto || v.tipo || '').toLowerCase();
            return t.includes('primeir') || t.includes('tempor');
          });
          const perpVoto = votos.find(v => {
            const t = (v.tipo_voto || v.tipo || '').toLowerCase();
            return t.includes('perp');
          });

          // Ministérios e Ordens Sacras
          const ordDiac = ordens.find(o => {
            const t = (o.tipo_ministerio_ordem || o.ministerio || o.tipo || '').toLowerCase();
            return t.includes('diac');
          });
          const ordPresb = ordens.find(o => {
            const t = (o.tipo_ministerio_ordem || o.ministerio || o.tipo || '').toLowerCase();
            return t.includes('presb') || t.includes('sacerd');
          });
          const ordEpisc = ordens.find(o => {
            const t = (o.tipo_ministerio_ordem || o.ministerio || o.tipo || '').toLowerCase();
            return t.includes('episc') || t.includes('bispo');
          });

          // Determina data e lema
          const ordenacaoData = ordPresb?.data || ordDiac?.data || ordEpisc?.data || r.data_ordenacao_presbiteral || r.ordenacao_data || null;
          const primeiraProfissaoData = primVoto?.data || r.data_primeira_profissao || r.data_primeiros_votos || null;
          const votosPerpetuosData = perpVoto?.data || r.data_profissao_perpetua || r.profissao_perpetua_data || null;

          const lemaDestacado = ordPresb?.lema || ordDiac?.lema || perpVoto?.lema || primVoto?.lema || origem?.lema || origem?.lema_vida || r.lema_destacado || r.lema_ordenacao_presbiteral || 'Ecce Venio — Eis que venho para fazer a tua vontade';

          // Naturalidade REAL (estritamente do registro de nascimento, NUNCA o endereço de moradia atual)
          const naturalidadeCidade = r.municipio_nascimento || r.naturalidade_cidade || r.local_nascimento || r.cidade_natal || null;
          const naturalidadeUf = r.estado_nascimento || r.naturalidade_uf || r.uf_natal || null;
          const paisNascimento = r.pais_nascimento || 'Brasil';
          const localNascimento = r.local_nascimento || null;
          const nacionalidade = r.nacionalidade || 'Brasileira';

          // Contatos e Redes Sociais
          const redesTexto = contato?.redes_sociais || (r as any).redes_sociais || null;
          const { instagram, facebook, youtube } = extrairRedesSociais(redesTexto);

          const email = contato?.email || r.email_institucional || r.email_pessoal || 'comunicacao@dehonianosbrm.org.br';
          const celular = contato?.celular || contato?.telefone || r.telefone_celular || null;
          const whatsapp = contato?.whatsapp || contato?.celular || r.telefone_whatsapp || r.telefone_celular || null;

          // Comunidade e Ofício atual
          const comObj = desig?.comunidades;
          const comNome = Array.isArray(comObj) ? (comObj[0] as any)?.nome : (comObj as any)?.nome;
          const obrObj = desig?.religiosos_obras_referencia;
          const obrNome = Array.isArray(obrObj) ? (obrObj[0] as any)?.nome : (obrObj as any)?.nome;

          const comunidadeAtual = comNome || obrNome || r.comunidade_atual_nome || 'Província BRM';
          const obraAtual = obrNome || comNome || r.obra_atual_nome || 'Província BRM';
          const cargoFuncao = desig?.funcao || r.cargo_funcao || r.cargo || r.funcao || r.oficio_atual || (r.grau === 'Diácono' ? 'Diácono Dehoniano' : r.grau === 'Frater' ? 'Frater Dehoniano' : 'Religioso Dehoniano');

          // Foto oficial: busca primeiro nos documentos de perfil do religioso
          const docFoto = docs.find(d => {
            const cat = (d.categoria || '').toLowerCase();
            const nome = (d.nome_arquivo || '').toLowerCase();
            return cat.includes('perfil') || cat.includes('foto') || cat.includes('4x4') || /\.(jpe?g|png|webp)$/i.test(nome);
          });

          const rawFoto = r.foto_path || (r as any).foto_url || docFoto?.caminho_storage || null;
          let fotoUrl: string | null = null;

          if (rawFoto && typeof rawFoto === 'string' && rawFoto.trim()) {
            if (rawFoto.startsWith('http://') || rawFoto.startsWith('https://') || rawFoto.startsWith('data:image/')) {
              fotoUrl = rawFoto;
            } else {
              // Tenta primeiro bucket oficial 'religiosos-documentos' (onde são salvos os uploads da secretaria)
              const { data: pDoc } = supabase.storage.from('religiosos-documentos').getPublicUrl(rawFoto);
              if (pDoc?.publicUrl) {
                fotoUrl = pDoc.publicUrl;
              }
            }
          }

          const biografia = r.biografia || r.historico || r.observacoes || `${r.nome_religioso || r.nome_civil} é religioso consagrado da Província Brasil Meridional dos Padres Dehonianos (SCJ), atuando na evangelização, espiritualidade e obras pastorais da congregação.`;

          const todosLemas = Array.isArray(r.lemas) ? r.lemas : [];

          return {
            id: r.id,
            nome_religioso: r.nome_religioso || r.nome_civil || 'Religioso SCJ',
            nome_civil: r.nome_civil || '',
            grau: r.grau || 'Presbítero',
            data_nascimento: r.data_nascimento || null,
            naturalidade_cidade: naturalidadeCidade,
            naturalidade_uf: naturalidadeUf,
            pais_nascimento: paisNascimento,
            local_nascimento: localNascimento,
            nacionalidade: nacionalidade,
            filiacao_pai: pai,
            filiacao_mae: mae,
            batismo_info: batismoInfo,
            crisma_info: crismaInfo,
            etapa_formativa_atual: r.etapa_formativa_atual || (r.grau === 'Frater' ? 'Configuração (Teologia)' : null),
            ano_configuracao: r.ano_configuracao || null,
            formacao_academica: academicas,
            idiomas: idiomas,
            todos_lemas: todosLemas,
            primeira_profissao_data: primeiraProfissaoData,
            profissao_perpetua_data: votosPerpetuosData,
            ordenacao_diaconal_data: ordDiac?.data || null,
            ordenacao_presbiteral_data: ordPresb?.data || null,
            ordenacao_episcopal_data: ordEpisc?.data || null,
            ordenacao_data: ordenacaoData,
            ordenacao_local: ordPresb?.local || ordDiac?.local || null,
            ordenacao_bispo: ordPresb?.bispo_ordenante || ordDiac?.bispo_ordenante || null,
            profissao_local: perpVoto?.local || primVoto?.local || null,
            profissao_celebrante: perpVoto?.celebrante || primVoto?.celebrante || null,
            paroquia_origem: origem?.paroquia_origem || null,
            diocese_origem: origem?.diocese_origem || null,
            promotor_vocacional: origem?.promotor_vocacional || null,
            comunidade_atual_nome: comunidadeAtual,
            obra_atual_nome: obraAtual,
            diocese_atual: r.diocese || r.diocese_atual || null,
            cargo_funcao: cargoFuncao,
            foto_path: rawFoto,
            foto_url: fotoUrl,
            lema_destacado: lemaDestacado,
            lema_destacado_fase: ordPresb ? 'Ordenação Presbiteral' : ordDiac ? 'Ordenação Diaconal' : perpVoto ? 'Profissão Perpétua' : 'Vida Religiosa',
            email_institucional: email,
            telefone_celular: celular,
            telefone_whatsapp: whatsapp,
            redes_sociais: redesTexto,
            instagram: instagram,
            facebook: facebook,
            youtube: youtube,
            biografia: biografia
          };
        });
      }
    }
  } catch (err) {
    console.warn('[comunicacaoService] Erro ao buscar dados completos dos religiosos:', err);
  }

  return SEED_RELIGIOSOS_CONTEUDO;
}

export async function getObrasParaComunicacao(): Promise<ObraResumoComunicacao[]> {
  try {
    // Busca na tabela canônica do sistema: religiosos_obras_referencia
    const { data: obrasRef, error } = await supabase
      .from('religiosos_obras_referencia')
      .select('id, nome, tipo, cidade, estado')
      .order('nome', { ascending: true });

    if (!error && obrasRef && obrasRef.length > 0) {
      return obrasRef.map(o => ({
        id: o.id,
        nome: o.nome,
        tipo: o.tipo || 'Obra',
        cidade: o.cidade || '',
        uf: o.estado || ''
      }));
    }

    // Fallback para comunidades
    const { data: coms } = await supabase
      .from('comunidades')
      .select('id, nome, regiao')
      .order('nome', { ascending: true });

    if (coms && coms.length > 0) {
      return coms.map(c => ({
        id: c.id,
        nome: c.nome,
        tipo: 'Comunidade Religiosa',
        cidade: c.regiao || '',
        uf: 'SC'
      }));
    }
  } catch (err) {
    console.warn('[comunicacaoService] Erro ao buscar obras do banco:', err);
  }

  return SEED_OBRAS_COMUNICACAO;
}

export function getHistoricoConteudoReligioso(
  religiosoId: string,
  religiosoNome: string,
  posts: ComunicacaoPost[] = [],
  captacoes: ComunicacaoCaptacao[] = [],
  pautas: ComunicacaoPauta[] = []
): HistoricoConteudoItem[] {
  const lista: HistoricoConteudoItem[] = [];
  const nomeLower = (religiosoNome || '').toLowerCase().trim();

  posts.forEach(p => {
    const bateId = p.religioso_id === religiosoId;
    const bateNome = Boolean(nomeLower && p.religioso_nome && p.religioso_nome.toLowerCase().includes(nomeLower));
    const bateTitulo = Boolean(nomeLower && p.titulo.toLowerCase().includes(nomeLower));
    if (bateId || bateNome || bateTitulo) {
      const imgUrl = p.arquivos_arte && p.arquivos_arte[0]?.url;
      lista.push({
        id: p.id,
        tipo: 'post',
        titulo: p.titulo,
        formato: p.formato,
        data: p.data_cronograma || p.created_at,
        status: p.status === 'postado' ? 'Publicado' : p.status === 'aprovado' ? 'Aprovado' : 'Em produção',
        url: imgUrl,
        imagem_url: imgUrl
      });
    }
  });

  captacoes.forEach(c => {
    const bateId = c.religioso_id === religiosoId;
    const bateNome = Boolean(nomeLower && c.entrevistado_nome && c.entrevistado_nome.toLowerCase().includes(nomeLower));
    if (bateId || bateNome) {
      lista.push({
        id: c.id,
        tipo: 'captacao',
        titulo: c.titulo,
        formato: 'Gravação de Vídeo',
        data: c.data_gravacao,
        status: c.situacao === 'gravada' ? 'Gravada' : 'Agendada'
      });
    }
  });

  pautas.forEach(pt => {
    const bateId = pt.religioso_id === religiosoId;
    const bateNome = Boolean(nomeLower && pt.religioso_nome && pt.religioso_nome.toLowerCase().includes(nomeLower));
    if (bateId || bateNome) {
      lista.push({
        id: pt.id,
        tipo: 'pauta',
        titulo: pt.titulo,
        formato: pt.formato,
        data: pt.data_prevista || pt.created_at,
        status: 'Ideia em pauta'
      });
    }
  });

  return lista.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export async function getReligiososAniversariantes(mesDesejado?: number): Promise<AniversarianteProvincia[]> {
  const currentMonth = typeof mesDesejado === 'number' ? mesDesejado : new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  try {
    const { data, error } = await supabase
      .from('religiosos')
      .select('*');

    if (!error && data && data.length > 0) {
      const lista: AniversarianteProvincia[] = [];

      data.forEach(r => {
        const nome = r.nome_religioso || r.nome_civil || 'Religioso SCJ';

        // Aniversário natalício
        if (r.data_nascimento) {
          const raw = String(r.data_nascimento);
          const parts = raw.split(/[-/]/);
          let dia = 0;
          let mes = 0;
          if (parts.length >= 3) {
            if (parts[0].length === 4) {
              mes = parseInt(parts[1], 10);
              dia = parseInt(parts[2].slice(0, 2), 10);
            } else {
              dia = parseInt(parts[0], 10);
              mes = parseInt(parts[1], 10);
            }
          }

          if (mes === currentMonth && dia > 0) {
            lista.push({
              id: `aniv-${r.id}`,
              religioso_id: r.id,
              nome,
              dia,
              mes: currentMonth,
              tipo: 'natalicio',
              comunidade: r.comunidade_atual_nome,
              obra: r.obra_atual_nome,
              foto_url: r.foto_path
            });
          }
        }

        // Jubileu de ordenação presbiteral
        const dataOrd = r.data_ordenacao_presbiteral || r.ordenacao_data;
        if (dataOrd) {
          const raw = String(dataOrd);
          const parts = raw.split(/[-/]/);
          let dia = 0;
          let mes = 0;
          let ano = 0;
          if (parts.length >= 3) {
            if (parts[0].length === 4) {
              ano = parseInt(parts[0], 10);
              mes = parseInt(parts[1], 10);
              dia = parseInt(parts[2].slice(0, 2), 10);
            } else {
              dia = parseInt(parts[0], 10);
              mes = parseInt(parts[1], 10);
              ano = parseInt(parts[2].slice(0, 4), 10);
            }
          }

          if (mes === currentMonth && dia > 0 && ano > 0) {
            const anos = currentYear - ano;
            lista.push({
              id: `jub-${r.id}`,
              religioso_id: r.id,
              nome,
              dia,
              mes: currentMonth,
              tipo: 'ordenacao',
              anos,
              comunidade: r.comunidade_atual_nome,
              obra: r.obra_atual_nome,
              foto_url: r.foto_path
            });
          }
        }
      });

      if (lista.length > 0) {
        return lista.sort((a, b) => a.dia - b.dia);
      }
    }
  } catch (e) {
    console.warn('[comunicacaoService] Erro ao processar aniversariantes reais:', e);
  }

  // Fallback com confrades reais da Província BRM
  return MOCK_ANIVERSARIANTES.map(m => ({
    id: m.id,
    religioso_id: m.id,
    nome: m.nome,
    dia: m.dia,
    mes: m.mes,
    tipo: m.tipo,
    anos: m.anos,
    comunidade: m.comunidade
  }));
}

// ==========================================
// DADOS DE FALLBACK (MOCK ROBUSTO)
// ==========================================

const MOCK_PAUTAS: ComunicacaoPauta[] = [
  {
    id: 'pauta-1',
    titulo: 'Venerável Pe. Dehon e a reparação ao Coração de Jesus no cotidiano',
    area: 'Espiritualidade',
    formato: 'Carrossel',
    status: 'ideia',
    prioridade: 'alta',
    canais: ['Instagram', 'Facebook'],
    criado_por_nome: 'Comunicação BRM',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-2',
    titulo: 'Como ingressar no Seminário Dehoniano: as 4 etapas de discernimento',
    area: 'Vocacional',
    formato: 'Reels',
    status: 'ideia',
    prioridade: 'alta',
    canais: ['Instagram', 'YouTube'],
    criado_por_nome: 'Comunicação BRM',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-3',
    titulo: 'Reforma do Santuário Sagrado Coração de Jesus em Joinville',
    area: 'Paróquias',
    formato: 'Post',
    status: 'ideia',
    prioridade: 'media',
    canais: ['Instagram', 'Site'],
    criado_por_nome: 'Comunicação BRM',
    created_at: new Date().toISOString()
  },
  {
    id: 'pauta-4',
    titulo: 'Obras sociais Dehonianas que impactam centenas de famílias no Sul',
    area: 'Obras Sociais',
    formato: 'Carrossel',
    status: 'ideia',
    prioridade: 'media',
    canais: ['Instagram', 'Site'],
    criado_por_nome: 'Comunicação BRM',
    created_at: new Date().toISOString()
  }
];

const MOCK_POSTS: ComunicacaoPost[] = [
  {
    id: 'post-1',
    titulo: 'A história dos 100 anos de presença Dehoniana no Brasil Meridional',
    legenda: 'Um século semeando o Amor do Coração de Jesus. Conheça como os primeiros padres dehonianos chegaram e fundaram as primeiras obras que hoje acolhem milhares de fiéis.',
    hashtags: '#DehonianosBRM #PadreDehon #IgrejaCatolica #VidaConsagrada',
    area: 'Institucional',
    formato: 'Carrossel',
    canais: ['Instagram', 'Facebook'],
    status: 'aprovacao',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-11-14T15:00:00Z',
    horario_agendado: '15:00',
    melhor_horario_sugerido: '15h-18h',
    arquivos_arte: [
      {
        id: 'art-1',
        nome: 'Slide 1 - Capa Centenário',
        url: 'https://images.unsplash.com/photo-1548625361-195fe57877e1?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1,
        psd_url: 'https://getartcraft.com/sample.psd'
      },
      {
        id: 'art-2',
        nome: 'Slide 2 - A Chegada ao Sul',
        url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 2
      },
      {
        id: 'art-3',
        nome: 'Slide 3 - Primeiras Paróquias',
        url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 3
      },
      {
        id: 'art-4',
        nome: 'Slide 4 - O Legado Atual',
        url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 4
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'post-2',
    titulo: '04 livros de Pe. Dehon para aprofundar sua vida de oração',
    legenda: 'Quer transformar sua relação com Deus? O Venerável Pe. Dehon deixou um rico itinerário de espiritualidade centrada no Coração de Jesus. Salve este post para consultar depois!',
    hashtags: '#LivrosCatolicos #PadreDehon #Espiritualidade',
    area: 'Espiritualidade',
    formato: 'Reels',
    canais: ['Instagram'],
    status: 'aprovacao',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-11-16T18:00:00Z',
    horario_agendado: '18:00',
    melhor_horario_sugerido: '18h-21h',
    arquivos_arte: [
      {
        id: 'art-5',
        nome: 'Capa do Reels',
        url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date().toISOString()
  },
  {
    id: 'post-3',
    titulo: 'Missa em Ação de Graças pelas Vocações Sacerdotais',
    legenda: 'Neste próximo domingo, rezemos juntos por todas as vocações e pelos jovens que estão nos seminários da Província BRM.',
    area: 'Vocacional',
    formato: 'Post',
    canais: ['Instagram', 'Facebook', 'Site'],
    status: 'postado',
    arte_entregue: true,
    texto_entregue: true,
    data_cronograma: '2026-10-30T14:57:00Z',
    arquivos_arte: [
      {
        id: 'art-6',
        nome: 'Card de Missa',
        url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=800&auto=format&fit=crop&q=80',
        tipo: 'imagem',
        ordem: 1
      }
    ],
    created_at: new Date(Date.now() - 7 * 86400000).toISOString()
  }
];

const MOCK_COMENTARIOS: ComunicacaoComentario[] = [
  {
    id: 'com-1',
    post_id: 'post-1',
    autor_nome: 'Pe. Coordenador',
    escopo: 'slide_2',
    slide_numero: 2,
    mensagem: 'Na lâmina 2, conferir se a data correta da primeira fundação foi 1903 ou 1904. Excelente escolha de fotos!',
    resolvido: false,
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

const MOCK_TAREFAS: ComunicacaoTarefa[] = [
  {
    id: 't-1',
    titulo: 'Produzir o layout do carrossel do Centenário no PhotoCraft',
    concluida: false,
    tipo: 'fazer',
    responsavel_nome: 'Designer',
    data_limite: '2026-11-10',
    created_at: new Date().toISOString()
  },
  {
    id: 't-2',
    titulo: 'Revisar legendas e conferir datas históricas com o arquivo da Cúria',
    concluida: true,
    tipo: 'fazer',
    responsavel_nome: 'Comunicação BRM',
    data_limite: '2026-11-04',
    created_at: new Date().toISOString()
  },
  {
    id: 't-3',
    titulo: 'Fazer ensaio fotográfico dos novos postulantes em Corupá',
    concluida: false,
    tipo: 'ideia',
    responsavel_nome: 'Comunicação BRM',
    created_at: new Date().toISOString()
  }
];

const MOCK_CAPTACOES: ComunicacaoCaptacao[] = [
  {
    id: 'cap-1',
    titulo: 'Depoimento sobre o discernimento vocacional e vida de oração',
    entrevistado_nome: 'Pe. Provincial',
    data_gravacao: '2026-11-10T14:00:00Z',
    duracao: '1h',
    local: 'Cúria Provincial - Sala de Gravações',
    area: 'Vocacional',
    situacao: 'agendada',
    roteiro: '1. Acolhida e oração inicial\n2. Como foi sentir o chamado dehoniano aos 17 anos\n3. O que a juventude busca hoje na Igreja\n4. Mensagem aos que sentem o coração inquieto',
    checklist_equipamentos: [
      { item: 'Microfone sem fio Lapela com baterias reservas', checado: true },
      { item: 'Câmera principal 4K configurada em 30fps', checado: true },
      { item: 'Cartão SD de alta velocidade formatado', checado: true },
      { item: 'Luz principal Key Light e preenchimento ligadas', checado: false },
      { item: 'Tripé com cabeça fluida regulado na altura dos olhos', checado: false },
      { item: 'iPad / Celular pronto no modo Teleprompter', checado: false }
    ],
    conteudos_previstos: [
      { formato: 'Reels', titulo: 'O momento em que decidi ser padre Dehoniano' },
      { formato: 'Vídeo Longo', titulo: 'Mensagem Vocacional Completa' }
    ],
    participantes: [
      { nome: 'Comunicação BRM', email: 'comunicacao@dehonianosbrm.org.br' }
    ],
    created_at: new Date().toISOString()
  }
];

const MOCK_METRICA: ComunicacaoMetrica = {
  id: 'met-1',
  canal: 'Instagram',
  data_referencia: new Date().toISOString().split('T')[0],
  seguidores_total: 12450,
  seguidores_novos: 142,
  seguidores_deixaram: 18,
  contas_alcancadas: 48500,
  alcance_variacao_pct: 29.4,
  engajamento_pct: 10.5,
  interacoes_total: 3890,
  visualizacoes_total: 84200,
  posts_por_horario: {
    '06h-09h': { media: 2051, total: 7 },
    '09h-12h': { media: 2462, total: 7 },
    '12h-15h': { media: 1277, total: 28 },
    '15h-18h': { media: 2494, total: 17 },
    '18h-21h': { media: 2150, total: 6 },
    '21h-00h': { media: 0, total: 0 }
  },
  dias_mais_ativos: {
    'Domingo': 0,
    'Segunda': 12,
    'Terça': 13,
    'Quarta': 15,
    'Quinta': 13,
    'Sexta': 11,
    'Sábado': 1
  },
  horarios_pico_meta: [
    { dia: 'Domingo', horario: '21:00', descricao: 'pico de seguidores ativos na semana' },
    { dia: 'Quarta', horario: '17:00', descricao: 'pico de seguidores ativos na semana' },
    { dia: 'Domingo', horario: '13:00', descricao: 'pico de seguidores ativos na semana' }
  ],
  created_at: new Date().toISOString()
};

const MOCK_EMAILS: ComunicacaoEmailEquipe[] = [
  {
    id: 'em-1',
    nome: 'Pe. Coordenador da Comunicação',
    email: 'comunicacao@dehonianosbrm.org.br',
    cargo: 'Coordenador Provincial',
    telefone: '(47) 99999-1234',
    papel: 'coordenador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-2',
    nome: 'Comunicação BRM',
    email: 'comunicacao@dehonianosbrm.org.br',
    cargo: 'Coordenação e Planejamento',
    telefone: '(47) 98888-5678',
    papel: 'operador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-3',
    nome: 'Equipe de Criação & Audiovisual',
    email: 'criacao@dehonianosbrm.org.br',
    cargo: 'Produção Audiovisual & Roteiros',
    telefone: '(47) 97777-9012',
    papel: 'operador',
    ativo: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'em-4',
    nome: 'Designer / Arte Externa',
    email: 'arte@dehonianosbrm.org.br',
    cargo: 'Diretor de Arte & Designer',
    telefone: '(47) 96666-3456',
    papel: 'externo',
    ativo: true,
    created_at: new Date().toISOString()
  }
];

const MOCK_BRAND_ASSETS: ComunicacaoBrandAsset[] = [
  // Cores
  {
    id: 'ba-1',
    tipo: 'cor',
    nome: 'Azul Primário BRM',
    valor: '#226380',
    categoria: 'Paleta Oficial',
    descricao: 'Cor principal da Província BRM para títulos e destaques',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-2',
    tipo: 'cor',
    nome: 'Azul Escuro Cúria',
    valor: '#113240',
    categoria: 'Paleta Oficial',
    descricao: 'Usado para contrastes solenes e rodapés institucionais',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-3',
    tipo: 'cor',
    nome: 'Dourado Dehoniano',
    valor: '#d4af37',
    categoria: 'Paleta Oficial',
    descricao: 'Jubileus, comemorações de ordenação e datas nobres',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-4',
    tipo: 'cor',
    nome: 'Vermelho Coração de Jesus',
    valor: '#9b1b1b',
    categoria: 'Liturgia',
    descricao: 'Solenidades do Sagrado Coração e festas da congregação',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-c5',
    tipo: 'cor',
    nome: 'Verde Esperança Pastoral',
    valor: '#047857',
    categoria: 'Liturgia',
    descricao: 'Tempo Comum e ações sociais da Província',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-c6',
    tipo: 'cor',
    nome: 'Roxo Litúrgico Penitencial',
    valor: '#581c87',
    categoria: 'Liturgia',
    descricao: 'Tempo de Quaresma, Advento e sufrágios da congregação',
    created_at: new Date().toISOString()
  },

  // Logotipos
  {
    id: 'ba-5',
    tipo: 'logo',
    nome: 'Brasão Oficial Padres Dehonianos (SCJ)',
    valor: '/brasao-dehonianos.png',
    arquivo_url: '/brasao-dehonianos.png',
    categoria: 'Logotipos',
    extensao: 'png',
    tamanho: '141 KB',
    descricao: 'Insígnia oficial colorida da Congregação dos Padres do Sagrado Coração de Jesus',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-6',
    tipo: 'logo',
    nome: 'Logotipo Timbrado Província BRM',
    valor: '/logo-timbrado-brm.png',
    arquivo_url: '/logo-timbrado-brm.png',
    categoria: 'Logotipos',
    extensao: 'png',
    tamanho: '568 KB',
    descricao: 'Versão oficial completa com brasão, inscrição e fundo timbrado em alta definição',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-6b',
    tipo: 'logo',
    nome: 'Logotipo Oficial BRM (Branco / Fundo Transparente)',
    valor: '/logo-branco.png',
    arquivo_url: '/logo-branco.png',
    categoria: 'Logotipos',
    extensao: 'png',
    tamanho: '35 KB',
    descricao: 'Versão horizontal com brasão e tipografia institucional em transparência para artes escuras',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-6c',
    tipo: 'logo',
    nome: 'Cruz Dehoniana Oficial',
    valor: '/cruz-dehoniana.png',
    arquivo_url: '/cruz-dehoniana.png',
    categoria: 'Logotipos',
    extensao: 'png',
    tamanho: '1.2 KB',
    descricao: 'Símbolo da cruz dehoniana com o Sagrado Coração para assinaturas de posts',
    created_at: new Date().toISOString()
  },

  // Arquivos PSD (Photoshop / PhotoCraft)
  {
    id: 'ba-psd-1',
    tipo: 'psd',
    nome: 'Template_Feed_Instagram_1080x1080.psd',
    valor: '/templates/Template_Feed_Instagram_1080x1080.psd',
    arquivo_url: '/templates/Template_Feed_Instagram_1080x1080.psd',
    psd_ou_vetor_url: '/photocraft/index.html',
    categoria: 'Projetos PSD',
    extensao: 'psd',
    tamanho: '18.4 MB',
    descricao: 'Template padrão de post quadrado para o feed com grid de margens e logo fixo',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-psd-2',
    tipo: 'psd',
    nome: 'Template_Story_Reels_1080x1920.psd',
    valor: '/templates/Template_Story_Reels_1080x1920.psd',
    arquivo_url: '/templates/Template_Story_Reels_1080x1920.psd',
    psd_ou_vetor_url: '/photocraft/index.html',
    categoria: 'Projetos PSD',
    extensao: 'psd',
    tamanho: '24.1 MB',
    descricao: 'Layout vertical para aniversariantes, avisos rápidos e capas de Reels',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-psd-3',
    tipo: 'psd',
    nome: 'Arte_Jubileu_Sacerdotal_Editavel.psd',
    valor: '/templates/Arte_Jubileu_Sacerdotal_Editavel.psd',
    arquivo_url: '/templates/Arte_Jubileu_Sacerdotal_Editavel.psd',
    psd_ou_vetor_url: '/photocraft/index.html',
    categoria: 'Projetos PSD',
    extensao: 'psd',
    tamanho: '32.6 MB',
    descricao: 'Template para celebrações de ordenação e jubileus de padres e irmãos',
    created_at: new Date().toISOString()
  },

  // Vetores (VectorCraft / SVG)
  {
    id: 'ba-vet-1',
    tipo: 'vetor',
    nome: 'Brasao_Dehonianos_Vetor.svg',
    valor: '/templates/Brasao_Dehonianos_Vetor.svg',
    arquivo_url: '/templates/Brasao_Dehonianos_Vetor.svg',
    categoria: 'Vetores',
    extensao: 'svg',
    tamanho: '320 KB',
    descricao: 'Vetor escalável das insígnias e cruzes da congregação',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-vet-2',
    tipo: 'vetor',
    nome: 'Cruz_Dehoniana_Vetor.svg',
    valor: '/templates/Cruz_Dehoniana_Vetor.svg',
    arquivo_url: '/templates/Cruz_Dehoniana_Vetor.svg',
    categoria: 'Vetores',
    extensao: 'svg',
    tamanho: '180 KB',
    descricao: 'Cruz dehoniana com o Sagrado Coração vazado para fundos litúrgicos',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-vet-3',
    tipo: 'vetor',
    nome: 'Icone_Vetor_Provincia_BRM.svg',
    valor: '/favicon.svg',
    arquivo_url: '/favicon.svg',
    categoria: 'Vetores',
    extensao: 'svg',
    tamanho: '54 KB',
    descricao: 'Vetor de alta definição com aplicação do brasão e tipografia circular',
    created_at: new Date().toISOString()
  },

  // Tipografias / Fontes
  {
    id: 'ba-7',
    tipo: 'tipografia',
    nome: 'Instrument Serif',
    valor: 'Instrument Serif, serif',
    arquivo_url: 'https://fonts.google.com/specimen/Instrument+Serif',
    categoria: 'Tipografia',
    extensao: 'ttf',
    tamanho: '450 KB',
    descricao: 'Tipografia solene com serifa para títulos editoriais, encíclicas e citações de Pe. Dehon',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-8',
    tipo: 'tipografia',
    nome: 'Inter Display & Text',
    valor: 'Inter, sans-serif',
    arquivo_url: 'https://fonts.google.com/specimen/Inter',
    categoria: 'Tipografia',
    extensao: 'ttf',
    tamanho: '820 KB',
    descricao: 'Fonte padrão sem serifa da Província BRM para leitura clara em carrosséis e posts',
    created_at: new Date().toISOString()
  },
  {
    id: 'ba-9',
    tipo: 'tipografia',
    nome: 'Cinzel Decorative',
    valor: 'Cinzel, serif',
    arquivo_url: 'https://fonts.google.com/specimen/Cinzel',
    categoria: 'Tipografia',
    extensao: 'otf',
    tamanho: '510 KB',
    descricao: 'Usada exclusivamente em brasões episcopais, solenes e datas capitulares',
    created_at: new Date().toISOString()
  }
];

const MOCK_BENCHMARKING: ComunicacaoBenchmarking[] = [
  {
    id: 'bm-1',
    perfil_nome: 'Vatican News em Português',
    perfil_handle: '@vaticannewspt',
    canal: 'Instagram',
    url: 'https://instagram.com/vaticannewspt',
    pontos_fortes: 'Fotos documentais de alta qualidade, carrosséis explicativos com tipografia sóbria e cobertura pontual dos discursos do Papa.',
    ideias_inspiracao: 'Usar mais fotos históricas restauradas nas datas festivas da Província.',
    created_at: new Date().toISOString()
  },
  {
    id: 'bm-2',
    perfil_nome: 'CNBB Nacional',
    perfil_handle: '@cnbbnacional',
    canal: 'Instagram',
    url: 'https://instagram.com/cnbbnacional',
    pontos_fortes: 'Campanhas nacionais bem articuladas e comunicados oficiais imediatos.',
    ideias_inspiracao: 'Padronizar artes de notas de falecimento e transferências.',
    created_at: new Date().toISOString()
  }
];

const MOCK_ANIVERSARIANTES = [
  { id: 'rel-1', nome: 'Pe. André Marcelino, scj', dia: 14, mes: 11, tipo: 'natalicio' as const, comunidade: 'Paróquia São Sebastião - Joinville' },
  { id: 'rel-2', nome: 'Pe. Marcos Roberto, scj', dia: 24, mes: 11, tipo: 'ordenacao' as const, anos: 25, comunidade: 'Seminário Dehonista - Corupá' },
  { id: 'rel-3', nome: 'Ir. Francisco de Assis, scj', dia: 28, mes: 11, tipo: 'natalicio' as const, comunidade: 'Cúria Provincial - Brusque' }
];

export const SEED_RELIGIOSOS_CONTEUDO: ReligiosoConteudo[] = [
  {
    id: 'rel-anderson-viana',
    nome_religioso: 'Pe. Anderson Carlos S Viana, scj',
    nome_civil: 'Anderson Carlos S Viana',
    grau: 'Presbítero',
    data_nascimento: '1978-01-05',
    naturalidade_cidade: 'Criciúma',
    naturalidade_uf: 'SC',
    ordenacao_data: '2005-12-15',
    profissao_perpetua_data: '1998-02-02',
    comunidade_atual_nome: 'Cúria Provincial BRM - Brusque/SC',
    obra_atual_nome: 'Secretaria da Província BRM',
    diocese_atual: 'Arquidiocese de Florianópolis',
    cargo_funcao: 'Secretário Provincial & Ecônomo',
    foto_path: '/logo-branco.png',
    lema_destacado: 'ECCE VENIO — EIS QUE VENHO PARA FAZER A TUA VONTADE',
    lema_destacado_fase: 'Ordenação Presbiteral',
    email_institucional: 'secretaria@dehonianosbrm.org.br',
    telefone_celular: '(47) 99123-8899',
    telefone_whatsapp: '(47) 99123-8899',
    biografia: 'Pe. Anderson Carlos S. Viana, SCJ é sacerdote dehoniano com sólida dedicação pastoral e administrativa na Província Brasil Meridional (BRM), com atuação em Santa Catarina e Paraná, exercendo funções de secretaria provincial e animação litúrgica.',
    total_conteudos: 4,
    ultimo_conteudo_em: '2026-11-02T15:00:00Z'
  },
  {
    id: 'rel-tiago-waier',
    nome_religioso: 'Diác. Tiago Junior Waier, scj',
    nome_civil: 'Tiago Junior Waier',
    grau: 'Diácono',
    data_nascimento: '1995-11-09',
    naturalidade_cidade: 'Massaranduba',
    naturalidade_uf: 'SC',
    pais_nascimento: 'Brasil',
    primeira_profissao_data: '2018-02-02',
    profissao_perpetua_data: '2024-02-02',
    ordenacao_diaconal_data: '2025-12-08',
    ordenacao_data: '2025-12-08',
    ordenacao_local: 'Convento SCJ - Taubaté/SP',
    ordenacao_bispo: 'Dom Murilo Ramos Krieger, scj',
    profissao_local: 'Seminário Sagrado Coração de Jesus - Corupá/SC',
    paroquia_origem: 'Paróquia Sagrado Coração de Jesus',
    diocese_origem: 'Diocese de Joinville',
    comunidade_atual_nome: 'Conventinho SCJ - Taubaté/SP',
    obra_atual_nome: 'Faculdade Dehoniana / Formação Teológica',
    diocese_atual: 'Diocese de Taubaté',
    cargo_funcao: 'Diácono Dehoniano',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Ecce Venio — Eis que venho para fazer a tua vontade (Hb 10, 7)',
    lema_destacado_fase: 'Ordenação Diaconal',
    email_institucional: 'tiagowaier7@gmail.com',
    telefone_celular: '(47) 99123-8899',
    telefone_whatsapp: '(47) 99123-8899',
    redes_sociais: '@tiagowaier',
    instagram: '@tiagowaier',
    facebook: 'tiagowaier.scj',
    biografia: 'Diác. Tiago Junior Waier, SCJ é religioso dehoniano da Província Brasil Meridional (BRM), natural de Massaranduba/SC. Atualmente reside no Conventinho SCJ dedicando-se aos ministérios diaconais, formação pastoral e estudos teológicos.',
    total_conteudos: 2,
    ultimo_conteudo_em: '2026-11-04T11:00:00Z'
  },
  {
    id: 'rel-1',
    nome_religioso: 'Pe. André Marcelino, scj',
    nome_civil: 'André Marcelino',
    grau: 'Presbítero',
    data_nascimento: '1982-11-14',
    ordenacao_data: '2010-12-11',
    profissao_perpetua_data: '2008-02-02',
    comunidade_atual_nome: 'Comunidade São Sebastião - Joinville/SC',
    obra_atual_nome: 'Paróquia São Sebastião',
    cargo_funcao: 'Pároco',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Acolher no amor do Coração de Jesus (Jo 17, 21)',
    lema_destacado_fase: 'Ordenação Presbiteral',
    email_institucional: 'andre.marcelino@dehonianos.org.br',
    telefone_celular: '(47) 99123-4567',
    total_conteudos: 4,
    ultimo_conteudo_em: '2026-10-20T14:00:00Z'
  },
  {
    id: 'rel-2',
    nome_religioso: 'Pe. Marcos Roberto, scj',
    nome_civil: 'Marcos Roberto da Silva',
    grau: 'Presbítero',
    data_nascimento: '1974-06-25',
    ordenacao_data: '2001-11-24',
    profissao_perpetua_data: '1999-01-15',
    comunidade_atual_nome: 'Seminário Sagrado Coração de Jesus - Corupá/SC',
    obra_atual_nome: 'Seminário Dehonista',
    cargo_funcao: 'Reitor e Formador',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Ecce Venio — Eis-me aqui para fazer a tua vontade (Hb 10, 7)',
    lema_destacado_fase: 'Ordenação Presbiteral',
    email_institucional: 'marcos.roberto@dehonianos.org.br',
    telefone_celular: '(47) 98877-6655',
    total_conteudos: 2,
    ultimo_conteudo_em: '2026-10-05T10:30:00Z'
  },
  {
    id: 'rel-3',
    nome_religioso: 'Pe. Sildo César da Rosa, scj',
    nome_civil: 'Sildo César da Rosa',
    grau: 'Presbítero',
    data_nascimento: '1970-03-18',
    ordenacao_data: '1998-12-12',
    profissao_perpetua_data: '1996-02-02',
    comunidade_atual_nome: 'Cúria Provincial - Brusque/SC',
    obra_atual_nome: 'Governo Provincial BRM',
    cargo_funcao: 'Superior Provincial',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Para que todos tenham vida em abundância (Jo 10, 10)',
    lema_destacado_fase: 'Ordenação Presbiteral',
    email_institucional: 'provincial@dehonianos.org.br',
    telefone_celular: '(47) 99999-0001',
    total_conteudos: 6,
    ultimo_conteudo_em: '2026-11-01T09:00:00Z'
  },
  {
    id: 'rel-4',
    nome_religioso: 'Dom Murilo Sebastião Ramos Krieger, scj',
    nome_civil: 'Murilo Sebastião Ramos Krieger',
    grau: 'Bispo',
    data_nascimento: '1943-09-19',
    ordenacao_data: '1969-12-07',
    profissao_perpetua_data: '1964-02-02',
    comunidade_atual_nome: 'Convento Sagrado Coração de Jesus - Taubaté/SP',
    obra_atual_nome: 'Arquidiocese / Emérito',
    cargo_funcao: 'Arcebispo Emérito de Salvador',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Deus meus misericordia mea (Sl 58, 18)',
    lema_destacado_fase: 'Ordenação Episcopal',
    email_institucional: 'dommurilo@dehonianos.org.br',
    telefone_celular: '(12) 99888-7711',
    total_conteudos: 3,
    ultimo_conteudo_em: '2026-09-19T08:00:00Z'
  },
  {
    id: 'rel-5',
    nome_religioso: 'Pe. João Carlos de Almeida (Pe. Joãozinho, scj)',
    nome_civil: 'João Carlos de Almeida',
    grau: 'Presbítero',
    data_nascimento: '1964-05-10',
    ordenacao_data: '1992-12-15',
    profissao_perpetua_data: '1989-02-02',
    comunidade_atual_nome: 'Faculdade Dehoniana - Taubaté/SP',
    obra_atual_nome: 'Faculdade Dehoniana',
    cargo_funcao: 'Professor e Teólogo',
    foto_path: '/logo-branco.png',
    lema_destacado: 'Evangelizar a cultura e iluminar a mente (Cl 2, 3)',
    lema_destacado_fase: 'Ordenação Presbiteral',
    email_institucional: 'joaozinho@dehonianos.org.br',
    telefone_celular: '(12) 99111-2233',
    total_conteudos: 5,
    ultimo_conteudo_em: '2026-10-28T16:00:00Z'
  }
];

export const SEED_OBRAS_COMUNICACAO: ObraResumoComunicacao[] = [
  { id: 'obr-1', nome: 'Paróquia São Sebastião', tipo: 'Paróquia', cidade: 'Joinville', uf: 'SC', comunidade_nome: 'Comunidade São Sebastião' },
  { id: 'obr-2', nome: 'Paróquia São Luís Gonzaga', tipo: 'Paróquia', cidade: 'Brusque', uf: 'SC', comunidade_nome: 'Comunidade São Luís' },
  { id: 'obr-3', nome: 'Seminário Sagrado Coração de Jesus', tipo: 'Seminário', cidade: 'Corupá', uf: 'SC', comunidade_nome: 'Seminário Dehonista' },
  { id: 'obr-4', nome: 'Santuário N. Sra. de Azambuja', tipo: 'Santuário', cidade: 'Brusque', uf: 'SC', comunidade_nome: 'Azambuja' },
  { id: 'obr-5', nome: 'Faculdade Dehoniana', tipo: 'Instituição de Ensino Superior', cidade: 'Taubaté', uf: 'SP', comunidade_nome: 'Convento SCJ' },
  { id: 'obr-6', nome: 'Paróquia Imaculada Conceição', tipo: 'Paróquia', cidade: 'Curitiba', uf: 'PR', comunidade_nome: 'Comunidade Dehoniana Curitiba' },
  { id: 'obr-7', nome: 'Casa Padre Dehon', tipo: 'Casa de Retiros', cidade: 'Brusque', uf: 'SC', comunidade_nome: 'Cúria Provincial' }
];
